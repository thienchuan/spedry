# Coding rules

Rules are grouped by how they are enforced.

## A. Enforced by tools

1. `bun run check` must pass with 0 errors: oxlint (type-aware) and `tsc --noEmit` (strict).
2. No `any`, no floating promises, no unsafe member access (see [coding-style.md](coding-style.md)).
3. Hooks follow the Rules of Hooks; refs are not read or written during render.

## B. Project rules (from `AGENTS.md` and lessons in this repo)

### Chain and money

4. **Onchain state is canonical.** Anything from the explorer, a cache or a database is derived and must be rebuildable.
5. **No hard-coded chain facts.** Addresses, decimals, explorer URLs and RPC URLs come from `src/onchain-facts.ts` or `VITE_*` env vars. Never type an address from memory.
6. **USDC amounts.** Use `formatUnits`/`parseUnits` with the decimals from the chain facts. Do not mix the native-gas view and the ERC-20 view of USDC on Arc.
7. **Never request, store or log private keys or seed phrases.**
8. **No simulated data.** No fake balances, addresses, tx hashes or progress in any build that users see.

### Data fetching and effects

9. **Chain/server data goes through TanStack Query** (`src/hooks/useChainData.ts`), keyed by the values it depends on. Do not hand-roll `useEffect` + `fetch` + `setState` loops.
10. **Never poll the explorer log API.** It has a small quota (see [feature-specs.md](feature-specs.md)). Key spend queries on on-chain `spentTotal`.
11. **Never scan blocks from the browser.** Public RPC rejects wide `eth_getLogs` ranges.
12. **Success effects fire once per transaction hash.** Sheets stay mounted, and callbacks passed as props are new on every parent render. Guard with a `useRef` holding the last handled hash (`CreateVaultSheet`, `DepositSheet`, `AgentVaults`). Without this the app refetches in an infinite loop.
13. No effect without a dependency array that calls `setState`.

### Documentation area

14. Public docs live only in `docs/public/<lang>/`, must have `visibility: public`, and must exist in both languages or be listed as untranslated in `docs/README.md`.
15. Nothing internal, sensitive or speculative goes in `docs/public/`. If unknown, write `TBD` or `Not Defined`.
16. Do not import anything from `docs/internal/` in application code.

### Repository hygiene

17. Do not commit `.env`, keys, or recovery files. (No `.gitignore` exists yet; see [quality-standards.md](quality-standards.md).)
18. Do not edit generated or platform files by hand: `src/onchain-facts.ts`, `src/onchain-money.ts`, `src/onchain-wait.ts`, `src/tracing.ts`.
19. Do not rename or delete tracked files without agreement.
20. Contract changes require a rebuild (`bun run contracts:build`) and a redeploy; update `AGENTS.md` (address) and `VITE_CONTRACT_ADDRESS`, `VITE_DEPLOY_BLOCK`.

## C. Not Defined

Error-handling policy for chain errors in the UI, logging policy, feature-flag policy, dependency-upgrade policy.
