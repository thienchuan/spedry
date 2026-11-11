// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AgentVault
 * @notice Programmable USDC budget vault for AI agents with enforced spend policies.
 *
 * Each vault is a named budget cell owned by an owner address. A vault holds USDC
 * and has a set of policies that constrain how an authorized agent wallet may spend it:
 *   - totalBudget: the maximum total USDC the agent may ever spend from this vault
 *   - spentTotal:  how much has been spent (monotonically increasing)
 *   - dailyLimit:  maximum spend per rolling 24-hour window (0 = no daily limit)
 *   - perTxLimit:  maximum USDC per single spend call (0 = no per-tx limit)
 *   - allowedDestinations: optional whitelist of recipient addresses (empty = any)
 *   - expiry:      unix timestamp after which the agent cannot spend (0 = never)
 *   - active:      owner can pause an agent without withdrawing funds
 *
 * State machine per vault:
 *   CONFIGURED → FUNDED → AGENT_ACTIVE → [SPEND_REQUEST] → POLICY_VALIDATED → EXECUTED
 *                                                         ↘ POLICY_REJECTED
 *
 * Onchain = canonical spend records.
 * Offchain DB = indexed cache / reporting layer, rebuildable from events.
 */
contract AgentVault is ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    address private immutable _admin;

    // ── Structs ────────────────────────────────────────────────────────────

    struct Policy {
        uint256 totalBudget;     // max lifetime spend in USDC (6-dec)
        uint256 spentTotal;      // monotonically increasing
        uint128 dailyLimit;      // max per tumbling 24h window (0 = disabled)
        uint128 perTxLimit;      // max per single spend call (0 = disabled)
        uint64  expiry;          // unix ts; 0 = never
        bool    active;
        uint64  windowStart;     // start of current 24h window
        uint128 windowSpent;     // spend in current window
    }

    struct Vault {
        address owner;
        address agent;
        string  name;
        uint256 balance;
        Policy  policy;
    }

    // ── Storage ────────────────────────────────────────────────────────────

    uint256 private _nextVaultId;

    mapping(uint256 => Vault) private _vaults;
    mapping(uint256 => mapping(address => bool)) private _allowedDests;
    mapping(uint256 => uint256) private _destCount;
    mapping(address => uint256[]) private _ownerVaults;

    // ── Events ────────────────────────────────────────────────────────────

    event VaultCreated(
        uint256 indexed vaultId,
        address indexed owner,
        address indexed agent,
        string  name,
        uint256 totalBudget,
        uint128 dailyLimit,
        uint128 perTxLimit,
        uint64  expiry
    );

    event VaultFunded(
        uint256 indexed vaultId,
        address indexed funder,
        uint256 amount,
        uint256 newBalance
    );

    event AgentSpend(
        uint256 indexed vaultId,
        address indexed agent,
        address indexed destination,
        uint256 amount,
        uint256 spentTotal,
        uint256 remainingBalance,
        bytes32 purposeHash
    );

    event PolicyUpdated(
        uint256 indexed vaultId,
        uint256 totalBudget,
        uint128 dailyLimit,
        uint128 perTxLimit,
        uint64  expiry
    );

    event VaultActiveChanged(uint256 indexed vaultId, bool active, address indexed by);
    event VaultWithdrawn(uint256 indexed vaultId, address indexed to, uint256 amount);
    event AgentUpdated(uint256 indexed vaultId, address indexed oldAgent, address indexed newAgent);
    event DestinationAdded(uint256 indexed vaultId, address indexed destination);
    event DestinationRemoved(uint256 indexed vaultId, address indexed destination);

    // ── Errors ────────────────────────────────────────────────────────────

    error NotOwner();
    error NotAgent();
    error NotAdmin();
    error VaultInactive();
    error PolicyExpired();
    error BudgetExhausted(uint256 requested, uint256 remaining);
    error DailyLimitExceeded(uint256 requested, uint256 available);
    error PerTxLimitExceeded(uint256 requested, uint256 limit);
    error DestinationNotAllowed(address destination);
    error InsufficientVaultBalance(uint256 requested, uint256 available);
    error ZeroAmount();
    error ZeroAddress();
    error BudgetBelowSpent(uint256 newBudget, uint256 alreadySpent);
    error VaultNotFound();

    // ── Constructor ───────────────────────────────────────────────────────

    constructor(address usdcAddress, address admin) {
        if (usdcAddress == address(0)) revert ZeroAddress();
        if (admin == address(0)) revert ZeroAddress();
        usdc = IERC20(usdcAddress);
        _admin = admin;
    }

    // ── Owner: create & configure ─────────────────────────────────────────

    /**
     * @notice Create a new agent vault with an initial spend policy.
     * @param agent       Wallet the agent will use to call `spend`.
     * @param name        Human-readable label.
     * @param totalBudget Maximum lifetime USDC spend allowed.
     * @param dailyLimit  Rolling 24-hour cap (0 = disabled).
     * @param perTxLimit  Per-transaction cap (0 = disabled).
     * @param expiry      Expiry unix timestamp (0 = never).
     */
    function createVault(
        address agent,
        string calldata name,
        uint256 totalBudget,
        uint128 dailyLimit,
        uint128 perTxLimit,
        uint64  expiry
    ) external whenNotPaused returns (uint256 vaultId) {
        if (agent == address(0)) revert ZeroAddress();
        if (totalBudget == 0) revert ZeroAmount();

        vaultId = _nextVaultId++;

        _vaults[vaultId] = Vault({
            owner:   msg.sender,
            agent:   agent,
            name:    name,
            balance: 0,
            policy:  Policy({
                totalBudget:  totalBudget,
                spentTotal:   0,
                dailyLimit:   dailyLimit,
                perTxLimit:   perTxLimit,
                expiry:       expiry,
                active:       true,
                windowStart:  uint64(block.timestamp),
                windowSpent:  0
            })
        });

        _ownerVaults[msg.sender].push(vaultId);

        emit VaultCreated(vaultId, msg.sender, agent, name, totalBudget, dailyLimit, perTxLimit, expiry);
    }

    /**
     * @notice Deposit USDC into a vault. Anyone may top up a vault.
     */
    function deposit(uint256 vaultId, uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        Vault storage v = _vaults[vaultId];
        if (v.owner == address(0)) revert VaultNotFound();

        v.balance += amount;
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit VaultFunded(vaultId, msg.sender, amount, v.balance);
    }

    /**
     * @notice Update the spend policy. Cannot lower totalBudget below already-spent.
     */
    function updatePolicy(
        uint256 vaultId,
        uint256 totalBudget,
        uint128 dailyLimit,
        uint128 perTxLimit,
        uint64  expiry
    ) external whenNotPaused {
        Vault storage v = _vaults[vaultId];
        if (v.owner != msg.sender) revert NotOwner();
        if (totalBudget < v.policy.spentTotal) revert BudgetBelowSpent(totalBudget, v.policy.spentTotal);

        v.policy.totalBudget = totalBudget;
        v.policy.dailyLimit  = dailyLimit;
        v.policy.perTxLimit  = perTxLimit;
        v.policy.expiry      = expiry;

        emit PolicyUpdated(vaultId, totalBudget, dailyLimit, perTxLimit, expiry);
    }

    /// @notice Whitelist a destination address. Once any destination is added, only whitelisted ones may be paid.
    function addDestination(uint256 vaultId, address destination) external {
        if (_vaults[vaultId].owner != msg.sender) revert NotOwner();
        if (destination == address(0)) revert ZeroAddress();
        if (!_allowedDests[vaultId][destination]) {
            _allowedDests[vaultId][destination] = true;
            _destCount[vaultId]++;
            emit DestinationAdded(vaultId, destination);
        }
    }

    /// @notice Remove a whitelisted destination.
    function removeDestination(uint256 vaultId, address destination) external {
        if (_vaults[vaultId].owner != msg.sender) revert NotOwner();
        if (_allowedDests[vaultId][destination]) {
            _allowedDests[vaultId][destination] = false;
            if (_destCount[vaultId] > 0) _destCount[vaultId]--;
            emit DestinationRemoved(vaultId, destination);
        }
    }

    /// @notice Pause agent spending without withdrawing funds.
    function pauseVault(uint256 vaultId) external {
        Vault storage v = _vaults[vaultId];
        if (v.owner != msg.sender) revert NotOwner();
        v.policy.active = false;
        emit VaultActiveChanged(vaultId, false, msg.sender);
    }

    /// @notice Resume a paused vault.
    function resumeVault(uint256 vaultId) external {
        Vault storage v = _vaults[vaultId];
        if (v.owner != msg.sender) revert NotOwner();
        v.policy.active = true;
        emit VaultActiveChanged(vaultId, true, msg.sender);
    }

    /// @notice Replace the agent wallet.
    function setAgent(uint256 vaultId, address newAgent) external {
        Vault storage v = _vaults[vaultId];
        if (v.owner != msg.sender) revert NotOwner();
        if (newAgent == address(0)) revert ZeroAddress();
        address old = v.agent;
        v.agent = newAgent;
        emit AgentUpdated(vaultId, old, newAgent);
    }

    /// @notice Withdraw unspent balance to owner. Auto-pauses the vault.
    function withdraw(uint256 vaultId, uint256 amount) external nonReentrant {
        Vault storage v = _vaults[vaultId];
        if (v.owner != msg.sender) revert NotOwner();
        if (amount > v.balance) revert InsufficientVaultBalance(amount, v.balance);

        v.policy.active = false;
        v.balance -= amount;
        usdc.safeTransfer(msg.sender, amount);

        emit VaultWithdrawn(vaultId, msg.sender, amount);
    }

    // ── Agent: spend ──────────────────────────────────────────────────────

    /**
     * @notice Authorized agent requests a spend.
     * All policy constraints are validated atomically before any transfer.
     *
     * @param vaultId     Target vault.
     * @param destination Recipient address.
     * @param amount      USDC amount (6 decimals).
     * @param purposeHash keccak256 of a human-readable purpose string (kept offchain).
     */
    function spend(
        uint256 vaultId,
        address destination,
        uint256 amount,
        bytes32 purposeHash
    ) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        if (destination == address(0)) revert ZeroAddress();

        Vault storage v = _vaults[vaultId];

        if (v.agent != msg.sender) revert NotAgent();
        if (!v.policy.active) revert VaultInactive();
        if (v.policy.expiry != 0 && block.timestamp > v.policy.expiry) revert PolicyExpired();

        if (_destCount[vaultId] > 0 && !_allowedDests[vaultId][destination]) {
            revert DestinationNotAllowed(destination);
        }

        if (v.policy.perTxLimit != 0 && amount > v.policy.perTxLimit) {
            revert PerTxLimitExceeded(amount, v.policy.perTxLimit);
        }

        uint256 remaining = v.policy.totalBudget - v.policy.spentTotal;
        if (amount > remaining) revert BudgetExhausted(amount, remaining);

        if (v.policy.dailyLimit != 0) {
            if (block.timestamp >= v.policy.windowStart + 24 hours) {
                v.policy.windowStart = uint64(block.timestamp);
                v.policy.windowSpent = 0;
            }
            uint256 windowAvail = uint256(v.policy.dailyLimit) - uint256(v.policy.windowSpent);
            if (amount > windowAvail) revert DailyLimitExceeded(amount, windowAvail);
            // casting to 'uint128' is safe: amount <= windowAvail <= dailyLimit <= uint128.max
            // forge-lint: disable-next-line(unsafe-typecast)
            v.policy.windowSpent += uint128(amount);
        }

        if (amount > v.balance) revert InsufficientVaultBalance(amount, v.balance);

        v.policy.spentTotal += amount;
        v.balance -= amount;
        usdc.safeTransfer(destination, amount);

        emit AgentSpend(vaultId, msg.sender, destination, amount, v.policy.spentTotal, v.balance, purposeHash);
    }

    // ── Views ─────────────────────────────────────────────────────────────

    function getVault(uint256 vaultId) external view returns (
        address owner,
        address agent,
        string memory name,
        uint256 balance,
        uint256 totalBudget,
        uint256 spentTotal,
        uint128 dailyLimit,
        uint128 perTxLimit,
        uint64  expiry,
        bool    active,
        uint64  windowStart,
        uint128 windowSpent
    ) {
        Vault storage v = _vaults[vaultId];
        Policy storage p = v.policy;
        return (
            v.owner, v.agent, v.name, v.balance,
            p.totalBudget, p.spentTotal, p.dailyLimit, p.perTxLimit,
            p.expiry, p.active, p.windowStart, p.windowSpent
        );
    }

    function isDestinationAllowed(uint256 vaultId, address destination) external view returns (bool) {
        if (_destCount[vaultId] == 0) return true;
        return _allowedDests[vaultId][destination];
    }

    function getOwnerVaults(address owner) external view returns (uint256[] memory) {
        return _ownerVaults[owner];
    }

    function nextVaultId() external view returns (uint256) {
        return _nextVaultId;
    }

    // ── Admin: global pause ───────────────────────────────────────────────

    function pause() external {
        if (msg.sender != _admin) revert NotAdmin();
        _pause();
    }

    function unpause() external {
        if (msg.sender != _admin) revert NotAdmin();
        _unpause();
    }
}
