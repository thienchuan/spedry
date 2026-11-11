import React, { useState } from "react";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";
import {
  LayoutDashboard, Bot, History, Settings, ChevronRight,
  Shield, Menu, X, AlertTriangle,
} from "lucide-react";
import { cn, formatAddress } from "@/lib/utils";
import { Footer } from "./Footer";
import { SpendryLogo } from "./SpendryLogo";

const CHAIN_ID = 5042002;

export type View = "dashboard" | "agents" | "history" | "settings";

interface LayoutProps {
  view: View;
  onView: (v: View) => void;
  children: React.ReactNode;
}

const nav: { id: View; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "agents", label: "Agent Vaults", icon: Bot },
  { id: "history", label: "Spend History", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Layout({ view, onView, children }: LayoutProps) {
  const { isConnected, address, chainId } = useAccount();
  const [mobileOpen, setMobileOpen] = useState(false);
  const wrongChain = isConnected && chainId !== CHAIN_ID;

  return (
    <div className="min-h-dvh flex" style={{ background: "var(--bg-gradient)" }}>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 flex flex-col border-r transition-transform duration-300",
          "lg:translate-x-0 lg:static lg:flex",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "rgba(10,18,36,0.92)",
          backdropFilter: "blur(24px)",
          borderColor: "var(--border)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <SpendryLogo variant="primary" size={28} gradId="sgl-sidebar" />
          <button
            className="ml-auto lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            style={{ color: "var(--muted)" }}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { onView(id); setMobileOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                "hover:bg-white/[0.06]"
              )}
              style={{
                color: view === id ? "var(--accent)" : "var(--muted)",
                background: view === id ? "rgba(172,198,233,0.08)" : "transparent",
              }}
            >
              <Icon className="size-4 shrink-0" />
              {label}
              {view === id && (
                <ChevronRight className="ml-auto size-3.5" style={{ color: "var(--accent)" }} />
              )}
            </button>
          ))}
        </nav>

        {/* Status strip */}
        <div className="px-4 py-4 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
          {/* Network */}
          <div className="flex items-center gap-2">
            <div
              className="size-1.5 rounded-full animate-pulse"
              style={{ background: wrongChain ? "var(--warning)" : "var(--success)" }}
            />
            <span className="text-[11px]" style={{ color: wrongChain ? "var(--warning)" : "var(--subtle)" }}>
              {wrongChain ? "Wrong network" : "Arc Testnet"}
            </span>
          </div>
          {/* Wallet */}
          <div className="flex items-center gap-2">
            <Shield className="size-3.5 shrink-0" style={{ color: "var(--subtle)" }} />
            {isConnected && address ? (
              <span className="text-[11px] mono" style={{ color: "var(--muted)" }}>
                {formatAddress(address)}
              </span>
            ) : (
              <span className="text-[11px]" style={{ color: "var(--subtle)" }}>Not connected</span>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Wrong-chain banner */}
        {wrongChain && (
          <div
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium"
            style={{
              background: "rgba(251,146,60,0.10)",
              borderBottom: "1px solid rgba(251,146,60,0.20)",
              color: "var(--warning)",
            }}
          >
            <AlertTriangle className="size-3.5 shrink-0" />
            Wrong network — switch to Arc Testnet to execute transactions
          </div>
        )}

        {/* Topbar */}
        <header
          className="sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-6 py-3 border-b"
          style={{
            background: "rgba(13,27,47,0.88)",
            backdropFilter: "blur(20px)",
            borderColor: "var(--border)",
          }}
        >
          <button
            className="lg:hidden p-1.5 rounded-lg transition-colors hover:bg-white/[0.06]"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            style={{ color: "var(--muted)" }}
          >
            <Menu className="size-5" />
          </button>

          {/* Page title */}
          <span className="display text-sm font-600" style={{ color: "var(--ink-2)" }}>
            {nav.find((n) => n.id === view)?.label}
          </span>

          <div className="ml-auto flex items-center gap-2.5">
            {/* Network pill — visible on mobile (sm) where sidebar is hidden, hidden on lg where sidebar shows */}
            <div
              className="hidden sm:flex lg:hidden items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{
                background: wrongChain ? "rgba(251,146,60,0.10)" : "rgba(141,216,159,0.08)",
                border: `1px solid ${wrongChain ? "rgba(251,146,60,0.20)" : "rgba(141,216,159,0.18)"}`,
                color: wrongChain ? "var(--warning)" : "var(--success)",
              }}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ background: wrongChain ? "var(--warning)" : "var(--success)" }}
              />
              {wrongChain ? "Wrong network" : "Arc Testnet"}
            </div>

            <ConnectKitButton
              customTheme={{
                "--ck-font-family": "'DM Sans', sans-serif",
                "--ck-primary-button-background": "rgba(172,198,233,0.12)",
                "--ck-primary-button-color": "#acc6e9",
                "--ck-primary-button-border-radius": "12px",
                "--ck-body-background": "#0d1b2f",
                "--ck-body-color": "#f9faf3",
                "--ck-modal-box-shadow": "0 24px 80px rgba(0,0,0,0.6)",
              }}
            />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
