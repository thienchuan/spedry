import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatAddress = (addr: string | undefined | null) => {
  if (!addr || addr.length < 10) return addr ?? "—";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

export const formatUSDC = (raw: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(raw / 1_000_000);

export const formatUSDCCompact = (raw: number) => {
  const val = raw / 1_000_000;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(2)}`;
};

export const formatTs = (unix: number) => {
  const d = new Date(unix * 1000);
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export const formatExpiry = (unix: number) => {
  if (!unix) return "Never";
  const d = new Date(unix * 1000);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const pctBar = (spent: number, budget: number) =>
  budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;

export const statusColor = (active: number, expiry: number) => {
  const now = Math.floor(Date.now() / 1000);
  if (!active) return "text-[var(--danger)]";
  if (expiry && expiry < now) return "text-[var(--warning)]";
  return "text-[var(--success)]";
};

export const statusLabel = (active: number, expiry: number) => {
  const now = Math.floor(Date.now() / 1000);
  if (!active) return "Paused";
  if (expiry && expiry < now) return "Expired";
  return "Active";
};
