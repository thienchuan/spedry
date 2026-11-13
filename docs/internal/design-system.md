# Design system

Name in code: **Arc Dark**. Tokens live in `src/index.css` (`:root`). Use tokens, never raw hex, except the few existing gradient values noted below.

## Color tokens

| Token | Value | Use |
|-------|-------|-----|
| `--bg` / `--bg-gradient` | `#0d1b2f` / vertical gradient to `#122d45` | Page background |
| `--surface` | `rgba(255,255,255,0.07)` | Cards |
| `--surface-strong` | `rgba(255,255,255,0.11)` | Secondary buttons, skeletons |
| `--surface-muted` | `#1f2f44` | Pills, ID chips |
| `--ink` / `--ink-2` | `#f9faf3` / `#e3ecf9` | Headings / body emphasis |
| `--muted` / `--subtle` | `#cbd5e1` / `#94a3b8` | Secondary text / captions |
| `--border` / `--border-strong` | `rgba(255,255,255,0.12)` / `rgba(203,219,242,0.55)` | Dividers |
| `--accent` / `--accent-hover` | `#acc6e9` / `#cbdbf2` | Primary actions, links |
| `--focus` | `#acc6e9` | Focus ring |
| `--success` / `--danger` / `--warning` | `#8dd89f` / `#e86d7a` / `#fb923c` | State colors |

Brand gradient used in logo and progress bars: `#acc6e9` to `#5b87c5`. Primary button text on accent: `#0a1525`.

## Typography

| Role | Font | Class |
|------|------|-------|
| Headings, numbers | Space Grotesk (500–700) | `.display` |
| Body | DM Sans (400–700) | default |
| Addresses, code | JetBrains Mono (400–500) | `.mono` |

Fonts load from Google Fonts in `index.html`. Sizes seen in the app: page title `text-xl`, card values `text-2xl`, body `text-sm`, captions `text-xs` / `text-[11px]`, micro labels `text-[10px]` uppercase.

## Shape and spacing

- Cards: `rounded-2xl`, 1px `--border`, background `--surface`. Large empty states: `rounded-3xl`.
- Buttons and inputs: `rounded-xl` (primary) or `rounded-lg` (compact).
- Page padding `px-6 py-6`, content width `max-w-5xl` / `max-w-6xl`, vertical rhythm `space-y-5` / `space-y-6`.
- Sheets (create, fund): `max-w-sm`.

## Components (all in `src/components`)

| Component | Notes |
|-----------|-------|
| `Layout` | Sidebar (240 px, fixed on mobile with overlay), topbar with ConnectKit button, wrong-network banner |
| `Footer` | 4-column grid, stacks below `lg` |
| `SpendryLogo` | Variants `primary`, `mark`, `mark-bare`; light/dark/mono; unique `gradId` per instance |
| `StatusBadge`, `Pill` | In `AgentVaults.tsx` |
| Sheets | `CreateVaultSheet`, `DepositSheet`; close on Escape |
| `DocsPage` | Documentation layout; same tokens |

Icons: `lucide-react` (size via `size-*`), token icons from `@web3icons/react`. Logo assets: `public/favicon.svg`, `public/logo-mark*.svg`.

Motion: Tailwind `animate-pulse` (skeletons, live dot), `animate-spin` (refresh), `transition-*` hover. No page transitions.

## Light mode

Not Defined. The app is dark only.

## Known issues

- Many headings use `font-700` / `font-600`. Tailwind 3 has no such utilities, so they generate no CSS and the weight is the default. Use `font-bold` / `font-semibold` when fixing.
- The ConnectKit theme (`--ck-*`) is hard-coded in `Layout.tsx` rather than read from the tokens.
