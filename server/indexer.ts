/**
 * Spendry onchain event indexer.
 * Reads AgentVault events from Arc Testnet and writes to the SQLite cache.
 *
 * DATA SOURCE: ONCHAIN_INDEXED — all records here are rebuildable from chain events.
 * Never promote indexed data to canonical financial state; always re-verify against
 * the contract for any security-critical decision.
 *
 * Indexing rules:
 * - Never scans from block 0. Starts at deployment block or checkpoint.
 * - Idempotent: INSERT OR IGNORE on tx_hash uniqueness.
 * - Resumable: persists last-indexed block in checkpoints table.
 * - Bounded: 2000-block batches with exponential backoff on RPC failures.
 */
import { createPublicClient, http, parseAbiItem, type Address } from "viem";
import { requireChain } from "../src/onchain-facts.js";
import { q } from "./db.js";

const CHAIN_ID = Number(process.env.CHAIN_ID ?? "5042002"); // Arc Testnet
const CONTRACT_ADDRESS = (process.env.VITE_CONTRACT_ADDRESS ?? "") as Address;
const BATCH_SIZE = 500;          // conservative default; reduces rate-limit exposure
const BATCH_SIZE_CATCHUP = 2000; // used only when proxy RPC is available
const POLL_INTERVAL_MS = 10_000;
const RATE_LIMIT_BACKOFF_MS = 60_000; // back off 60s on -32005

// Build RPC URL: use proxy when available, fall back to registry value.
// The registry value is read from onchain-facts, never typed from memory.
const proxyChains = (process.env.RPC_PROXY_CHAINS ?? "").split(",").map((s) => s.trim());
const compassChain = "Arc_Testnet";
const registryChain = requireChain(CHAIN_ID);
const hasProxy = !!process.env.RPC_PROXY_BASE_URL && proxyChains.includes(compassChain);
const rpcUrl = hasProxy
  ? `${process.env.RPC_PROXY_BASE_URL}/api/rpc/${compassChain}?_rpc_token=${process.env.RPC_PROXY_TOKEN}`
  : registryChain.rpcUrls[0]; // falls back to public RPC; rate-limit risk under load

const effectiveBatchSize = hasProxy ? BATCH_SIZE_CATCHUP : BATCH_SIZE;

const client = createPublicClient({ transport: http(rpcUrl) });

// ── ABI fragments ─────────────────────────────────────────────────────────────

const VaultCreatedAbi = parseAbiItem(
  "event VaultCreated(uint256 indexed vaultId, address indexed owner, address indexed agent, string name, uint256 totalBudget, uint128 dailyLimit, uint128 perTxLimit, uint64 expiry)"
);
const VaultFundedAbi = parseAbiItem(
  "event VaultFunded(uint256 indexed vaultId, address indexed funder, uint256 amount, uint256 newBalance)"
);
const AgentSpendAbi = parseAbiItem(
  "event AgentSpend(uint256 indexed vaultId, address indexed agent, address indexed destination, uint256 amount, uint256 spentTotal, uint256 remainingBalance, bytes32 purposeHash)"
);
const VaultActiveChangedAbi = parseAbiItem(
  "event VaultActiveChanged(uint256 indexed vaultId, bool active, address indexed by)"
);
const VaultWithdrawnAbi = parseAbiItem(
  "event VaultWithdrawn(uint256 indexed vaultId, address indexed to, uint256 amount)"
);

// ── Batch processing ──────────────────────────────────────────────────────────

