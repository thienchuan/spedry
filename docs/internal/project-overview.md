# Project overview and goals

## What Spendry is

Spendry is a programmable USDC budget manager for AI agents. An owner creates a **vault**, sets a spend policy, and funds it. An agent wallet spends from it through the `AgentVault` smart contract, which checks the policy atomically before any USDC moves.

Repository: `thienchuan/spedry` (GitHub). Product name in UI and docs: **Spendry**. (Earlier working name: FlowGate; a few legacy file names such as `flowgate.db` remain.)

## Goals (from README and contract)

- Enforce agent spending limits onchain, not in the UI.
- Make every agent spend auditable from chain data.
- Keep the app usable without a backend: the chain is the database.

Non-goals and success metrics: Not Defined.

## Actors

| Actor | Can do |
|-------|--------|
| Owner | Create vaults; fund; pause/resume; (contract only) update policy, manage whitelist, replace agent, withdraw |
| Agent wallet | Call `spend()` on its own vault, within policy |
| Anyone | Fund any vault (`deposit` is open) |
| Admin | Pause or unpause the entire contract |

## Architecture

```
Browser (Vite + React)
  ├─ wagmi / viem ──────► Arc Testnet RPC     vault state (getOwnerVaults, getVault)
  ├─ explorer log API ──► Blockscout          AgentSpend events (history)
  └─ wallet (injected) ─► AgentVault.sol      createVault, deposit, pauseVault, resumeVault

server/ (Bun + SQLite + indexer)  — legacy, optional, not called by the app
```

Source of truth: **onchain state is canonical**. Anything shown from the explorer log API or a cache is derived and rebuildable.

## Environments

| Item | Value |
|------|-------|
| Chain | Arc Testnet, chain ID 5042002 |
| Contract | `0xe14d934b49b5222833c315b3ff2c9bec70818b3d` |
| Deployment block | 68648646 (also `VITE_DEPLOY_BLOCK`) |
| Deploy tx | `0x2a041eb96c5f2f77fce09823626ad03ab48601d6382e7ca337b31955badeb617` |
| USDC (ERC-20 view) | read from `src/onchain-facts.ts` (6 decimals) |
| Hosting | Netlify static build of `dist/` (site `spedry`) |
| Mainnet | Not Defined. Do not deploy the current contract to mainnet (see [quality-standards.md](quality-standards.md)). |

The contract admin is the shared platform deployer wallet recorded in `AGENTS.md`. It is not controlled by this project. Admin key custody: TBD.

## Repository layout

| Path | Contents |
|------|----------|
| `src/` | Frontend (components, hooks, lib) |
| `contracts/` | `AgentVault.sol`, deploy scripts, metadata; `test/` is empty |
| `server/` | Legacy API and indexer |
| `scripts/` | Deploy helpers and `check.sh` |
| `docs/` | This documentation |
| `public/` | Static assets, `_redirects` |
