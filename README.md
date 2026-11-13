# Spendry — Programmable USDC Budget Manager for AI Agents

Spendry lets teams give AI agents a USDC spending allowance with hard onchain policy enforcement. Create a vault, set a budget + daily limit + per-transaction cap + destination whitelist, and the contract atomically validates every agent spend before any USDC moves. A dashboard reads your vaults straight from the contract and shows every spend event, so there is no server to run.

Built with [Arc Studio](https://studio.arc.io)

---

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, wagmi v2, ConnectKit
- **Smart Contract**: Solidity 0.8.28, OpenZeppelin 5.6.1, Foundry
- **Data**: read directly from Arc Testnet (contract reads via viem/wagmi, spend history from the chain explorer log API), cached with TanStack Query
- **Optional backend** (`server/`): Bun HTTP server, SQLite, onchain event indexer. The app does not need it.
- **Chain**: Arc Testnet (Chain ID 5042002) — USDC is the native gas token

---

## Prerequisites

- [Bun](https://bun.sh) v1.0+
- [Foundry](https://getfoundry.sh) (for contract work)

---

## Install

```bash
bun install
```

---

## Environment Variables

Create a `.env` file at the project root:

| Variable | Purpose |
|----------|---------|
| `VITE_CONTRACT_ADDRESS` | Deployed AgentVault contract address |
| `VITE_DEPLOY_BLOCK` | Block the contract was deployed at (spend history starts here) |

Only for the optional backend in `server/`:

| Variable | Purpose |
|----------|---------|
| `CHAIN_ID` | Chain ID for the indexer (default: `5042002`) |
| `DEPLOY_BLOCK` | Indexer start block |
| `RPC_PROXY_BASE_URL`, `RPC_PROXY_TOKEN`, `RPC_PROXY_CHAINS` | Arc Studio RPC proxy (optional outside Arc Studio) |

---

## Run

Start the app (no backend needed):
```bash
bun run dev
```

Optional: run the legacy API + indexer in `server/` (the app no longer calls it):
```bash
bun run server
```

---

## Build

```bash
bunx vite build
```

The output in `dist/` is a static site and can be hosted anywhere (for example Netlify).

---

## Contracts

Build:
```bash
bun run contracts:build
```

Test:
```bash
bun run contracts:test
```

---

## How It Works for Users

1. **Connect wallet** — any EVM wallet (MetaMask, etc.) on Arc Testnet
2. **Create a vault** — set an agent wallet address, total budget, daily spend cap, per-transaction limit, and an optional expiry. Approve USDC and the contract is ready.
3. **Fund the vault** — deposit USDC at any time; anyone can top up a vault.
4. **Agent spends** — the agent wallet calls `spend()` on the contract with a destination, amount, and purpose hash. All policy constraints are checked atomically onchain; the call reverts with a typed error if any limit would be breached.
5. **Monitor** — the dashboard shows budget utilization, recent spend events, and vault health across all your vaults.
6. **Pause** — owners can pause and resume individual vaults from the app. Changing policy limits, managing the destination whitelist, replacing the agent and withdrawing are available in the contract but have no screen in the app yet. The contract admin can globally pause the contract.

---

## Documentation

- In the app: open `/docs` (also linked from the sidebar and footer). It has product and usage guides in English and Tiếng Việt, switchable at the top of each page.
- In the repo: [`docs/`](docs/README.md) holds the full set. `docs/public/` is shown in the app; `docs/internal/` (developer and AI-agent documentation) is never bundled or served.
