/**
 * Spendry SQLite database — application/indexing layer.
 * ONCHAIN = canonical financial state (AgentVault contract).
 * This DB = indexed cache, workflow state, and reporting. Rebuildable from events.
 */
import { Database } from "bun:sqlite";
import path from "path";

const DB_PATH = path.resolve(process.env.DB_PATH ?? "./spendry.db");

export const db = new Database(DB_PATH, { create: true });
db.exec("PRAGMA journal_mode=WAL;");
db.exec("PRAGMA foreign_keys=ON;");

// ── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS vaults (
    id               INTEGER PRIMARY KEY,   -- matches onchain vaultId
    owner_address    TEXT NOT NULL,
    agent_address    TEXT NOT NULL,
    name             TEXT NOT NULL,
    -- onchain canonical values (synced from events)
    balance_usdc     INTEGER NOT NULL DEFAULT 0,   -- 6-dec raw
    total_budget     INTEGER NOT NULL DEFAULT 0,
    spent_total      INTEGER NOT NULL DEFAULT 0,
    daily_limit      INTEGER NOT NULL DEFAULT 0,
    per_tx_limit     INTEGER NOT NULL DEFAULT 0,
    expiry           INTEGER NOT NULL DEFAULT 0,   -- unix ts
    active           INTEGER NOT NULL DEFAULT 1,   -- bool
    -- metadata
    created_at       INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at       INTEGER NOT NULL DEFAULT (unixepoch()),
    tx_hash          TEXT,
    block_number     INTEGER,
    -- data source annotation
    data_source      TEXT NOT NULL DEFAULT 'ONCHAIN_INDEXED'
  );

  CREATE INDEX IF NOT EXISTS idx_vaults_owner  ON vaults(owner_address);
  CREATE INDEX IF NOT EXISTS idx_vaults_agent  ON vaults(agent_address);

  CREATE TABLE IF NOT EXISTS spend_events (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    vault_id         INTEGER NOT NULL REFERENCES vaults(id),
    agent_address    TEXT NOT NULL,
    destination      TEXT NOT NULL,
    amount_usdc      INTEGER NOT NULL,   -- 6-dec raw
    spent_total      INTEGER NOT NULL,
    remaining_balance INTEGER NOT NULL,
    purpose_hash     TEXT NOT NULL,
    purpose_text     TEXT,               -- USER_GENERATED, stored offchain
    tx_hash          TEXT NOT NULL UNIQUE,
    block_number     INTEGER NOT NULL,
    block_timestamp  INTEGER NOT NULL,
    -- reconciliation
    reconciled       INTEGER NOT NULL DEFAULT 0,
    data_source      TEXT NOT NULL DEFAULT 'ONCHAIN_INDEXED'
  );

  CREATE INDEX IF NOT EXISTS idx_spend_vault    ON spend_events(vault_id);
  CREATE INDEX IF NOT EXISTS idx_spend_agent    ON spend_events(agent_address);
  CREATE INDEX IF NOT EXISTS idx_spend_dest     ON spend_events(destination);
  CREATE INDEX IF NOT EXISTS idx_spend_ts       ON spend_events(block_timestamp);
  CREATE INDEX IF NOT EXISTS idx_spend_hash     ON spend_events(tx_hash);

  CREATE TABLE IF NOT EXISTS deposit_events (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    vault_id         INTEGER NOT NULL REFERENCES vaults(id),
    funder_address   TEXT NOT NULL,
    amount_usdc      INTEGER NOT NULL,
    new_balance      INTEGER NOT NULL,
    tx_hash          TEXT NOT NULL UNIQUE,
    block_number     INTEGER NOT NULL,
    block_timestamp  INTEGER NOT NULL,
    data_source      TEXT NOT NULL DEFAULT 'ONCHAIN_INDEXED'
  );

  CREATE TABLE IF NOT EXISTS index_checkpoints (
    chain_id         INTEGER PRIMARY KEY,
    last_block       INTEGER NOT NULL DEFAULT 0,
    last_updated     INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS destinations (
    vault_id         INTEGER NOT NULL REFERENCES vaults(id),
    address          TEXT NOT NULL,
    label            TEXT,               -- USER_GENERATED
    added_at         INTEGER NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY (vault_id, address)
  );
`);

// ── Prepared statements ───────────────────────────────────────────────────────

export const q = {
  upsertVault: db.prepare(`
    INSERT INTO vaults (id, owner_address, agent_address, name, balance_usdc,
      total_budget, spent_total, daily_limit, per_tx_limit, expiry, active,
      tx_hash, block_number, updated_at)
    VALUES ($id, $owner, $agent, $name, $balance, $totalBudget, $spent,
      $dailyLimit, $perTxLimit, $expiry, $active, $txHash, $blockNumber, unixepoch())
    ON CONFLICT(id) DO UPDATE SET
      agent_address  = excluded.agent_address,
      name           = excluded.name,
      balance_usdc   = excluded.balance_usdc,
      total_budget   = excluded.total_budget,
      spent_total    = excluded.spent_total,
      daily_limit    = excluded.daily_limit,
      per_tx_limit   = excluded.per_tx_limit,
      expiry         = excluded.expiry,
      active         = excluded.active,
      updated_at     = unixepoch()
  `),

  updateVaultBalance: db.prepare(`
    UPDATE vaults SET balance_usdc = $balance, updated_at = unixepoch() WHERE id = $id
  `),

  updateVaultActive: db.prepare(`
    UPDATE vaults SET active = $active, updated_at = unixepoch() WHERE id = $id
  `),

  updateVaultSpent: db.prepare(`
    UPDATE vaults SET spent_total = $spent, balance_usdc = $balance, updated_at = unixepoch() WHERE id = $id
  `),

  insertSpend: db.prepare(`
    INSERT OR IGNORE INTO spend_events
      (vault_id, agent_address, destination, amount_usdc, spent_total,
       remaining_balance, purpose_hash, purpose_text, tx_hash, block_number, block_timestamp)
    VALUES ($vaultId, $agent, $dest, $amount, $spentTotal, $remaining,
      $purposeHash, $purposeText, $txHash, $blockNumber, $blockTs)
  `),

  insertDeposit: db.prepare(`
    INSERT OR IGNORE INTO deposit_events
      (vault_id, funder_address, amount_usdc, new_balance, tx_hash, block_number, block_timestamp)
    VALUES ($vaultId, $funder, $amount, $newBalance, $txHash, $blockNumber, $blockTs)
  `),

  getVaults: db.prepare(`SELECT * FROM vaults WHERE owner_address = $owner ORDER BY created_at DESC`),
  getVaultById: db.prepare(`SELECT * FROM vaults WHERE id = $id`),
  getSpends: db.prepare(`
    SELECT * FROM spend_events WHERE vault_id = $vaultId
    ORDER BY block_timestamp DESC LIMIT $limit OFFSET $offset
  `),
  getAllSpends: db.prepare(`
    SELECT s.*, v.name as vault_name FROM spend_events s
    JOIN vaults v ON s.vault_id = v.id
    WHERE v.owner_address = $owner
    ORDER BY s.block_timestamp DESC LIMIT $limit OFFSET $offset
  `),
  getSpendCount: db.prepare(`SELECT COUNT(*) as cnt FROM spend_events WHERE vault_id = $vaultId`),
  getTotalSpent: db.prepare(`SELECT SUM(amount_usdc) as total FROM spend_events WHERE vault_id = $vaultId`),
  getCheckpoint: db.prepare(`SELECT last_block FROM index_checkpoints WHERE chain_id = $chainId`),
  setCheckpoint: db.prepare(`
    INSERT INTO index_checkpoints (chain_id, last_block, last_updated)
    VALUES ($chainId, $block, unixepoch())
    ON CONFLICT(chain_id) DO UPDATE SET last_block = excluded.last_block, last_updated = unixepoch()
  `),
  getDestinations: db.prepare(`SELECT * FROM destinations WHERE vault_id = $vaultId`),
  upsertDestination: db.prepare(`
    INSERT OR IGNORE INTO destinations (vault_id, address, label) VALUES ($vaultId, $address, $label)
  `),
  removeDestination: db.prepare(`DELETE FROM destinations WHERE vault_id = $vaultId AND address = $address`),
};
