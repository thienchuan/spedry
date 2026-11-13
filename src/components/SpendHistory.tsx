import React, { useState } from "react";
import { useAccount } from "wagmi";
import { History, ExternalLink, RefreshCw, AlertTriangle, Bot } from "lucide-react";
import { useOwnerSpends, useOwnerVaults } from "@/hooks/useChainData";
import { buildTxExplorerUrl } from "@/onchain-facts";
import { formatAddress, formatTs } from "@/lib/utils";
import { TokenUSDC } from "@web3icons/react";

const CHAIN_ID = 5042002;
const PAGE_SIZE = 25;

export function SpendHistory() {
  const { address, isConnected } = useAccount();
  const vaultsQ = useOwnerVaults(address);
  const spendsQ = useOwnerSpends(vaultsQ.data);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const all = spendsQ.data ?? [];
  const spends = all.slice(0, visible);
  const hasMore = all.length > visible;
  const loading = vaultsQ.isLoading || spendsQ.isLoading;
  const refreshing = vaultsQ.isFetching || spendsQ.isFetching;
  const error = vaultsQ.error
    ? "Could not read your vaults from Arc Testnet. Try Refresh."
    : spendsQ.error
    ? "Could not load spend history from the explorer. Try Refresh."
    : null;

  const { refetch: refetchVaults } = vaultsQ;
  const { refetch: refetchSpends } = spendsQ;
  const load = async () => {
    await Promise.all([refetchVaults(), refetchSpends()]);
  };

  const loadMore = () => setVisible((n) => n + PAGE_SIZE);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="rounded-3xl p-10 text-center max-w-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl"
            style={{ background: "var(--tint-accent)" }}>
            <History className="size-6" style={{ color: "var(--accent)" }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--ink-2)" }}>Connect your wallet</p>
          <p className="text-xs" style={{ color: "var(--subtle)" }}>Connect to view your agents' spend history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="display text-xl font-700" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>Spend History</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
            {all.length} event{all.length !== 1 ? "s" : ""} · from Arc Testnet logs
          </p>
        </div>
        <button onClick={() => void load()} disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40"
          style={{ background: "var(--surface-strong)", color: "var(--muted)", border: "1px solid var(--border)" }}>
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

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="hidden sm:grid grid-cols-[1fr_120px_180px_100px_40px] gap-4 px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium"
          style={{ background: "var(--inset)", borderBottom: "1px solid var(--border)", color: "var(--subtle)" }}>
          <span>Agent / Vault</span>
          <span>Destination</span>
          <span>Time</span>
          <span className="text-right">Amount</span>
          <span />
        </div>

        {loading && spends.length === 0 ? (
          <div className="p-4 space-y-2">
            {[0,1,2,3,4].map((i) => <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: "var(--surface-strong)" }} />)}
          </div>
        ) : spends.length === 0 ? (
          <div className="py-16 text-center">
            <Bot className="size-10 mx-auto mb-3" style={{ color: "var(--subtle)" }} />
            <p className="text-sm font-medium mb-1" style={{ color: "var(--ink-2)" }}>No spend events yet</p>
            <p className="text-xs" style={{ color: "var(--subtle)" }}>Once your agents start spending USDC, every transaction appears here.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {spends.map((s) => (
              <div key={s.id} className="flex sm:grid sm:grid-cols-[1fr_120px_180px_100px_40px] items-center gap-3 sm:gap-4 px-4 py-3 hover:bg-[var(--hover)] transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex size-7 items-center justify-center rounded-lg shrink-0" style={{ background: "var(--tint-success)" }}>
                    <TokenUSDC variant="branded" size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate" style={{ color: "var(--ink-2)" }}>{s.vault_name ?? `Vault #${s.vault_id}`}</div>
                    <div className="text-[10px] mono" style={{ color: "var(--subtle)" }}>{formatAddress(s.agent_address)}</div>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs mono" style={{ color: "var(--muted)" }}>{formatAddress(s.destination)}</div>
                </div>
                <div className="hidden sm:block text-xs" style={{ color: "var(--subtle)" }}>{formatTs(s.block_timestamp)}</div>
                <div className="text-right ml-auto sm:ml-0">
                  <div className="text-sm font-700 tabular-nums" style={{ color: "var(--success)" }}>{s.amount_usdc_fmt}</div>
                  <div className="text-[10px] sm:hidden" style={{ color: "var(--subtle)" }}>{formatTs(s.block_timestamp)}</div>
                </div>
                <div className="hidden sm:flex justify-center">
                  <a href={buildTxExplorerUrl(CHAIN_ID, s.tx_hash)} target="_blank" rel="noreferrer"
                    className="flex size-7 items-center justify-center rounded-lg transition-all hover:bg-[var(--hover)]"
                    style={{ color: "var(--subtle)" }}>
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
            <button onClick={loadMore} disabled={loading}
              className="w-full text-xs font-medium py-2 rounded-xl transition-all hover:opacity-80 disabled:opacity-40"
              style={{ background: "var(--surface-strong)", color: "var(--muted)" }}>
              {loading ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
