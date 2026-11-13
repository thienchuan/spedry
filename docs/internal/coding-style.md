# Coding style

No formatter (Prettier, Biome) is configured, so style is **observed**, not enforced. Enforced rules are the oxlint rules in `.oxlintrc.json` and `strict` TypeScript.

## Observed conventions

| Area | Convention |
|------|------------|
| Files written for the app | Double quotes, semicolons, 2-space indent |
| Platform scaffold files (`main.tsx`, `config.ts`, `tracing.ts`) | Single quotes, no semicolons. Leave as is |
| Imports | Absolute alias `@/…` for `src/`; relative `./` for sibling components |
| Components | Function components with named exports, props typed with `interface` |
| Styling | Tailwind utilities for layout/spacing; colors via `style={{ color: "var(--token)" }}` |
| State | Local `useState`; server/chain data via TanStack Query hooks in `src/hooks` |
| Types | No `any`; `as const` for ABIs; narrow with type guards |
| Async | `void promise()` for fire-and-forget; no floating promises |
| Comments | Explain why, not what; keep the "why" for loop guards and rate limits |

## Enforced by tooling

- `typescript/no-explicit-any`, `no-floating-promises`, `no-misused-promises`, `require-await`, all `no-unsafe-*` (type-aware).
- `react/rules-of-hooks` (error), `react/exhaustive-deps` (warn), `react/refs`, `react/set-state-in-render`, `react/static-components` (error).
- `react/set-state-in-effect` and `react/purity` are **off** by project decision.
- Ignored by lint: `dist`, `contracts/**`, `node_modules`.

Run `bun run check` (lint + typecheck). It must report 0 errors.

## Solidity

`pragma solidity ^0.8.28`, NatSpec on public functions, typed custom errors (no revert strings), OpenZeppelin base contracts. Formatting tool: Not Defined (Foundry `fmt` is not configured).

## Gaps

- Consistent quote style across scaffold and app files: Not Defined.
- Import ordering: Not Defined.
