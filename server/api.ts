/**
 * Spendry REST API server.
 * Runs on port 3001. Frontend connects via Vite proxy at /api.
 *
 * All financial data is labeled by source:
 *   ONCHAIN_INDEXED — read from chain events, rebuildable
 *   USER_GENERATED  — user-supplied metadata (labels, purpose text)
 *   DERIVED         — computed from indexed data
 */
import { db, q } from "./db.js";
import { startIndexer } from "./indexer.js";

const PORT = Number(process.env.PORT ?? 3001);

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

function err(msg: string, status = 400): Response {
  return json({ error: msg }, status);
}

function formatUsdc(raw: number): string {
  return (raw / 1_000_000).toFixed(6);
}

// Pagination helper
function paginate(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
  const offset = Number(url.searchParams.get("offset") ?? 0);
  return { limit, offset };
}

// ── Route handlers ────────────────────────────────────────────────────────────

function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function getStatus(req: Request): Response {
  const url = new URL(req.url);
  const owner = url.searchParams.get("owner")?.toLowerCase();
  if (!owner) return err("owner required");

  const vaults = q.getVaults.all({ $owner: owner }) as Array<Record<string, unknown>>;
  const totalBudget = vaults.reduce((s, v) => s + Number(v.total_budget), 0);
  const totalSpent = vaults.reduce((s, v) => s + Number(v.spent_total), 0);
  const totalBalance = vaults.reduce((s, v) => s + Number(v.balance_usdc), 0);
  const activeVaults = vaults.filter((v) => v.active).length;

  return json({
    // DERIVED from ONCHAIN_INDEXED
    data_source: "DERIVED",
    vaultCount: vaults.length,
    activeVaults,
    totalBudgetUsdc: formatUsdc(totalBudget),
    totalSpentUsdc: formatUsdc(totalSpent),
    totalBalanceUsdc: formatUsdc(totalBalance),
    utilizationPct: totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : "0.0",
  });
}

function getVaults(req: Request): Response {
  const url = new URL(req.url);
  const owner = url.searchParams.get("owner")?.toLowerCase();
  if (!owner) return err("owner required");

  const vaults = q.getVaults.all({ $owner: owner }) as Array<Record<string, unknown>>;
  return json({
    data_source: "ONCHAIN_INDEXED",
    vaults: vaults.map((v) => ({
      ...v,
      balance_usdc_fmt: formatUsdc(Number(v.balance_usdc)),
      total_budget_fmt: formatUsdc(Number(v.total_budget)),
      spent_total_fmt: formatUsdc(Number(v.spent_total)),
      utilization_pct: Number(v.total_budget) > 0
        ? ((Number(v.spent_total) / Number(v.total_budget)) * 100).toFixed(1)
        : "0.0",
    })),
  });
}

function getVault(req: Request, id: string): Response {
  const vault = q.getVaultById.get({ $id: Number(id) }) as Record<string, unknown> | undefined;
  if (!vault) return err("vault not found", 404);

  const dests = q.getDestinations.all({ $vaultId: Number(id) });
  const spendCount = (q.getSpendCount.get({ $vaultId: Number(id) }) as { cnt: number }).cnt;

  return json({
    data_source: "ONCHAIN_INDEXED",
    vault: {
      ...vault,
      balance_usdc_fmt: formatUsdc(Number(vault.balance_usdc)),
      total_budget_fmt: formatUsdc(Number(vault.total_budget)),
      spent_total_fmt: formatUsdc(Number(vault.spent_total)),
      utilization_pct: Number(vault.total_budget) > 0
        ? ((Number(vault.spent_total) / Number(vault.total_budget)) * 100).toFixed(1)
        : "0.0",
    },
    destinations: dests,
    spendCount,
  });
}

function getSpends(req: Request, vaultId: string): Response {
  const { limit, offset } = paginate(req);
  const spends = q.getSpends.all({ $vaultId: Number(vaultId), $limit: limit, $offset: offset }) as Array<Record<string, unknown>>;
  const total = (q.getSpendCount.get({ $vaultId: Number(vaultId) }) as { cnt: number }).cnt;

  return json({
    data_source: "ONCHAIN_INDEXED",
    total,
    limit,
    offset,
    spends: spends.map((s) => ({
      ...s,
      amount_usdc_fmt: formatUsdc(Number(s.amount_usdc)),
    })),
  });
}

function getAllSpends(req: Request): Response {
  const url = new URL(req.url);
  const owner = url.searchParams.get("owner")?.toLowerCase();
  if (!owner) return err("owner required");
  const { limit, offset } = paginate(req);

  const spends = q.getAllSpends.all({ $owner: owner, $limit: limit, $offset: offset }) as Array<Record<string, unknown>>;

  return json({
    data_source: "ONCHAIN_INDEXED",
    spends: spends.map((s) => ({
      ...s,
      amount_usdc_fmt: formatUsdc(Number(s.amount_usdc)),
    })),
  });
}

async function upsertDestinationLabel(req: Request, vaultId: string): Promise<Response> {
  const body = await req.json() as { address?: string; label?: string };
  if (!body.address) return err("address required");

  q.upsertDestination.run({
    $vaultId: Number(vaultId),
    $address: body.address.toLowerCase(),
    $label: body.label ?? null,
  });

  return json({ ok: true, data_source: "USER_GENERATED" });
}

function getIndexerStatus(): Response {
  const checkpoints = db.prepare("SELECT * FROM index_checkpoints").all();
  const spendCount = (db.prepare("SELECT COUNT(*) as cnt FROM spend_events").get() as { cnt: number }).cnt;
  const vaultCount = (db.prepare("SELECT COUNT(*) as cnt FROM vaults").get() as { cnt: number }).cnt;

  return json({
    data_source: "DERIVED",
    checkpoints,
    spendCount,
    vaultCount,
  });
}

// ── Router ────────────────────────────────────────────────────────────────────

async function router(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // GET /health
    if (req.method === "GET" && path === "/health") {
      return json({ ok: true, ts: Date.now() });
    }

    // GET /status?owner=0x...
    if (req.method === "GET" && path === "/status") return getStatus(req);

    // GET /vaults?owner=0x...
    if (req.method === "GET" && path === "/vaults") return getVaults(req);

    // GET /vaults/:id
    const vaultMatch = path.match(/^\/vaults\/(\d+)$/);
    if (req.method === "GET" && vaultMatch) return getVault(req, vaultMatch[1]);

    // GET /vaults/:id/spends
    const spendsMatch = path.match(/^\/vaults\/(\d+)\/spends$/);
    if (req.method === "GET" && spendsMatch) return getSpends(req, spendsMatch[1]);

    // POST /vaults/:id/destinations
    const destMatch = path.match(/^\/vaults\/(\d+)\/destinations$/);
    if (req.method === "POST" && destMatch) return upsertDestinationLabel(req, destMatch[1]);

    // GET /spends?owner=0x...
    if (req.method === "GET" && path === "/spends") return getAllSpends(req);

    // GET /indexer
    if (req.method === "GET" && path === "/indexer") return getIndexerStatus();

    return err("not found", 404);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api] unhandled error:", msg);
    return err(`internal server error: ${msg}`, 500);
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────

const deployBlock = process.env.DEPLOY_BLOCK ? Number(process.env.DEPLOY_BLOCK) : undefined;
startIndexer(deployBlock);

Bun.serve({ port: PORT, fetch: router });
console.log(`[api] Spendry API server running on port ${PORT}`);
