/**
 * Spendry logo system — inline SVG, zero dependencies, fully scalable.
 *
 * Concept: "S-gate" — the letter S formed by two arcs (inflow/outflow channels)
 * with two horizontal gate lines cutting across, representing programmable budget
 * gates that USDC flows through under policy control. Simple, infra-grade, readable
 * at 16 px, not crypto-generic.
 *
 * Variants:
 *   mark        — icon only, gradient container (default)
 *   mark-bare   — icon only, no container (transparent bg)
 *   wordmark    — text only
 *   primary     — mark + wordmark (default composition)
 *   compact     — small mark + wordmark inline, tight spacing
 *
 * Modes:
 *   default     — gradient fill (dark stroke on gradient bg)
 *   dark        — accent stroke on transparent (for dark surfaces)
 *   mono        — white stroke on transparent
 */

import { cn } from "@/lib/utils";

// ─── Brand colors (match CSS vars exactly) ────────────────────────────────────
const BRAND = {
  gradStart:  "#acc6e9",
  gradEnd:    "#5b87c5",
  bgDark:     "#0a1525",
  accent:     "#acc6e9",
  ink:        "#f4f8ff",
  subtle:     "#64748b",
} as const;

// ─── The S-gate mark ──────────────────────────────────────────────────────────

interface MarkProps {
  size?: number;
  mode?: "default" | "dark" | "mono";
  id?: string; // gradient ID — must be unique per page instance
}

function SGateMark({ size = 32, mode = "default", id = "sg" }: MarkProps) {
  const stroke =
    mode === "default" ? BRAND.bgDark :
    mode === "dark"    ? BRAND.accent  :
    /* mono */           "#ffffff";

  const sw  = size * 0.069; // stroke-width proportional
  const sw2 = size * 0.044;

  if (mode === "default") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={BRAND.gradStart} />
            <stop offset="100%" stopColor={BRAND.gradEnd} />
          </linearGradient>
        </defs>
        {/* Container */}
        <rect width="32" height="32" rx="8" fill={`url(#${id})`} />
        {/* Top arc — inflow */}
        <path
          d="M20 8.5C20 8.5 12 8.5 12 12.5C12 16.5 20 16 20 16"
          stroke={stroke} strokeWidth={sw} strokeLinecap="round" fill="none"
        />
        {/* Bottom arc — outflow */}
        <path
          d="M12 16C12 16 20 15.5 20 19.5C20 23.5 12 23.5 12 23.5"
          stroke={stroke} strokeWidth={sw} strokeLinecap="round" fill="none"
        />
        {/* Gate lines */}
        <line x1="9" y1="11" x2="23" y2="11" stroke={stroke} strokeWidth={sw2} strokeLinecap="round" opacity="0.55" />
        <line x1="9" y1="21" x2="23" y2="21" stroke={stroke} strokeWidth={sw2} strokeLinecap="round" opacity="0.55" />
      </svg>
    );
  }

  // dark / mono — no container
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M20 8.5C20 8.5 12 8.5 12 12.5C12 16.5 20 16 20 16"
        stroke={stroke} strokeWidth={sw} strokeLinecap="round" fill="none"
      />
      <path
        d="M12 16C12 16 20 15.5 20 19.5C20 23.5 12 23.5 12 23.5"
        stroke={stroke} strokeWidth={sw} strokeLinecap="round" fill="none"
      />
      <line x1="9" y1="11" x2="23" y2="11" stroke={stroke} strokeWidth={sw2} strokeLinecap="round" opacity="0.45" />
      <line x1="9" y1="21" x2="23" y2="21" stroke={stroke} strokeWidth={sw2} strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

// ─── Public logo component ─────────────────────────────────────────────────────

export interface SpendryLogoProps {
  /**
   * Which composition to render.
   * - "mark"       icon only, in gradient container
   * - "mark-bare"  icon only, no container
   * - "wordmark"   text only
   * - "primary"    mark + wordmark (default)
   * - "compact"    small mark + wordmark, tighter
   */
  variant?: "mark" | "mark-bare" | "wordmark" | "primary" | "compact";
  /** Rendering mode for the icon */
  mode?: "default" | "dark" | "mono";
  /** Icon size in px (wordmark scales with this) */
  size?: number;
  className?: string;
  /** Unique id suffix for the gradient — set when rendering multiple logos on one page */
  gradId?: string;
}

export function SpendryLogo({
  variant  = "primary",
  mode     = "default",
  size     = 32,
  className,
  gradId   = "sgl",
}: SpendryLogoProps) {

  const wordColor =
    mode === "mono" ? "#ffffff" :
    BRAND.ink;

  const subColor  = BRAND.subtle;

  // Font size scales with icon size
  const fontSize   = Math.round(size * 0.4375);  // 14 at size=32
  const subSize    = Math.round(size * 0.28);     // 9 at size=32
  const gap        = Math.round(size * 0.28);

  if (variant === "mark" || variant === "mark-bare") {
    return (
      <SGateMark
        size={size}
        mode={variant === "mark-bare" ? (mode === "default" ? "dark" : mode) : mode}
        id={gradId}
      />
    );
  }

  if (variant === "wordmark") {
    return (
      <span
        className={cn("display font-700 tracking-tight select-none", className)}
        style={{ color: wordColor, fontSize, letterSpacing: "-0.025em", fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Spendry
      </span>
    );
  }

  // "primary" or "compact"
  const isCompact = variant === "compact";
  const iconSize  = isCompact ? Math.round(size * 0.72) : size;

  return (
    <div
      className={cn("flex items-center select-none", className)}
      style={{ gap }}
    >
      <SGateMark size={iconSize} mode={mode} id={gradId} />

      <div className="flex flex-col justify-center" style={{ gap: 1 }}>
        <span
          className="display font-700 tracking-tight leading-none"
          style={{
            color: wordColor,
            fontSize: isCompact ? Math.round(fontSize * 0.93) : fontSize,
            letterSpacing: "-0.025em",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          Spendry
        </span>
        {!isCompact && (
          <span
            className="font-medium tracking-widest uppercase leading-none"
            style={{
              color: subColor,
              fontSize: subSize,
              letterSpacing: "0.10em",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Agent Spend
          </span>
        )}
      </div>
    </div>
  );
}
