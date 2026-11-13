# Spendry: Project Completion Status
_Last updated: 2026-11-11_

## Architecture
- Smart contract: `AgentVault.sol` on Arc Testnet at `0xe14d934b49b5222833c315b3ff2c9bec70818b3d` (deployed at block 68648646, set as `VITE_DEPLOY_BLOCK`).
- Frontend: Vite + React + TypeScript. Reads Arc Testnet directly. No backend is required.
  - `src/lib/chain.ts`: vault reads (`getOwnerVaults`, `getVault`) and spend logs from the explorer log API.
  - `src/hooks/useChainData.ts`: TanStack Query hooks (`useOwnerVaults`, `useOwnerSpends`).
- `server/` (Bun API + SQLite indexer) is kept but is no longer called by the frontend.

## Done
- Removed the backend dependency from the UI (Dashboard, Agent Vaults, Spend History). The static build in `dist/` is deployable to Netlify.
- Fixed the infinite `/api/vaults` request loop. Real root cause: `CreateVaultSheet` stays mounted, its `createSuccess` stays true after a vault is created, and its effect depended on the inline `onCreated` callback, so it re-fired and refetched on every parent render. Earlier fixes only changed the parent components and did not remove it. Both sheets now notify once per transaction hash.
- Spend history now shows real block timestamps (the old indexer stored the time it processed the event).
- `formatAddress` tolerates undefined.

## Verified
- Live read for owner `0xF89f...DF11`: 6 vaults, total budget 24.00 USDC, 0.00 spent, 0.00 balance. Matches chain state.
- Spend log decoding verified with a synthetic AgentSpend log built from the contract ABI (no real spend events exist yet).
- `bun run check` (oxlint + tsc): 0 errors, 0 warnings.

## Known limits
- Explorer log API reports a quota of 10 requests and returns 429 when exhausted. The app never polls it: spend logs are fetched only when a vault's on-chain `spentTotal` changes, and not at all while it is 0. If it returns 429 the UI shows an error and Refresh retries later.
- The explorer returns at most 1000 logs per query. Above that the app falls back to one query per vault.
- No end-to-end test of the full spend flow yet, because no agent has called `spend()` on the deployed contract.
- The repo has no `build` script. Build with `bunx vite build`.

## Next steps
1. Fund a vault and perform a real `spend()` from the agent wallet, then confirm it appears in Spend History.
2. Redeploy `dist/` to Netlify and disable the site's access protection if the URL should be public.

## Documentation (added 2026-11-11)
- `docs/` holds the project docs. `docs/public/{en,vi}` (6 pages each) is shown in the app at `/docs`; `docs/internal/` (English, developer/AI-agent) is never bundled or served. Index: `docs/README.md`.
- Open items are listed in `docs/README.md` (default language and language persistence are TBD) and known issues in `docs/internal/quality-standards.md`.
