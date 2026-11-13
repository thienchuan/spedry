import React, { useMemo } from "react";
import { useAccount } from "wagmi";
import {
  TrendingUp, Bot, DollarSign, Activity, AlertTriangle,
  ArrowUpRight, RefreshCw
} from "lucide-react";
import { SpendryLogo } from "./SpendryLogo";
import { computeStatus } from "@/lib/chain";
import { useOwnerSpends, useOwnerVaults } from "@/hooks/useChainData";
import { formatUSDC, formatAddress, formatTs } from "@/lib/utils";
import { TokenUSDC } from "@web3icons/react";

interface Props {
  onNavigate: (view: "agents" | "history") => void;
}

export function Dashboard({ onNavigate }: Props) {
  const { address, isConnected } = useAccount();

  // Vault state is read from the contract; spend events from the explorer log API.
  const vaultsQ = useOwnerVaults(address);
  const spendsQ = useOwnerSpends(vaultsQ.data);

  const status = useMemo(() => (vaultsQ.data ? computeStatus(vaultsQ.data) : null), [vaultsQ.data]);
  const recentSpends = spendsQ.data?.slice(0, 5) ?? [];
  const loading = vaultsQ.isLoading || spendsQ.isLoading;
  const refreshing = vaultsQ.isFetching || spendsQ.isFetching;
  const error = vaultsQ.error
    ? "Could not read your vaults from Arc Testnet. Try Refresh."
    : spendsQ.error
    ? "Could not load spend events from the explorer. Try Refresh."
    : null;

  const { refetch: refetchVaults } = vaultsQ;
  const { refetch: refetchSpends } = spendsQ;
  const load = () => {
    void refetchVaults();
    void refetchSpends();
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
        <div
          className="rounded-3xl p-10 text-center max-w-md"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="mx-auto mb-5 flex justify-center">
            <SpendryLogo variant="mark" size={56} gradId="sgl-dash" />
          </div>
          <h1 className="display text-2xl font-700 mb-2" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
            Spendry
          </h1>
          <p className="text-sm mb-1" style={{ color: "var(--muted)" }}>
            Programmable USDC budgets for AI agents
          </p>
          <p className="text-xs mb-6" style={{ color: "var(--subtle)" }}>
            Define spend policies. Deploy to Arc. Your agents execute within bounds — every cent auditable onchain.
          </p>
          <div className="text-xs" style={{ color: "var(--subtle)" }}>
            Connect your wallet to get started
          </div>
        </div>
      </div>
    );
  }

  const statCards = status
    ? [
        { label: "Total Budget",     value: `$${status.totalBudgetUsdc}`,  sub: `${status.vaultCount} vault${status.vaultCount !== 1 ? "s" : ""}`, icon: DollarSign, color: "var(--accent)" },
        { label: "Total Spent",      value: `$${status.totalSpentUsdc}`,   sub: `${status.utilizationPct}% utilization`,    icon: TrendingUp,  color: "var(--success)" },
        { label: "Available Balance",value: `$${status.totalBalanceUsdc}`, sub: "Deposited across vaults",                  icon: Activity,    color: "var(--accent-hover)" },
        { label: "Active Agents",    value: String(status.activeVaults),   sub: `of ${status.vaultCount} vaults`,           icon: Bot,         color: "var(--muted)" },
      ]
    : null;

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="display text-xl font-700" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>Overview</h2>
          <p className="text-xs mt-0.5 mono" style={{ color: "var(--subtle)" }}>{formatAddress(address)}</p>
        </div>
        <button
          onClick={load}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40"
          style={{ background: "var(--surface-strong)", color: "var(--muted)", border: "1px solid var(--border)" }}
        >
          <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl px-4 py-3 text-sm"
          style={{ background: "var(--tint-danger)", border: "1px solid var(--tint-danger-border)", color: "var(--danger)" }}>
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />{error}
        </div>
      )}

      {loading && !status ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map((i) => <div key={i} className="rounded-2xl p-4 animate-pulse h-24" style={{ background: "var(--surface)" }} />)}
        </div>
      ) : statCards ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium" style={{ color: "var(--subtle)" }}>{label}</span>
                <div className="flex size-7 items-center justify-center rounded-lg" style={{ background: `${color}18` }}>
                  <Icon className="size-3.5" style={{ color }} />
                </div>
              </div>
              <div className="display text-2xl font-700 tabular-nums" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>{value}</div>
              <div className="text-[11px] mt-1" style={{ color: "var(--subtle)" }}>{sub}</div>
            </div>
          ))}
        </div>
      ) : null}

      {status && Number(status.totalBudgetUsdc) > 0 && (
        <div className="rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: "var(--ink-2)" }}>Portfolio Utilization</span>
            <span className="display text-sm font-700 tabular-nums" style={{ color: "var(--accent)" }}>{status.utilizationPct}%</span>
          </div>
          <div className="h-2 rounded-full" style={{ background: "var(--tint-accent-strong)" }}>
            <div className="h-2 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Number(status.utilizationPct))}%`, background: "linear-gradient(90deg, var(--accent) 0%, var(--accent-2) 100%)" }} />
          </div>
          <div className="flex justify-between mt-2 text-[11px]" style={{ color: "var(--subtle)" }}>
            <span>${status.totalSpentUsdc} spent</span>
            <span>${status.totalBudgetUsdc} budget</span>
          </div>
        </div>
      )}

      <div className="rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <span className="text-sm font-600" style={{ color: "var(--ink-2)" }}>Recent Spend Events</span>
          <button onClick={() => onNavigate("history")}
            className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70" style={{ color: "var(--accent)" }}>
            View all <ArrowUpRight className="size-3" />
          </button>
        </div>
        {loading && recentSpends.length === 0 ? (
          <div className="p-4 space-y-2">
            {[0,1,2].map((i) => <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: "var(--surface-strong)" }} />)}
          </div>
        ) : recentSpends.length === 0 ? (
          <div className="py-12 text-center">
            <Bot className="size-8 mx-auto mb-3" style={{ color: "var(--subtle)" }} />
            <p className="text-sm" style={{ color: "var(--subtle)" }}>No spend events yet.</p>
            <button onClick={() => onNavigate("agents")} className="mt-3 text-xs font-medium" style={{ color: "var(--accent)" }}>
              Create your first vault
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {recentSpends.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex size-8 items-center justify-center rounded-lg shrink-0" style={{ background: "var(--tint-success)" }}>
                  <TokenUSDC variant="branded" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: "var(--ink-2)" }}>{s.vault_name ?? `Vault #${s.vault_id}`}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: "var(--tint-accent)", color: "var(--subtle)" }}>Agent spend</span>
                  </div>
                  <div className="text-[11px] mt-0.5 mono truncate" style={{ color: "var(--subtle)" }}>→ {formatAddress(s.destination)}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-700 tabular-nums" style={{ color: "var(--success)" }}>{formatUSDC(s.amount_usdc)}</div>
                  <div className="text-[10px]" style={{ color: "var(--subtle)" }}>{formatTs(s.block_timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
