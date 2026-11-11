# Spendry

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** — what Arc Studio remembers about building this app.

---

## What This App Does

Spendry is a programmable USDC budget manager for AI agents. Owners create onchain "vaults" with enforced spend policies (total budget, daily limit, per-tx limit, destination whitelist, expiry). Agent wallets call `spend()` on the contract — all policy constraints are validated atomically onchain before any USDC moves. The dashboard indexes all events and shows real-time spend analytics.

## Deployed Contracts

| Contract | Chain | Address | Explorer |
|----------|-------|---------|----------|
| AgentVault | Arc Testnet | `0xe14d934b49b5222833c315b3ff2c9bec70818b3d` | [View](https://explorer.testnet.arc.io/address/0xe14d934b49b5222833c315b3ff2c9bec70818b3d) |

- Constructor args: `(usdcAddress=0x3600000000000000000000000000000000000000, admin=0x5B12Ce46C7194aD57d143bC22847224047b1Ef42)`
- Deploy TX: `0x2a041eb96c5f2f77fce09823626ad03ab48601d6382e7ca337b31955badeb617`
- Deployer wallet ID: `3c2464b2-8369-52e2-a782-800bbeca5396`

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
- **Web3**: wagmi v2, viem v2, ConnectKit
- **Contract**: Solidity 0.8.28, OpenZeppelin 5.6.1, AgentVault.sol
- **Backend**: Bun HTTP server (Express-style), port 3001, proxied via Vite `/api`
- **Database**: SQLite via `bun:sqlite` at `./spendry.db` — indexed cache only, rebuildable from chain events
- **Indexer**: Event-driven, Arc Testnet, 2000-block batches, checkpoint-resumable
- **Chain**: Arc Testnet (Chain ID: 5042002)
- **Token**: USDC (6 decimals, address: 0x3600000000000000000000000000000000000000)

## Key Files

- `contracts/AgentVault.sol` — Core smart contract with spend policy enforcement
- `server/api.ts` — REST API server (start: `bun run server`)
- `server/indexer.ts` — Onchain event indexer
- `server/db.ts` — SQLite schema and prepared statements
- `src/App.tsx` — App shell with view routing
- `src/components/Dashboard.tsx` — Overview stats
- `src/components/AgentVaults.tsx` — Vault management
- `src/components/CreateVaultSheet.tsx` — Vault creation flow (approve + create)
- `src/components/DepositSheet.tsx` — USDC deposit flow
- `src/components/SpendHistory.tsx` — Paginated spend event log
- `src/components/SettingsPage.tsx` — Contract info and agent integration guide
- `src/lib/abi.ts` — AgentVault ABI
- `src/lib/api.ts` — API client
- `src/lib/utils.ts` — Formatting helpers

## Environment Variables

| Name | Purpose |
|------|---------|
| `VITE_CONTRACT_ADDRESS` | AgentVault contract address (set after deploy) |
| `CHAIN_ID` | Chain ID for indexer (default: 5042002) |
| `DEPLOY_BLOCK` | Block the contract was deployed at (for indexer start) |
| `RPC_PROXY_BASE_URL` | Arc Studio RPC proxy (optional outside Arc Studio) |
| `RPC_PROXY_TOKEN` | Arc Studio RPC proxy token (optional outside Arc Studio) |
| `RPC_PROXY_CHAINS` | Comma-separated proxy chain keys (optional outside Arc Studio) |

## State Machine

```
CREATE_VAULT → FUND_VAULT → AGENT_ACTIVE
                               ↓
                         AGENT_SPEND_REQUEST
                               ↓
                         VALIDATE_POLICY (onchain, atomic):
                           - active check
                           - expiry check
                           - destination whitelist
                           - per-tx limit
                           - lifetime budget
                           - daily window limit
                               ↓             ↓
                         EXECUTE_TRANSFER  REVERT (typed error)
                               ↓
                         EMIT_AgentSpend_EVENT
                               ↓
                         INDEXER_PICKS_UP → DB_UPDATE → DASHBOARD
```

## Data Source Labels

| Source | Meaning |
|--------|---------|
| ONCHAIN | Canonical — contract state, balances, transfer amounts |
| ONCHAIN_INDEXED | Indexed from events — rebuildable from chain |
| USER_GENERATED | Destination labels entered by user |
| DERIVED | Computed from indexed data (totals, percentages) |

## Decisions

- **Arc Dark theme**: chosen because this is an infra/treasury dashboard, not a consumer payment app
- **Tumbling (not rolling) 24h window**: gas-efficient; documented clearly in contract and UI
- **whenNotPaused on createVault, deposit, updatePolicy**: global pause blocks all state changes except emergency withdraw and resume
- **purposeHash (bytes32)**: keeps PII offchain while preserving onchain audit trail
- **SQLite**: suitable for single-instance testnet demo; production would use PostgreSQL with proper migrations
