import React from "react";
import { useAccount } from "wagmi";
import {
  ExternalLink, Copy, CheckCircle2, Shield, Zap,
  Code2, FileText, AlertCircle, Palette
} from "lucide-react";
import { getUsdc, requireChain } from "@/onchain-facts";
import { formatAddress } from "@/lib/utils";
import { toast } from "sonner";
import { ThemeSwitch } from "./ThemeToggle";

const CHAIN_ID = 5042002;
const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS ?? "") as string;

export function SettingsPage() {
  const { address, isConnected } = useAccount();
  const chain = requireChain(CHAIN_ID);
  const usdcFact = getUsdc(CHAIN_ID);

  const copy = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h2 className="display text-xl font-700" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
          Settings
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
          Contract configuration and developer references
        </p>
      </div>

      {/* Appearance */}
      <Card title="Appearance" icon={Palette}>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs" style={{ color: "var(--subtle)" }}>Theme</span>
          <ThemeSwitch />
        </div>
      </Card>

      {/* Network info */}
      <Card title="Network" icon={Zap}>
        <Row label="Chain" value={chain.name} />
        <Row label="Chain ID" value={String(chain.chainId)} mono />
        <Row label="Explorer" value={chain.explorerBase} link={chain.explorerBase} />
        <Row label="USDC (ERC-20)" value={usdcFact?.address ?? "—"} mono copyable={usdcFact?.address} onCopy={copy} />
        <Row label="USDC decimals" value={String(usdcFact?.decimals ?? "—")} />
      </Card>

      {/* Contract */}
      <Card title="AgentVault Contract" icon={Code2}>
        {CONTRACT_ADDRESS ? (
          <>
            <Row
              label="Address"
              value={formatAddress(CONTRACT_ADDRESS)}
              mono copyable={CONTRACT_ADDRESS} onCopy={copy}
            />
            <Row
              label="Explorer"
              value="View contract"
              link={`${chain.explorerBase}/address/${CONTRACT_ADDRESS}`}
            />
          </>
        ) : (
          <div className="flex items-start gap-2 py-2 text-xs" style={{ color: "var(--warning)" }}>
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-0.5">Contract not deployed</p>
              <p style={{ color: "var(--subtle)" }}>
                Deploy AgentVault.sol to Arc Testnet and set VITE_CONTRACT_ADDRESS in .env
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Wallet */}
      {isConnected && address && (
        <Card title="Connected Wallet" icon={Shield}>
          <Row label="Address" value={formatAddress(address)} mono copyable={address} onCopy={copy} />
          <Row label="Network" value={chain.name} />
        </Card>
      )}

      {/* Security */}
      <Card title="Security Notes" icon={Shield}>
        <ul className="space-y-2 text-xs" style={{ color: "var(--muted)" }}>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="size-3.5 shrink-0 mt-0.5" style={{ color: "var(--success)" }} />
            All spend policy enforcement runs onchain — the smart contract validates every agent spend atomically before transferring funds
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="size-3.5 shrink-0 mt-0.5" style={{ color: "var(--success)" }} />
            Private keys are never requested or stored by this application
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="size-3.5 shrink-0 mt-0.5" style={{ color: "var(--success)" }} />
            ONCHAIN_INDEXED data shown in the UI is rebuildable from chain events; onchain state is always canonical
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="size-3.5 shrink-0 mt-0.5" style={{ color: "var(--success)" }} />
            Budget exhaustion, daily limits, per-tx caps, destination whitelist, and expiry are all enforced at the contract level — not by this UI
          </li>
          <li className="flex items-start gap-2">
            <AlertCircle className="size-3.5 shrink-0 mt-0.5" style={{ color: "var(--warning)" }} />
            This is a testnet deployment. Do not use with real mainnet funds.
          </li>
        </ul>
      </Card>

      {/* Agent integration */}
      <Card title="Agent Integration" icon={FileText}>
        <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
          Your agent wallet calls <span className="mono" style={{ color: "var(--accent)" }}>spend(vaultId, destination, amount, purposeHash)</span> on the contract.
          The contract validates policy onchain before transferring USDC.
        </p>
        <div
          className="rounded-xl p-3 mono text-xs overflow-x-auto"
          style={{ background: "var(--code-bg)", color: "var(--ink-2)", border: "1px solid var(--border)" }}
        >
          <div style={{ color: "var(--subtle)" }}>{"// Minimal agent integration (viem)"}</div>
          <div>{`const purposeHash = keccak256(toHex("Search: quarterly report"))`}</div>
          <div>{`await walletClient.writeContract({`}</div>
          <div>{`  address: AGENT_VAULT_ADDRESS,`}</div>
          <div>{`  abi: AGENT_VAULT_ABI,`}</div>
          <div>{`  functionName: "spend",`}</div>
          <div>{`  args: [vaultId, destinationAddress, amount, purposeHash],`}</div>
          <div>{`})`}</div>
        </div>
        <p className="text-[11px] mt-2" style={{ color: "var(--subtle)" }}>
          If any policy constraint fails, the contract reverts with a typed error.
          Your agent should handle: BudgetExhausted, DailyLimitExceeded, PerTxLimitExceeded, DestinationNotAllowed, PolicyExpired, VaultInactive.
        </p>
      </Card>
    </div>
  );
}

function Card({
  title, icon: Icon, children,
}: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <Icon className="size-4" style={{ color: "var(--accent)" }} />
        <span className="text-sm font-600" style={{ color: "var(--ink-2)" }}>{title}</span>
      </div>
      <div className="p-4 space-y-2">{children}</div>
    </div>
  );
}

function Row({
  label, value, mono, copyable, onCopy, link,
}: {
  label: string; value: string; mono?: boolean; copyable?: string;
  onCopy?: (text: string, label: string) => void; link?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs" style={{ color: "var(--subtle)" }}>{label}</span>
      <div className="flex items-center gap-1.5">
        {link ? (
          <a
            href={link} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: "var(--accent)" }}
          >
            {value} <ExternalLink className="size-3" />
          </a>
        ) : (
          <span
            className={`text-xs ${mono ? "mono" : "font-medium"}`}
            style={{ color: mono ? "var(--ink-2)" : "var(--ink-2)" }}
          >
            {value}
          </span>
        )}
        {copyable && onCopy && (
          <button onClick={() => onCopy(copyable, label)} style={{ color: "var(--subtle)" }} className="hover:text-[var(--muted)] transition-colors">
            <Copy className="size-3" />
          </button>
        )}
      </div>
    </div>
  );
}