async function indexBatch(fromBlock: bigint, toBlock: bigint) {
  if (!CONTRACT_ADDRESS) return;

  const [creates, funds, spends, actives, withdraws] = await Promise.all([
    client.getLogs({ address: CONTRACT_ADDRESS, event: VaultCreatedAbi, fromBlock, toBlock }),
    client.getLogs({ address: CONTRACT_ADDRESS, event: VaultFundedAbi, fromBlock, toBlock }),
    client.getLogs({ address: CONTRACT_ADDRESS, event: AgentSpendAbi, fromBlock, toBlock }),
    client.getLogs({ address: CONTRACT_ADDRESS, event: VaultActiveChangedAbi, fromBlock, toBlock }),
    client.getLogs({ address: CONTRACT_ADDRESS, event: VaultWithdrawnAbi, fromBlock, toBlock }),
  ]);

  for (const log of creates) {
    const a = log.args as {
      vaultId: bigint; owner: string; agent: string; name: string;
      totalBudget: bigint; dailyLimit: bigint; perTxLimit: bigint; expiry: bigint;
    };
    q.upsertVault.run({
      $id: Number(a.vaultId),
      $owner: a.owner.toLowerCase(),
      $agent: a.agent.toLowerCase(),
      $name: a.name,
      $balance: 0,
      $totalBudget: Number(a.totalBudget),
      $spent: 0,
      $dailyLimit: Number(a.dailyLimit),
      $perTxLimit: Number(a.perTxLimit),
      $expiry: Number(a.expiry),
      $active: 1,
      $txHash: log.transactionHash,
      $blockNumber: Number(log.blockNumber),
    });
  }

  for (const log of funds) {
    const a = log.args as {
      vaultId: bigint; funder: string; amount: bigint; newBalance: bigint;
    };
    q.insertDeposit.run({
      $vaultId: Number(a.vaultId),
      $funder: a.funder.toLowerCase(),
      $amount: Number(a.amount),
      $newBalance: Number(a.newBalance),
      $txHash: log.transactionHash,
      $blockNumber: Number(log.blockNumber),
      $blockTs: Math.floor(Date.now() / 1000),
    });
    q.updateVaultBalance.run({ $id: Number(a.vaultId), $balance: Number(a.newBalance) });
  }

  for (const log of spends) {
    const a = log.args as {
      vaultId: bigint; agent: string; destination: string; amount: bigint;
      spentTotal: bigint; remainingBalance: bigint; purposeHash: string;
    };
    q.insertSpend.run({
      $vaultId: Number(a.vaultId),
      $agent: a.agent.toLowerCase(),
      $dest: a.destination.toLowerCase(),
      $amount: Number(a.amount),
      $spentTotal: Number(a.spentTotal),
      $remaining: Number(a.remainingBalance),
      $purposeHash: a.purposeHash,
      $purposeText: null,
      $txHash: log.transactionHash,
      $blockNumber: Number(log.blockNumber),
      $blockTs: Math.floor(Date.now() / 1000),
    });
    q.updateVaultSpent.run({ $id: Number(a.vaultId), $spent: Number(a.spentTotal), $balance: Number(a.remainingBalance) });
  }

  for (const log of actives) {
    const a = log.args as { vaultId: bigint; active: boolean };
    q.updateVaultActive.run({ $id: Number(a.vaultId), $active: a.active ? 1 : 0 });
  }

  for (const log of withdraws) {
    const a = log.args as { vaultId: bigint };
    q.updateVaultActive.run({ $id: Number(a.vaultId), $active: 0 });
  }
}

// ── Indexer loop ──────────────────────────────────────────────────────────────

let running = false;

export async function startIndexer(deployBlock?: number) {
  if (running) return;
  running = true;

  if (!CONTRACT_ADDRESS) {
    console.log("[indexer] No contract address configured — indexer idle");
    return;
  }

  console.log(
    `[indexer] Starting — chain ${CHAIN_ID}, contract ${CONTRACT_ADDRESS}`,
    hasProxy ? "(proxy RPC)" : "(public RPC — rate-limit risk)",
    `batch=${effectiveBatchSize}`
  );

  const isRateLimit = (e: unknown): boolean => {
    if (e && typeof e === "object") {
      const code = (e as { code?: number }).code;
      if (code === -32005) return true;
      const msg = String((e as { message?: string }).message ?? "").toLowerCase();
      if (msg.includes("rate limit") || msg.includes("limit exceeded")) return true;
    }
    return false;
  };

  const poll = async () => {
    try {
      const head = Number(await client.getBlockNumber());
      const row = q.getCheckpoint.get({ $chainId: CHAIN_ID }) as { last_block: number } | undefined;
      const from = row?.last_block ?? deployBlock ?? Math.max(0, head - 5000);

      if (from >= head) {
        setTimeout(poll, POLL_INTERVAL_MS);
        return;
      }

      const to = Math.min(from + effectiveBatchSize, head);
      await indexBatch(BigInt(from + 1), BigInt(to));
      q.setCheckpoint.run({ $chainId: CHAIN_ID, $block: to });

      const remaining = head - to;
      if (remaining > 0) {
        console.log(`[indexer] Syncing... ${remaining} blocks behind head (head=${head})`);
        setImmediate(poll);
      } else {
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    } catch (e) {
      if (isRateLimit(e)) {
        console.warn(`[indexer] Rate limited by RPC — backing off ${RATE_LIMIT_BACKOFF_MS / 1000}s`);
        setTimeout(poll, RATE_LIMIT_BACKOFF_MS);
      } else {
        console.error("[indexer] poll error:", e);
        setTimeout(poll, POLL_INTERVAL_MS * 3);
      }
    }
  };

  poll();
}
