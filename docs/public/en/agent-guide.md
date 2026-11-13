---
title: Agent guide
description: How an agent wallet spends from a vault, with the call to make and the errors to handle.
order: 5
visibility: public
---

# Agent guide

This page is for developers connecting an AI agent to a vault.

## What you need

- The **contract address** (shown in the app under **Settings**).
- The **vault number** from the vault card (for example `#2` is vault `2`).
- A wallet whose address is the vault's **agent wallet**. Only that wallet can spend.
- The contract ABI. A published ABI file for integrators: Not Defined.

## The call

The agent calls `spend` on the contract:

```
spend(vaultId, destination, amount, purposeHash)
```

| Argument | Meaning |
|----------|---------|
| `vaultId` | The vault number. |
| `destination` | The address to pay. |
| `amount` | USDC in the smallest unit (6 decimals): `1 USDC = 1000000`. |
| `purposeHash` | A hash of a short text describing why. Only the hash is stored onchain; keep the text yourself. |

## Example (viem)

```
const purposeHash = keccak256(toHex("Search: quarterly report"))
await walletClient.writeContract({
  address: AGENT_VAULT_ADDRESS,
  abi: AGENT_VAULT_ABI,
  functionName: "spend",
  args: [vaultId, destinationAddress, amount, purposeHash],
})
```

## Handle these errors

If any rule fails the call reverts with one of these. See [Spending rules](/docs/en/policies).

| Error | Meaning | Suggested handling |
|-------|---------|--------------------|
| `BudgetExhausted` | Not enough total budget left. | Stop; ask the owner to raise the budget. |
| `DailyLimitExceeded` | Over the daily limit. | Retry after the 24-hour window resets. |
| `PerTxLimitExceeded` | One spend is too large. | Split into smaller spends. |
| `DestinationNotAllowed` | Destination is not on the list. | Do not retry; ask the owner. |
| `PolicyExpired` | The vault has expired. | Stop; ask the owner. |
| `VaultInactive` | The vault is paused. | Wait for the owner to resume it. |
| `InsufficientVaultBalance` | The vault holds too little USDC. | Ask the owner to fund the vault. |
| `NotAgent` | The caller is not the vault's agent wallet. | Check which wallet is signing. |

## After a spend

A successful spend appears in **Spend History** in the app. Your agent can also read the vault state from the contract at any time.

Never share the agent wallet's private key with anyone, and never paste it into the app. Spendry never asks for it.

Next: [FAQ](/docs/en/faq).
