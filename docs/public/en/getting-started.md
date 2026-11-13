---
title: Getting started
description: Connect a wallet, create and fund your first vault, and watch your agent spend.
order: 3
visibility: public
---

# Getting started

## Before you begin

- A browser wallet such as MetaMask.
- Test USDC on **Arc Testnet**. Get it from the [Circle faucet](https://faucet.circle.com). Arc uses USDC to pay fees, so the same balance covers both vault funding and fees.
- The address of the wallet your agent will use.

## 1. Connect and check the network

Open the app and press **Connect Wallet** in the top bar. If your wallet is on another network, a warning banner appears and the app asks you to switch to Arc Testnet when you take an action.

## 2. Create a vault

Open **Agent Vaults** and press **New Vault**. Fill in:

| Field | Meaning |
|-------|---------|
| Vault name | A label for you, for example "Research agent". |
| Agent wallet address | The wallet that will be allowed to spend. |
| Total budget (USDC) | The most the agent can ever spend from this vault. |
| Daily limit | The most per 24 hours. `0` means no daily limit. |
| Per-transaction limit | The most per spend. `0` means no limit. |
| Duration (days) | How long the vault allows spending. `0` means no expiry. |

Creating a vault sets the rules; it does not move any USDC. The app may ask you to approve USDC first. Confirm each wallet prompt.

## 3. Fund the vault

On the vault card press **Fund**, enter an amount (or press **Max**), and confirm. You may need to approve USDC first, then deposit.

## 4. Connect your agent

Give your agent developer the vault number (shown as `#0`, `#1`, ...) and the contract address from **Settings**. See the [Agent guide](/docs/en/agent-guide).

## 5. Monitor

- **Dashboard** shows totals and the latest spends.
- **Spend History** lists every spend with a link to the explorer.
- Vault data refreshes about every 30 seconds. Press **Refresh** to update immediately.

## 6. Pause when needed

Press **Pause** on a vault to stop all spending. Press **Resume** to allow it again. Funds stay in the vault.

## Troubleshooting

| Problem | What to do |
|---------|------------|
| "Wrong network" banner | Switch your wallet to Arc Testnet. |
| Spend history says it could not load | The block explorer limits requests. Wait a few minutes, then press **Refresh**. |
| Spend history is empty | No agent has spent yet. |
| A wallet prompt fails with no message | The app does not show transaction errors yet. Check your wallet, then try again. |

Next: [Spending rules](/docs/en/policies).
