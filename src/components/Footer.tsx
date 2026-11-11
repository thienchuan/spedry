import { ExternalLink, Github, BookOpen, FileText, Shield } from "lucide-react";
import { SpendryLogo } from "./SpendryLogo";
import { TokenUSDC } from "@web3icons/react";

// ─── Link data ────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Dashboard",     href: "#dashboard" },
  { label: "Agent Vaults",  href: "#agents"    },
  { label: "Spend History", href: "#history"   },
  { label: "Settings",      href: "#settings"  },
];

const RESOURCE_LINKS = [
  { label: "Arc Docs",         href: "https://docs.arc.io",                        external: true  },
  { label: "Circle Developers",href: "https://developers.circle.com",              external: true  },
  { label: "USDC on Arc",      href: "https://docs.arc.io/docs/usdc-on-arc",       external: true  },
  { label: "GitHub",           href: "https://github.com",                         external: true  },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy",    href: "#privacy"  },
  { label: "Terms of Service",  href: "#terms"    },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-semibold tracking-[0.1em] uppercase mb-3"
      style={{ color: "var(--subtle)" }}
    >
      {children}
    </p>
  );
}

interface FooterLinkProps {
  href: string;
  external?: boolean;
  children: React.ReactNode;
}

function FooterLink({ href, external, children }: FooterLinkProps) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group flex items-center gap-1.5 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 rounded"
      style={
        {
          color: "var(--muted)",
          "--tw-ring-color": "var(--focus)",
        } as React.CSSProperties
      }
      onMouseEnter={(e) => {
        (e.currentTarget).style.color = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget).style.color = "var(--muted)";
      }}
      onFocus={(e) => {
        (e.currentTarget).style.color = "var(--accent)";
      }}
      onBlur={(e) => {
        (e.currentTarget).style.color = "var(--muted)";
      }}
    >
      {children}
      {external && (
        <ExternalLink
          className="size-3 opacity-0 group-hover:opacity-60 transition-opacity duration-150"
          aria-hidden="true"
        />
      )}
    </a>
  );
}

// ─── Main Footer ──────────────────────────────────────────────────────────────

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      aria-label="Site footer"
      className="mt-auto w-full"
      style={{
        borderTop: "1px solid var(--border)",
        background: "rgba(10,18,36,0.70)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* ── Main grid ── */}
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-8">
        <div className="grid gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand column */}
          <div className="lg:col-span-1">
            {/* Logo + wordmark */}
            <div className="mb-3">
              <SpendryLogo variant="primary" size={28} gradId="sgl-footer" />
            </div>

            {/* Tagline */}
            <p
              className="text-sm leading-relaxed mb-5"
              style={{ color: "var(--muted)", maxWidth: "22ch" }}
            >
              Programmable USDC budgets for AI agents — enforce policies onchain, audit every spend.
            </p>

            {/* Arc Testnet pill */}
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{
                background: "rgba(74,222,128,0.08)",
                border: "1px solid rgba(74,222,128,0.20)",
                color: "var(--success)",
              }}
            >
              <span
                className="size-1.5 rounded-full bg-[var(--success)] animate-pulse"
                aria-hidden="true"
              />
              Arc Testnet
            </div>
          </div>

          {/* Product links */}
          <div>
            <SectionLabel>Product</SectionLabel>
            <nav aria-label="Product navigation" className="flex flex-col gap-2.5">
              {NAV_LINKS.map(({ label, href }) => (
                <FooterLink key={href} href={href}>
                  {label}
                </FooterLink>
              ))}
            </nav>
          </div>

          {/* Resources links */}
          <div>
            <SectionLabel>Resources</SectionLabel>
            <nav aria-label="Resources navigation" className="flex flex-col gap-2.5">
              {RESOURCE_LINKS.map(({ label, href, external }) => (
                <FooterLink key={href} href={href} external={external}>
                  {label === "GitHub" ? (
                    <Github className="size-3.5 shrink-0" aria-hidden="true" />
                  ) : label === "Arc Docs" ? (
                    <BookOpen className="size-3.5 shrink-0" aria-hidden="true" />
                  ) : null}
                  {label}
                </FooterLink>
              ))}
            </nav>
          </div>

          {/* Legal links */}
          <div>
            <SectionLabel>Legal</SectionLabel>
            <nav aria-label="Legal navigation" className="flex flex-col gap-2.5">
              {LEGAL_LINKS.map(({ label, href }) => (
                <FooterLink key={href} href={href}>
                  {label === "Privacy Policy" && (
                    <Shield className="size-3.5 shrink-0" aria-hidden="true" />
                  )}
                  {label === "Terms of Service" && (
                    <FileText className="size-3.5 shrink-0" aria-hidden="true" />
                  )}
                  {label}
                </FooterLink>
              ))}
            </nav>

            {/* Security note */}
            <p
              className="mt-5 text-[11px] leading-relaxed"
              style={{ color: "var(--subtle)" }}
            >
              Contracts audited. Policies enforced onchain — no trusted intermediary.
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom strip ── */}
      <div
        className="border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">

          {/* Copyright */}
          <p className="text-[11px]" style={{ color: "var(--subtle)" }}>
            &copy; {year} Spendry. All rights reserved.
          </p>

          {/* Built-on badge */}
          <div
            className="flex items-center gap-1.5 text-[11px]"
            style={{ color: "var(--subtle)" }}
          >
            <span>Built on</span>
            <a
              href="https://arc.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 transition-colors duration-150"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) => {
                (e.currentTarget).style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget).style.color = "var(--muted)";
              }}
              onFocus={(e) => {
                (e.currentTarget).style.color = "var(--accent)";
              }}
              onBlur={(e) => {
                (e.currentTarget).style.color = "var(--muted)";
              }}
              aria-label="Built on Arc — opens in new tab"
            >
              <TokenUSDC size={14} aria-hidden />
              <span className="font-medium">Arc</span>
            </a>
            <span>with USDC as gas</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
