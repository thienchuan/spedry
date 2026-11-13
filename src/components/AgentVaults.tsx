import React, { useEffect, useRef, useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import {
  Plus, Bot, RefreshCw, AlertTriangle, Play, Pause,
  ExternalLink, ChevronDown, ChevronUp,
  Loader2, DollarSign, Clock, Shield, TrendingDown, Zap
} from "lucide-react";
import { type Address } from "viem";
import { CreateVaultSheet } from "./CreateVaultSheet";
import { DepositSheet } from "./DepositSheet";
import { useOwnerSpends, useOwnerVaults } from "@/hooks/useChainData";
import { AGENT_VAULT_ABI } from "@/lib/abi";
import { buildAddressExplorerUrl, buildTxExplorerUrl } from "@/onchain-facts";
import { formatAddress, formatUSDCCompact, pctBar, formatExpiry, formatTs } from "@/lib/utils";
import { toast } from "sonner";

const CHAIN_ID = 5042002;
const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS ?? "") as Address;

export function AgentVaults() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const [showCreate, setShowCreate] = useState(false);
  const [depositVaultId, setDepositVaultId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const wrongChain = chainId !== CHAIN_ID;

  // Vaults are read from the contract; spends from the explorer log API.
  // Both queries are keyed by address / vault ids, so nothing refetches on re-render.
  const vaultsQ = useOwnerVaults(address);
  const spendsQ = useOwnerSpends(vaultsQ.data);
  const vaults = vaultsQ.data ?? [];
  const loading = vaultsQ.isLoading;
  const refreshing = vaultsQ.isFetching || spendsQ.isFetching;
  const error = vaultsQ.error ? "Could not read your vaults from Arc Testnet. Try again." : null;

  const { refetch: refetchVaults } = vaultsQ;
  const { refetch: refetchSpends } = spendsQ;
  const load = async () => {
    await Promise.all([refetchVaults(), refetchSpends()]);
  };

  const toggleExpand = (id: number) => setExpandedId((prev) => (prev === id ? null : id));

  // Pause/resume
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: txConfirming, isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Refresh once per confirmed transaction hash. Keying on the hash (not just
  // txSuccess) means a re-render can never trigger a second refresh.
  const notifiedTx = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!txSuccess || !txHash || notifiedTx.current === txHash) return;
    notifiedTx.current = txHash;
    toast.success("Transaction confirmed");
    void refetchVaults();
  }, [txSuccess, txHash, refetchVaults]);

  const handlePause = (vaultId: number) => {
    if (wrongChain) { switchChain({ chainId: CHAIN_ID }); return; }
    writeContract({ address: CONTRACT_ADDRESS, abi: AGENT_VAULT_ABI, functionName: "pauseVault", args: [BigInt(vaultId)], chainId: CHAIN_ID });
  };
  const handleResume = (vaultId: number) => {
    if (wrongChain) { switchChain({ chainId: CHAIN_ID }); return; }
    writeContract({ address: CONTRACT_ADDRESS, abi: AGENT_VAULT_ABI, functionName: "resumeVault", args: [BigInt(vaultId)], chainId: CHAIN_ID });
  };

  const nowTs = Math.floor(Date.now() / 1000);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="rounded-3xl p-10 text-center max-w-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl"
            style={{ background: "rgba(172,198,233,0.08)" }}>
            <Bot className="size-6" style={{ color: "var(--accent)" }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--ink-2)" }}>Connect your wallet</p>
          <p className="text-xs" style={{ color: "var(--subtle)" }}>Connect to view and manage your agent vaults</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="display text-xl font-700" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>Agent Vaults</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
            {vaults.length} vault{vaults.length !== 1 ? "s" : ""} · onchain spend policy enforcement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void load()} disabled={refreshing} aria-label="Refresh vaults"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40"
            style={{ background: "var(--surface-strong)", color: "var(--muted)", border: "1px solid var(--border)" }}>
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "var(--accent)", color: "#0a1525" }}>
            <Plus className="size-4" />New Vault
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl px-4 py-3 text-sm"
          style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.20)", color: "var(--danger)" }}>
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />{error}
        </div>
      )}

      {loading && vaults.length === 0 ? (
        <div className="space-y-3">
          {[0,1,2].map((i) => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "var(--surface)" }} />)}
        </div>
      ) : vaults.length === 0 ? (
        <div className="rounded-2xl py-14 text-center"
          style={{ background: "var(--surface)", border: "1px dashed var(--border)" }}>
          <Bot className="size-10 mx-auto mb-3" style={{ color: "var(--subtle)" }} />
          <p className="text-sm font-medium mb-1" style={{ color: "var(--ink-2)" }}>No vaults yet</p>
          <p className="text-xs mb-5" style={{ color: "var(--subtle)" }}>Create a vault to start managing your agent's USDC budget onchain</p>
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "var(--accent)", color: "#0a1525" }}>
            <Plus className="size-4" />Create First Vault
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {vaults.map((vault) => {
            const pct = pctBar(vault.spent_total, vault.total_budget);
            const isExpanded = expandedId === vault.id;
            const spends = spendsQ.data
              ? spendsQ.data.filter((s) => s.vault_id === vault.id).slice(0, 10)
              : undefined;
            const isActive = vault.active === 1;
            return (
              <div key={vault.id} className="rounded-2xl overflow-hidden"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl shrink-0"
                      style={{ background: isActive ? "rgba(172,198,233,0.10)" : "rgba(248,113,113,0.06)" }}>
                      <Bot className="size-5" style={{ color: isActive ? "var(--accent)" : "var(--danger)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="display text-sm font-700" style={{ color: "var(--ink)" }}>{vault.name}</span>
                        <StatusBadge active={vault.active} expiry={vault.expiry} nowTs={nowTs} />
                        <span className="text-[10px] mono px-1.5 py-0.5 rounded-md" style={{ background: "var(--surface-muted)", color: "var(--subtle)" }}>#{vault.id}</span>
                      </div>
                      <div className="text-[11px] mt-0.5 mono" style={{ color: "var(--subtle)" }}>Agent: {formatAddress(vault.agent_address)}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="display text-lg font-700 tabular-nums" style={{ color: "var(--ink)" }}>{vault.balance_usdc_fmt}</div>
                      <div className="text-[11px]" style={{ color: "var(--subtle)" }}>available</div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] mb-1.5" style={{ color: "var(--subtle)" }}>
                      <span>Spent: {vault.spent_total_fmt}</span>
                      <span>{vault.utilization_pct}% of {vault.total_budget_fmt}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "rgba(172,198,233,0.10)" }}>
                      <div className="h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: pct > 90 ? "var(--danger)" : pct > 70 ? "var(--warning)" : "linear-gradient(90deg, var(--accent), #5b87c5)" }} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {vault.daily_limit > 0 && <Pill icon={TrendingDown} label={`${formatUSDCCompact(vault.daily_limit)}/day`} title="Daily spend limit" />}
                    {vault.per_tx_limit > 0 && <Pill icon={Shield} label={`${formatUSDCCompact(vault.per_tx_limit)}/tx`} title="Per-transaction limit" />}
                    {vault.expiry > 0 && <Pill icon={Clock} label={`Expires ${formatExpiry(vault.expiry)}`} title="Policy expiry" />}
                    {vault.daily_limit === 0 && vault.per_tx_limit === 0 && vault.expiry === 0 && (
                      <Pill icon={Zap} label="Open policy" title="No rate limits set" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <button onClick={() => setDepositVaultId(vault.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{ background: "var(--accent)", color: "#0a1525" }}>
                      <DollarSign className="size-3.5" />Fund
                    </button>
                    {isActive ? (
                      <button onClick={() => handlePause(vault.id)} disabled={isPending || txConfirming}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40"
                        style={{ background: "rgba(232,109,122,0.08)", color: "var(--danger)", border: "1px solid rgba(232,109,122,0.15)" }}>
                        {(isPending || txConfirming) ? <Loader2 className="size-3.5 animate-spin" /> : <Pause className="size-3.5" />}Pause
                      </button>
                    ) : (
                      <button onClick={() => handleResume(vault.id)} disabled={isPending || txConfirming}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40"
                        style={{ background: "rgba(141,216,159,0.08)", color: "var(--success)", border: "1px solid rgba(141,216,159,0.15)" }}>
                        {(isPending || txConfirming) ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}Resume
                      </button>
                    )}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <a href={buildAddressExplorerUrl(CHAIN_ID, CONTRACT_ADDRESS)} target="_blank" rel="noreferrer"
                        aria-label="View contract on explorer"
                        className="flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.06]"
                        style={{ color: "var(--subtle)", border: "1px solid var(--border)" }}>
                        <ExternalLink className="size-3.5" />
                      </a>
                      <button onClick={() => toggleExpand(vault.id)}
                        aria-label={isExpanded ? "Collapse spends" : "Expand spends"}
                        className="flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.06]"
                        style={{ color: "var(--subtle)", border: "1px solid var(--border)" }}>
                        {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-4 py-3" style={{ borderColor: "var(--border)", background: "rgba(0,0,0,0.15)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-600" style={{ color: "var(--ink-2)" }}>Recent Spend Events</span>
                      <span className="text-[11px]" style={{ color: "var(--subtle)" }}>Last 10 · onchain</span>
                    </div>
                    {spendsQ.isError ? (
                      <p className="text-xs py-3" style={{ color: "var(--danger)" }}>
                        Could not load spend events from the explorer. Try Refresh.
                      </p>
                    ) : !spends ? (
                      <div className="space-y-2">
                        {[0,1].map((i) => <div key={i} className="h-9 rounded-xl animate-pulse" style={{ background: "var(--surface)" }} />)}
                      </div>
                    ) : spends.length === 0 ? (
                      <p className="text-xs py-3" style={{ color: "var(--subtle)" }}>No spends recorded yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {spends.map((s) => (
                          <div key={s.id} className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: "var(--surface)" }}>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs mono truncate" style={{ color: "var(--muted)" }}>→ {formatAddress(s.destination)}</div>
                              <div className="text-[10px]" style={{ color: "var(--subtle)" }}>{formatTs(s.block_timestamp)}</div>
                            </div>
                            <div className="text-xs font-700 tabular-nums" style={{ color: "var(--success)" }}>{s.amount_usdc_fmt}</div>
                            <a href={buildTxExplorerUrl(CHAIN_ID, s.tx_hash)} target="_blank" rel="noreferrer">
                              <ExternalLink className="size-3.5" style={{ color: "var(--subtle)" }} />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CreateVaultSheet open={showCreate} onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); void load(); }} />
      {depositVaultId !== null && (
        <DepositSheet vaultId={depositVaultId} open
          onClose={() => setDepositVaultId(null)}
          onDeposited={() => { setDepositVaultId(null); void load(); }} />
      )}
    </div>
  );
}

function StatusBadge({ active, expiry, nowTs }: { active: number; expiry: number; nowTs: number }) {
  const isExpired = expiry > 0 && expiry < nowTs;
  if (!active) return <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ background: "rgba(248,113,113,0.10)", color: "var(--danger)" }}>Paused</span>;
  if (isExpired) return <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ background: "rgba(251,146,60,0.10)", color: "var(--warning)" }}>Expired</span>;
  return <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ background: "rgba(74,222,128,0.08)", color: "var(--success)" }}>Active</span>;
}

function Pill({ icon: Icon, label, title }: { icon: React.ElementType; label: string; title?: string }) {
  return (
    <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg"
      style={{ background: "var(--surface-muted)", color: "var(--subtle)" }} title={title}>
      <Icon className="size-3" aria-hidden="true" />{label}
    </span>
  );
}
