/**
 * Spendry chain data layer — reads straight from Arc Testnet, no backend.
 *
 * - Vault state (balance, budget, spent, limits, active) is read from the
 *   AgentVault contract with `getOwnerVaults` + `getVault`. That is canonical.
 * - Spend history comes from AgentSpend logs, fetched from the chain explorer's
 *   log API (it carries real block timestamps and filters by indexed topic, so
 *   the browser never crawls millions of blocks through a rate-limited RPC).
 *   Logs are decoded locally with the contract ABI.
 *
 * Amounts are USDC in the ERC-20 view (6 decimals). Number() is used for
 * display fields only, which is safe far below 2^53 base units.
 */
import {
  decodeEventLog,
  formatUnits,
  pad,
  toEventSelector,
  toHex,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import { arcTestnet } from "viem/chains";
import { AGENT_VAULT_ABI } from "@/lib/abi";
import { getUsdc, requireChain } from "@/onchain-facts";

export const CHAIN_ID = arcTestnet.id;
export const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS ?? "") as Address;
/** Block the contract was deployed at. Log queries start here, never at block 0. */
const DEPLOY_BLOCK = (import.meta.env.VITE_DEPLOY_BLOCK ?? "") as string;

const usdcFact = getUsdc(CHAIN_ID);
const USDC_DECIMALS_VIEW = usdcFact?.decimals ?? 6;

const AGENT_SPEND_TOPIC = toEventSelector(
  "event AgentSpend(uint256 indexed vaultId, address indexed agent, address indexed destination, uint256 amount, uint256 spentTotal, uint256 remainingBalance, bytes32 purposeHash)",
);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChainVault {
  id: number;
  owner_address: string;
  agent_address: string;
  name: string;
  balance_usdc: number;
  total_budget: number;
  spent_total: number;
  daily_limit: number;
  per_tx_limit: number;
  expiry: number;
  active: number;
  balance_usdc_fmt: string;
  total_budget_fmt: string;
  spent_total_fmt: string;
  utilization_pct: string;
}

export interface ChainSpend {
  id: string;
  vault_id: number;
  vault_name: string;
  agent_address: string;
  destination: string;
  amount_usdc: number;
  amount_usdc_fmt: string;
  purpose_hash: string;
  tx_hash: string;
  block_number: number;
  block_timestamp: number;
}

export interface StatusData {
  vaultCount: number;
  activeVaults: number;
  totalBudgetUsdc: string;
  totalSpentUsdc: string;
  totalBalanceUsdc: string;
  utilizationPct: string;
}

// ── Formatting ────────────────────────────────────────────────────────────────

/** Raw USDC base units -> "12.50" (at least 2 decimals, up to 6, no separators). */
export function fmtUsdc(raw: bigint): string {
  const [whole, frac = ""] = formatUnits(raw, USDC_DECIMALS_VIEW).split(".");
  return `${whole}.${frac.padEnd(2, "0")}`;
}

function pct(spent: bigint, budget: bigint): string {
  if (budget <= 0n) return "0.0";
  return (Number((spent * 1000n) / budget) / 10).toFixed(1);
}

// ── Vaults (contract reads) ───────────────────────────────────────────────────

export async function fetchOwnerVaults(client: PublicClient, owner: Address): Promise<ChainVault[]> {
  if (!CONTRACT_ADDRESS) throw new Error("VITE_CONTRACT_ADDRESS is not set");

  const ids = await client.readContract({
    address: CONTRACT_ADDRESS,
    abi: AGENT_VAULT_ABI,
    functionName: "getOwnerVaults",
    args: [owner],
  });
  if (ids.length === 0) return [];

  const rows = await Promise.all(
    ids.map((id) =>
      client.readContract({
        address: CONTRACT_ADDRESS,
        abi: AGENT_VAULT_ABI,
        functionName: "getVault",
        args: [id],
      }),
    ),
  );

  return rows.map((r, i) => {
    const [vOwner, agent, name, balance, totalBudget, spentTotal, dailyLimit, perTxLimit, expiry, active] = r;
    const id = Number(ids[i]);
    return {
      id,
      owner_address: vOwner,
      agent_address: agent,
      name,
      balance_usdc: Number(balance),
      total_budget: Number(totalBudget),
      spent_total: Number(spentTotal),
      daily_limit: Number(dailyLimit),
      per_tx_limit: Number(perTxLimit),
      expiry: Number(expiry),
      active: active ? 1 : 0,
      balance_usdc_fmt: fmtUsdc(balance),
      total_budget_fmt: fmtUsdc(totalBudget),
      spent_total_fmt: fmtUsdc(spentTotal),
      utilization_pct: pct(spentTotal, totalBudget),
    };
  });
}

