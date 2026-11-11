# Spendry — Programmable USDC Budget Manager for AI Agents

Spendry lets teams give AI agents a USDC spending allowance with hard onchain policy enforcement. Create a vault, set a budget + daily limit + per-transaction cap + destination whitelist, and the contract atomically validates every agent spend before any USDC moves. A real-time dashboard indexes all spend events and tracks budget utilization.

Built with [Arc Studio](https://studio.arc.io)

---

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, wagmi v2, ConnectKit
- **Smart Contract**: Solidity 0.8.28, OpenZeppelin 5.6.1, Foundry
- **Backend**: Bun HTTP server, SQLite (bun:sqlite), onchain event indexer
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
| `CHAIN_ID` | Chain ID for indexer (default: `5042002`) |
| `DEPLOY_BLOCK` | Block number the contract was deployed at (indexer start block) |
| `RPC_PROXY_BASE_URL` | Arc Studio RPC proxy base URL (optional outside Arc Studio) |
| `RPC_PROXY_TOKEN` | Arc Studio RPC proxy token (optional outside Arc Studio) |
| `RPC_PROXY_CHAINS` | Comma-separated proxy chain keys (optional outside Arc Studio) |

---

## Run

Start the frontend:
```bash
bun run dev
```

Start the backend API + indexer (in a separate terminal):
```bash
bun run server
```

Or start both together:
```bash
bun run start
```

---

## Build

```bash
bunx vite build
```

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
6. **Pause or adjust** — owners can pause individual vaults, update policy limits, or add/remove destination addresses at any time. The admin can globally pause the entire contract for emergency use.
