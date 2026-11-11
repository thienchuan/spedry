/**
 * AgentVault contract ABI — generated from the contract source.
 * This is the minimal ABI needed by the frontend.
 */
export const AGENT_VAULT_ABI = [
  // Events
  {
    type: "event",
    name: "VaultCreated",
    inputs: [
      { name: "vaultId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "agent", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "totalBudget", type: "uint256", indexed: false },
      { name: "dailyLimit", type: "uint128", indexed: false },
      { name: "perTxLimit", type: "uint128", indexed: false },
      { name: "expiry", type: "uint64", indexed: false },
    ],
  },
  {
    type: "event",
    name: "VaultFunded",
    inputs: [
      { name: "vaultId", type: "uint256", indexed: true },
      { name: "funder", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "newBalance", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "AgentSpend",
    inputs: [
      { name: "vaultId", type: "uint256", indexed: true },
      { name: "agent", type: "address", indexed: true },
      { name: "destination", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "spentTotal", type: "uint256", indexed: false },
      { name: "remainingBalance", type: "uint256", indexed: false },
      { name: "purposeHash", type: "bytes32", indexed: false },
    ],
  },
  // Write functions
  {
    type: "function",
    name: "createVault",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agent", type: "address" },
      { name: "name", type: "string" },
      { name: "totalBudget", type: "uint256" },
      { name: "dailyLimit", type: "uint128" },
      { name: "perTxLimit", type: "uint128" },
      { name: "expiry", type: "uint64" },
    ],
    outputs: [{ name: "vaultId", type: "uint256" }],
  },
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "vaultId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "updatePolicy",
    stateMutability: "nonpayable",
    inputs: [
      { name: "vaultId", type: "uint256" },
      { name: "totalBudget", type: "uint256" },
      { name: "dailyLimit", type: "uint128" },
      { name: "perTxLimit", type: "uint128" },
      { name: "expiry", type: "uint64" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "addDestination",
    stateMutability: "nonpayable",
    inputs: [
      { name: "vaultId", type: "uint256" },
      { name: "destination", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "removeDestination",
    stateMutability: "nonpayable",
    inputs: [
      { name: "vaultId", type: "uint256" },
      { name: "destination", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "pauseVault",
    stateMutability: "nonpayable",
    inputs: [{ name: "vaultId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "resumeVault",
    stateMutability: "nonpayable",
    inputs: [{ name: "vaultId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "setAgent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "vaultId", type: "uint256" },
      { name: "newAgent", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [
      { name: "vaultId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "spend",
    stateMutability: "nonpayable",
    inputs: [
      { name: "vaultId", type: "uint256" },
      { name: "destination", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "purposeHash", type: "bytes32" },
    ],
    outputs: [],
  },
  // Read functions
  {
    type: "function",
    name: "getVault",
    stateMutability: "view",
    inputs: [{ name: "vaultId", type: "uint256" }],
    outputs: [
      { name: "owner", type: "address" },
      { name: "agent", type: "address" },
      { name: "name", type: "string" },
      { name: "balance", type: "uint256" },
      { name: "totalBudget", type: "uint256" },
      { name: "spentTotal", type: "uint256" },
      { name: "dailyLimit", type: "uint128" },
      { name: "perTxLimit", type: "uint128" },
      { name: "expiry", type: "uint64" },
      { name: "active", type: "bool" },
      { name: "windowStart", type: "uint64" },
      { name: "windowSpent", type: "uint128" },
    ],
  },
  {
    type: "function",
    name: "getOwnerVaults",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "isDestinationAllowed",
    stateMutability: "view",
    inputs: [
      { name: "vaultId", type: "uint256" },
      { name: "destination", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "nextVaultId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
