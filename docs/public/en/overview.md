---
title: Overview
description: What Spendry is and how it keeps an AI agent's USDC spending inside limits you set.
order: 1
visibility: public
---

# Spendry overview

Spendry lets you give an AI agent a USDC spending allowance with limits it cannot break. You create a **vault**, set the rules, and fund it. The agent spends from the vault through a smart contract, and the contract checks every rule before any USDC moves.

## Who it is for

Teams and developers who run AI agents that need to pay for things, and want hard limits on what an agent can spend.

## How it works

1. **Create a vault.** Give it a name, the agent's wallet address, a total budget, and optional limits.
2. **Fund the vault.** Deposit USDC into it. Anyone can top up a vault.
3. **The agent spends.** The agent wallet asks the contract to pay a destination. The contract allows it only if every rule passes.
4. **You monitor.** The dashboard and spend history show budgets, balances and every spend.
5. **You stay in control.** Pause a vault at any time to stop the agent from spending.

## What the contract enforces

- A total budget the agent can never exceed.
- A daily limit and a per-transaction limit.
- An optional expiry date.
- An optional list of allowed destination addresses.
- Only the agent wallet you set can spend from the vault.

These rules run on the blockchain, not in the app. See [Spending rules](/docs/en/policies) for the details.

## Network

Spendry currently runs on **Arc Testnet** with test USDC. Do not use real funds. On Arc, USDC is also the token that pays transaction fees.

## Status

| Topic | State |
|-------|-------|
| Network | Arc Testnet only |
| Mainnet | Not Defined |
| Independent security audit | Not Defined |

Next: [Features](/docs/en/features) or [Getting started](/docs/en/getting-started).
