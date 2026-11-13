---
title: Spending rules
description: Every rule the contract checks before an agent can spend, and what each error means.
order: 4
visibility: public
---

# Spending rules

When an agent asks to spend, the contract checks the rules below, in this order. The first rule that fails stops the spend and no USDC moves.

| # | Rule | Error if it fails |
|---|------|-------------------|
| 1 | The amount is greater than zero and the destination is a real address. | `ZeroAmount`, `ZeroAddress` |
| 2 | The caller is the agent wallet set on the vault. | `NotAgent` |
| 3 | The vault is active (not paused). | `VaultInactive` |
| 4 | The vault has not expired. | `PolicyExpired` |
| 5 | If you set an allowed-destination list, the destination is on it. | `DestinationNotAllowed` |
| 6 | The amount is within the per-transaction limit, if one is set. | `PerTxLimitExceeded` |
| 7 | The amount fits in the remaining total budget. | `BudgetExhausted` |
| 8 | The amount fits in the daily limit, if one is set. | `DailyLimitExceeded` |
| 9 | The vault holds enough USDC. | `InsufficientVaultBalance` |

## Total budget

The lifetime ceiling for the vault. Spent amounts only go up, so the remaining budget only goes down. You cannot lower the budget below what was already spent.

## Daily limit

A limit for each 24-hour window. It is a fixed window, not a sliding one: the daily counter resets after 24 hours have passed since the window began. `0` means no daily limit.

## Per-transaction limit

The largest single spend allowed. `0` means no limit.

## Expiry

After the expiry time the agent can no longer spend. `0` means the vault never expires.

## Allowed destinations

If the list is empty, the agent can pay any address. As soon as one address is added, the agent can pay only addresses on the list. Managing this list is available in the contract; the app does not have a screen for it yet (TBD).

## Pausing

- **Vault pause:** the owner can pause one vault. The agent cannot spend until it is resumed.
- **Global pause:** the contract administrator can pause the whole contract, which also blocks creating and funding vaults.

## Who can do what

| Action | Who |
|--------|-----|
| Create a vault | Anyone (the creator becomes the owner) |
| Fund a vault | Anyone |
| Pause, resume, change settings, withdraw | The vault owner |
| Spend | Only the vault's agent wallet |

Next: [Agent guide](/docs/en/agent-guide).
