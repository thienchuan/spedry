/**
 * Spendry API client — thin wrapper over /api/* (proxied to backend).
 * All data returned is ONCHAIN_INDEXED or DERIVED unless noted USER_GENERATED.
 */

const BASE = "/api";

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok) throw new Error(`API ${path} failed: ${r.status}`);
  return r.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`API ${path} failed: ${r.status}`);
  return r.json() as Promise<T>;
}

export interface VaultSummary {
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
  created_at: number;
  tx_hash: string;
  block_number: number;
  // formatted
  balance_usdc_fmt: string;
  total_budget_fmt: string;
  spent_total_fmt: string;
  utilization_pct: string;
}

export interface SpendEvent {
  id: number;
  vault_id: number;
  agent_address: string;
  destination: string;
  amount_usdc: number;
  spent_total: number;
  remaining_balance: number;
  purpose_hash: string;
  purpose_text: string | null;
  tx_hash: string;
  block_number: number;
  block_timestamp: number;
  reconciled: number;
  amount_usdc_fmt: string;
  vault_name?: string;
}

export interface StatusData {
  vaultCount: number;
  activeVaults: number;
  totalBudgetUsdc: string;
  totalSpentUsdc: string;
  totalBalanceUsdc: string;
  utilizationPct: string;
}

export interface Destination {
  vault_id: number;
  address: string;
  label: string | null;
  added_at: number;
}

export const apiClient = {
  getStatus: (owner: string) => get<{ data_source: string } & StatusData>(`/status?owner=${owner}`),
  getVaults: (owner: string) => get<{ data_source: string; vaults: VaultSummary[] }>(`/vaults?owner=${owner}`),
  getVault: (id: number) => get<{ data_source: string; vault: VaultSummary & { active: number }; destinations: Destination[]; spendCount: number }>(`/vaults/${id}`),
  getVaultSpends: (id: number, limit = 50, offset = 0) =>
    get<{ data_source: string; total: number; spends: SpendEvent[] }>(`/vaults/${id}/spends?limit=${limit}&offset=${offset}`),
  getAllSpends: (owner: string, limit = 50, offset = 0) =>
    get<{ data_source: string; spends: SpendEvent[] }>(`/spends?owner=${owner}&limit=${limit}&offset=${offset}`),
  addDestinationLabel: (vaultId: number, address: string, label: string) =>
    post<{ ok: boolean }>(`/vaults/${vaultId}/destinations`, { address, label }),
  getIndexerStatus: () => get<{ vaultCount: number; spendCount: number; checkpoints: unknown[] }>("/indexer"),
};
