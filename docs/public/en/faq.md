---
title: FAQ and limits
description: Answers to common questions and the current limits of the product.
order: 6
visibility: public
---

# FAQ and limits

## Can I use real money?

No. Spendry runs on Arc Testnet with test USDC only. Mainnet support: Not Defined.

## Is the contract audited?

Spending rules are enforced by the smart contract, and it was reviewed with automated tools during development. An independent third-party audit: Not Defined.

## Can the agent take money out of the vault?

An agent can only send USDC to a destination, and only within the vault's rules. Only the owner can withdraw unspent funds, and withdrawing pauses the vault.

## Who can fund a vault?

Anyone. Funding is not limited to the owner.

## Does creating a vault cost USDC?

Creating a vault moves no USDC into it, but each transaction pays a network fee, paid in USDC on Arc. Product fees: Not Defined.

## Why is my spend history empty or slow to load?

Either no agent has spent yet, or the block explorer that provides the history limited requests. Wait a few minutes and press **Refresh**.

## How does the daily limit work?

The daily limit uses a fixed 24-hour window that resets after 24 hours, not a sliding window. See [Spending rules](/docs/en/policies).

## Can I change a vault's limits in the app?

Not yet. The contract supports it, but the app has no screen for it (TBD). See [Features](/docs/en/features).

## What are the Privacy Policy and Terms of Service?

Not Defined. The links in the app footer are placeholders.

## How do I get support?

Support contact: Not Defined.

## Which languages are supported?

This documentation: English and Tiếng Việt. Use the language switch at the top of any page. The app: English only.
