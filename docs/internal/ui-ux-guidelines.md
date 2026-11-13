# UI/UX guidelines

Rules observed in the shipped UI. Items without a basis in the code are marked.

## Principles

1. **Onchain truth.** Show values read from the chain or derived from it. Never show invented balances, addresses, hashes or progress.
2. **Say which state you are in.** Every data view has loading (skeleton), empty, error and disconnected states.
3. **One primary action per card.** Primary = filled accent; secondary = tinted outline; tertiary = icon-only with `aria-label`.
4. **No developer jargon in user text.** Do not show internal labels such as data-source tags or env var names (Settings is the exception, for developers).

## Wallet and network

- Connect via the ConnectKit button in the topbar.
- When connected to the wrong chain: full-width warning banner, sidebar pill turns orange, and any write action first prompts a chain switch.
- Show addresses shortened with `formatAddress` (`0x1234...abcd`) in `.mono`.

## Transactions

- Multi-step flows show the step (configure, approve, create, success).
- Disable the action and show a spinner while a transaction is pending or confirming.
- Confirm success with a toast or success state; refetch data once per transaction hash.
- Transaction errors (rejected signature, revert) are **not displayed** by the sheets today (known issue 14 in [quality-standards.md](quality-standards.md)). Error copy for each typed contract error: TBD.

## Money

- Amounts are USDC with at least 2 decimals (`1.25`), up to 6 when needed. Compact form (`$1.2K`) only in policy pills.
- Inputs accept decimals; `0` means "no limit" for daily and per-tx limits and "no expiry" for duration.

## Layout and responsiveness

- Mobile first. Sidebar becomes a slide-in menu below `lg`; footer and grids stack.
- Tables collapse to rows on small screens (Spend History keeps vault, amount, time).
- Breakpoint policy beyond Tailwind defaults: Not Defined.

## Accessibility

Present: `aria-label` on icon buttons, decorative icons `aria-hidden`, Escape closes sheets, visible focus ring on footer links, `lang`-aware docs area.
Not Defined: target level (WCAG), automated accessibility checks, full keyboard audit of sheets.

## Content

- Product tone: short, factual. Name is **Spendry**.
- App UI language: English only. Documentation: English and Tiếng Việt, never mixed within one page (product and technical terms stay in English).
- Testnet only: say so wherever funds are mentioned.
