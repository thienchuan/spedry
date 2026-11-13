# Detailed feature specifications

## Vault model (`AgentVault.sol`)

A vault has: `owner`, `agent`, `name`, `balance`, and a policy: `totalBudget`, `spentTotal`, `dailyLimit`, `perTxLimit`, `expiry`, `active`, `windowStart`, `windowSpent`. Amounts are USDC in 6-decimal units. A whitelist is stored per vault; an empty whitelist means any destination is allowed.

Events: `VaultCreated`, `VaultFunded`, `AgentSpend`, `PolicyUpdated`, `VaultActiveChanged`, `VaultWithdrawn`, `AgentUpdated`, `DestinationAdded`, `DestinationRemoved`. Typed errors are declared in the contract (`BudgetExhausted`, `DailyLimitExceeded`, ...).

## Create vault

| Item | Spec |
|------|------|
| Inputs | Name (non-empty), agent address (`0x` + 40 hex), total budget (> 0), daily limit (0 = none), per-tx limit (0 = none), duration in days (0 = no expiry) |
| Contract call | `createVault(agent, name, totalBudget, dailyLimit, perTxLimit, expiry)`; reverts `ZeroAddress`, `ZeroAmount`, or when globally paused |
| Funds moved | None. A new vault has balance 0 |
| UI steps | configure, then optional USDC `approve(contract, budget)`, then `createVault` |
| After success | Sheet shows success; vault queries refetch once per tx hash |

Observed mismatch: the UI asks for a USDC approval equal to the budget, but `createVault` does not pull funds. See [quality-standards.md](quality-standards.md).

## Fund vault

`deposit(vaultId, amount)` after an ERC-20 `approve` if allowance is lower than the amount. Anyone can fund any vault. UI shows wallet balance and a Max button. Reverts: `ZeroAmount`, `VaultNotFound`, global pause.

## Pause / resume

Owner-only `pauseVault` / `resumeVault`. UI refetches vaults once per confirmed tx hash.

## Agent spend

`spend(vaultId, destination, amount, purposeHash)`, callable only by the vault's agent. Checks run in this order and the first failure reverts:

1. `amount > 0`, `destination != 0`
2. caller is the vault agent (`NotAgent`)
3. vault active (`VaultInactive`)
4. not expired (`PolicyExpired`)
5. whitelist, if non-empty (`DestinationNotAllowed`)
6. `amount <= perTxLimit` when set (`PerTxLimitExceeded`)
7. `amount <= totalBudget - spentTotal` (`BudgetExhausted`)
8. daily limit when set (`DailyLimitExceeded`): fixed 24-hour window that resets at the first spend after `windowStart + 24h`. It is **not** a sliding window.
9. `amount <= balance` (`InsufficientVaultBalance`)

Then state updates, USDC transfers, `AgentSpend` is emitted. The purpose text stays offchain; only `purposeHash` is stored in the event.

## Data layer (frontend)

| Data | Source | Notes |
|------|--------|-------|
| Vault list | `getOwnerVaults` + `getVault` via viem multicall | Polled every 30 s with TanStack Query |
| Totals / utilization | Computed from the vault list (`computeStatus`) | Never stored |
| Spend events | Blockscout log API (`/api?module=logs&action=getLogs`) | Filtered by `AgentSpend` topic and `VITE_DEPLOY_BLOCK` |

Rules that protect the data layer:

- The explorer API reports `x-ratelimit-limit: 10` and returns HTTP 429 when the quota is used. It is never polled. The spend query is keyed by each vault's `id:spentTotal` and skipped when every `spentTotal` is 0.
- One query fetches all `AgentSpend` logs and filters locally. If the 1000-log cap is reached it falls back to one query per vault.
- Public RPC rejects wide `eth_getLogs` ranges. The browser never scans blocks.
- Amounts are `Number` in the view model; safe for realistic USDC values (below 2^53 units).

## Dashboard and history

Dashboard: total budget, total spent, available balance, active vaults, utilization bar, last 5 spends. History: all spends newest first, 25 per page ("Load more" is client-side). Both show loading skeletons, empty, error and disconnected states.

## Documentation area

- Routes: `/docs`, `/docs/<lang>`, `/docs/<lang>/<slug>`. Unknown paths show a not-found page.
- Language: `en` or `vi`, held in the URL. Switching keeps the slug. Default for bare `/docs`: TBD (English placeholder). Persistence: TBD.
- Visibility: only `docs/public` is bundled; frontmatter `visibility: public` is required.
- Markdown subset (own renderer, `src/lib/markdown.tsx`): `#`–`###` headings, paragraphs, `-`/`1.` lists, blockquotes, fenced code, tables, `---`, and inline `code`, **bold**, *italic*, links. Links allowed: `/…`, `#…`, `http(s)://…`. No raw HTML, images, or nested lists.
- UI strings (menu, buttons, notices) live in `src/lib/docs.ts` for both languages.
