# Naming conventions

Observed in the repository. No linter enforces naming.

| Thing | Convention | Example |
|-------|------------|---------|
| React component files | `PascalCase.tsx`, one main component, named export | `AgentVaults.tsx`, `DocsPage.tsx` |
| Hook files | `camelCase.ts` starting with `use`, hook name equals file name | `useChainData.ts` -> `useOwnerVaults` |
| Library files | lowercase / camelCase `.ts` | `chain.ts`, `utils.ts`, `docs.ts` |
| Components, interfaces, types | `PascalCase` | `ChainVault`, `Props` |
| Functions, variables | `camelCase` | `fetchOwnerVaults`, `refetchSpends` |
| Constants | `UPPER_SNAKE_CASE` | `CHAIN_ID`, `CONTRACT_ADDRESS`, `PAGE_SIZE` |
| Query keys | array, first item = resource noun | `["vaults", CHAIN_ID, owner]` |
| Event handlers | `handle<Action>` for local handlers | `handlePause` |
| Boolean props/state | `is`/`has`/`show` prefix, or plain adjective | `isExpanded`, `showCreate`, `open` |
| CSS variables | `--kebab-case` | `--surface-muted` |
| Custom CSS classes | lowercase | `.display`, `.mono` |
| Environment variables | `VITE_` prefix for anything the browser reads; `UPPER_SNAKE_CASE` | `VITE_CONTRACT_ADDRESS` |
| Docs files | `kebab-case.md`; public docs at `docs/public/<lang>/<slug>.md` | `getting-started.md` |
| Docs slugs and languages | lowercase; language is `en` or `vi` | `/docs/vi/policies` |
| Solidity | Contract `PascalCase`; functions `camelCase`; events `PascalCase`; errors `PascalCase`; private storage `_underscore` | `AgentVault`, `_vaults`, `BudgetExhausted` |

## Known deviations

- View-model fields in `ChainVault` and `ChainSpend` are `snake_case` (`balance_usdc`, `block_timestamp`) because they replaced the legacy API's JSON shape. New code should use `camelCase`; migrating existing fields: Not Defined.
- The legacy name `flowgate` appears in `flowgate.db`. Product name is Spendry.
- Branch naming, PR title format, release/tag naming: Not Defined.
