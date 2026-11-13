# Features

Status key: **App** = usable from the UI; **Contract** = exists onchain only, no UI; **No** = not built.

| Feature | Status | Where |
|---------|--------|-------|
| Connect wallet (injected wallets) | App | `Layout.tsx`, `config.ts` |
| Wrong-network warning and switch prompt | App | `Layout.tsx`, sheets |
| Create vault (name, agent, budget, daily, per-tx, duration) | App | `CreateVaultSheet.tsx` |
| Fund vault (anyone) | App | `DepositSheet.tsx` |
| Pause / resume a vault | App | `AgentVaults.tsx` |
| Vault list with budget bar, policy pills, status | App | `AgentVaults.tsx` |
| Dashboard totals and utilization | App | `Dashboard.tsx` |
| Recent spends (dashboard) and full history | App | `Dashboard.tsx`, `SpendHistory.tsx` |
| Per-vault recent spends (expandable) | App | `AgentVaults.tsx` |
| Settings (network, contract, agent integration snippet) | App | `SettingsPage.tsx` |
| Public bilingual documentation | App | `/docs` (`DocsPage.tsx`) |
| Agent `spend()` with atomic policy checks | Contract | `AgentVault.sol` |
| Update policy after creation | Contract | `updatePolicy` |
| Destination whitelist add / remove | Contract | `addDestination`, `removeDestination` |
| Replace agent wallet | Contract | `setAgent` |
| Withdraw unspent balance (auto-pauses vault) | Contract | `withdraw` |
| Global pause (admin) | Contract | `pause`, `unpause` |
| Destination labels, spend purpose text, reconciliation | No | Existed in the legacy `server/` schema only |
| Notifications / alerts | No | Not Defined |
| Mainnet support | No | Not Defined |
| Multi-language app UI | No | App UI is English only |
| Legal pages (Privacy, Terms) | No | Footer links are `#` placeholders |

## Known mismatch

`README.md` previously stated owners can update policy and manage destinations from the app. The UI does not offer these; they are contract functions only. README was corrected on 2026-11-11.