export function computeStatus(vaults: ChainVault[]): StatusData {
  const sum = (pick: (v: ChainVault) => number) => vaults.reduce((s, v) => s + pick(v), 0);
  const budget = sum((v) => v.total_budget);
  const spent = sum((v) => v.spent_total);
  const balance = sum((v) => v.balance_usdc);
  return {
    vaultCount: vaults.length,
    activeVaults: vaults.filter((v) => v.active === 1).length,
    totalBudgetUsdc: fmtUsdc(BigInt(budget)),
    totalSpentUsdc: fmtUsdc(BigInt(spent)),
    totalBalanceUsdc: fmtUsdc(BigInt(balance)),
    utilizationPct: pct(BigInt(spent), BigInt(budget)),
  };
}

// ── Spend history (explorer log API) ──────────────────────────────────────────

interface RawLog {
  blockNumber: Hex;
  data: Hex;
  logIndex: Hex;
  timeStamp: Hex;
  topics: (Hex | null)[];
  transactionHash: Hex;
}

async function fetchExplorerLogs(filter: { topic0: Hex; topic1?: Hex; topic2?: Hex }): Promise<RawLog[]> {
  if (!CONTRACT_ADDRESS) throw new Error("VITE_CONTRACT_ADDRESS is not set");
  if (!DEPLOY_BLOCK) throw new Error("VITE_DEPLOY_BLOCK is not set");

  const params = new URLSearchParams({
    module: "logs",
    action: "getLogs",
    fromBlock: DEPLOY_BLOCK,
    toBlock: "latest",
    address: CONTRACT_ADDRESS,
    topic0: filter.topic0,
  });
  if (filter.topic1) {
    params.set("topic0_1_opr", "and");
    params.set("topic1", filter.topic1);
  }
  if (filter.topic2) {
    params.set("topic0_2_opr", "and");
    params.set("topic2", filter.topic2);
  }

  const url = `${requireChain(CHAIN_ID).explorerBase}/api?${params.toString()}`;

  const res = await fetch(url);
  if (res.status === 429) {
    throw new Error("The explorer log API rate limit was reached. Try again in a few minutes.");
  }
  if (!res.ok) throw new Error(`Explorer log API returned ${res.status}`);
  const body = (await res.json()) as { message?: string; result?: RawLog[] | string };
  if (Array.isArray(body.result)) return body.result;
  if (/no logs found/i.test(body.message ?? "")) return [];
  throw new Error(`Explorer log API: ${body.message ?? "unexpected response"}`);
}

/** The explorer log API returns at most this many logs per query. */
const EXPLORER_LOG_CAP = 1000;

export function decodeSpend(l: RawLog, vaultNames: Map<number, string>): ChainSpend | null {
  const topics = l.topics.filter((t): t is Hex => !!t) as [Hex, ...Hex[]];
  const { args } = decodeEventLog({ abi: AGENT_VAULT_ABI, eventName: "AgentSpend", data: l.data, topics });
  const vaultId = Number(args.vaultId);
  const vaultName = vaultNames.get(vaultId);
  if (vaultName === undefined) return null; // another owner's vault

  return {
    id: `${l.transactionHash}-${Number(BigInt(l.logIndex))}`,
    vault_id: vaultId,
    vault_name: vaultName,
    agent_address: args.agent,
    destination: args.destination,
    amount_usdc: Number(args.amount),
    amount_usdc_fmt: fmtUsdc(args.amount),
    purpose_hash: args.purposeHash,
    tx_hash: l.transactionHash,
    block_number: Number(BigInt(l.blockNumber)),
    block_timestamp: Number(BigInt(l.timeStamp)),
  };
}

/**
 * All spends across the owner's vaults, newest first.
 *
 * One query for every AgentSpend the contract has emitted, filtered locally to
 * the owner's vaults, keeps the request count constant however many vaults the
 * owner has. If the explorer's per-query cap is reached the list could be
 * missing the newest events, so it falls back to one query per vault
 * (filtered by the indexed vaultId), run one after another.
 */
export async function fetchOwnerSpends(
  vaults: Pick<ChainVault, "id" | "name" | "spent_total">[],
): Promise<ChainSpend[]> {
  // spentTotal only grows when AgentSpend is emitted, so a vault with 0 spent has
  // no events. Skipping those means an empty account makes no explorer request.
  const spentVaults = vaults.filter((v) => v.spent_total > 0);
  if (spentVaults.length === 0) return [];
  const names = new Map(spentVaults.map((v) => [v.id, v.name] as const));

  let logs = await fetchExplorerLogs({ topic0: AGENT_SPEND_TOPIC });
  if (logs.length >= EXPLORER_LOG_CAP) {
    logs = [];
    for (const v of spentVaults) {
      logs.push(...(await fetchExplorerLogs({ topic0: AGENT_SPEND_TOPIC, topic1: pad(toHex(v.id), { size: 32 }) })));
    }
  }

  return logs
    .map((l) => decodeSpend(l, names))
    .filter((s): s is ChainSpend => s !== null)
    .sort((a, b) => b.block_number - a.block_number || (a.id < b.id ? 1 : -1));
}
