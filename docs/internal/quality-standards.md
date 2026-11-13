# Quality standards

## Gates that exist

| Gate | Command | Status |
|------|---------|--------|
| Lint (type-aware) | `bun run lint` | Defined, must be 0 errors |
| Typecheck (strict) | `bun run typecheck` | Defined, must be 0 errors |
| Both | `bun run check` | Defined |
| Production build | `bunx vite build` | Works; no `build` script in `package.json` |
| Contract build | `bun run contracts:build` | Works |
| Contract tests | `bun run contracts:test` | Script exists, but `contracts/test/` is empty: **no tests** |

## Gates that do not exist (Not Defined)

Frontend unit or end-to-end tests, CI pipeline, coverage target, performance budget, accessibility audit, formal security audit, pre-commit hooks.

## Release checklist (derived from current practice)

1. `bun run check` passes.
2. `bunx vite build` succeeds.
3. `VITE_CONTRACT_ADDRESS` and `VITE_DEPLOY_BLOCK` are set for the build.
4. If `docs/` changed: confirm `dist/` has no text from `docs/internal/` (see "Verifying doc separation").
5. Deploy `dist/` to Netlify. `public/_redirects` provides the SPA fallback for `/docs/*`.

## Verifying doc separation

- Production: search the built JS for a phrase that exists only in an internal doc; expect no match.
- Dev: requesting `/docs/internal/coding-rules.md` must return 403.
- Public loader: a file without `visibility: public` is ignored.

## Known issues

| # | Issue | Impact |
|---|-------|--------|
| 1 | No `.gitignore`; `flowgate.db` (SQLite) is tracked | Risk of committing `.env` or local data |
| 2 | Footer says "Contracts audited" | No formal audit exists; claim is unsupported. Remove or substantiate |
| 3 | Footer Privacy / Terms links are `#privacy` / `#terms`; GitHub link is `https://github.com` | Placeholders |
| 4 | `CreateVaultSheet` asks for a USDC approval, but `createVault` moves no funds | Extra transaction and confusing step |
| 5 | Contract NatSpec says "rolling 24-hour" daily limit; code is a fixed window | Documentation mismatch in contract |
| 6 | `font-700` / `font-600` classes are not defined in Tailwind | Intended weights not applied |
| 7 | Contract admin is the shared platform deployer wallet | Not acceptable for mainnet; custody TBD |
| 8 | Contract has no tests | Policy logic is verified only by review |
| 9 | Main JS chunk is about 1.6 MB (500 KB gzip) | Slow first load; no code splitting |
| 10 | `bun run start` launches the legacy `server/` which the app no longer uses | Wasted process; also rate-limits RPC |
| 11 | Footer legal and "Product" links use `#` anchors that do nothing | Dead links |
| 12 | Legacy indexer stored `Date.now()` as block timestamp | Only matters if `server/` is revived |
| 13 | Spend view model uses `Number` for amounts | Exact only below 2^53 units |
| 14 | Create and fund sheets show no message when a transaction is rejected or reverts | User gets no feedback on failure |

## Verification record (2026-11-11)

Read from Arc Testnet with the app's own data layer: 6 vaults for the test wallet, total budget 24.00 USDC, spent 0.00. No `AgentSpend` event has occurred yet, so the spend-history decode path has only been tested with a synthetic log.
