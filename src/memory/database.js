// src/memory/database.js - SQLite database manager
import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';
import { existsSync, mkdirSync } from 'fs';

let db;

export async function initDatabase() {
  if (!existsSync('./data')) {
    mkdirSync('./data', { recursive: true });
  }

  db = new Database('./data/nadia.db');
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS server_settings (
      guild_id TEXT PRIMARY KEY,
      personality TEXT DEFAULT 'chill_pakistani',
      mood TEXT DEFAULT 'normal',
      talk_level INTEGER DEFAULT 5,
      passive_chat INTEGER DEFAULT 1,
      passive_chance REAL DEFAULT 0.08,
      language_style TEXT DEFAULT 'mixed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS channel_settings (
      channel_id TEXT PRIMARY KEY,
      guild_id TEXT,
      enabled INTEGER DEFAULT 1,
      passive_enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS short_term_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      content TEXT NOT NULL,
      is_bot INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS long_term_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT,
      memory_type TEXT NOT NULL,
      content TEXT NOT NULL,
      importance INTEGER DEFAULT 5,
      last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      friendship_level INTEGER DEFAULT 0,
      interaction_count INTEGER DEFAULT 0,
      nickname TEXT,
      notes TEXT,
      last_interaction DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS cooldowns (
      id TEXT PRIMARY KEY,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mood_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT,
      mood TEXT NOT NULL,
      reason TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_stm_channel ON short_term_memory(channel_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_stm_guild ON short_term_memory(guild_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_ltm_user ON long_term_memory(guild_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_rel_user ON relationships(guild_id, user_id);
  `);

  logger.info('📊 All database tables ready');
  return db;
}

export function getDB() {
  if (!db) throw new Error('Database not initialized!');
  return db;
}

export function getServerSettings(guildId) {
  const db = getDB();
  let settings = db.prepare('SELECT * FROM server_settings WHERE guild_id = ?').get(guildId);

  if (!settings) {
    db.prepare(`
      INSERT INTO server_settings (guild_id) VALUES (?)
    `).run(guildId);
    settings = db.prepare('SELECT * FROM server_settings WHERE guild_id = ?').get(guildId);
  }

  return settings;
}

export function updateServerSettings(guildId, updates) {
  const db = getDB();
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);

  db.prepare(`
    UPDATE server_settings SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?
  `).run(...values, guildId);
}

export function getChannelSettings(channelId) {
  const db = getDB();
  return db.prepare('SELECT * FROM channel_settings WHERE channel_id = ?').get(channelId);
}

export function setChannelEnabled(channelId, guildId, enabled) {
  const db = getDB();
  db.prepare(`
    INSERT INTO channel_settings (channel_id, guild_id, enabled)
    VALUES (?, ?, ?)
    ON CONFLICT(channel_id) DO UPDATE SET enabled = ?
  `).run(channelId, guildId, enabled ? 1 : 0, enabled ? 1 : 0);
}

export function addShortTermMemory(guildId, channelId, userId, username, content, isBot = false) {
  const db = getDB();
  db.prepare(`
    INSERT INTO short_term_memory (guild_id, channel_id, user_id, username, content, is_bot)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(guildId, channelId, userId, username, content, isBot ? 1 : 0);

  db.prepare(`
    DELETE FROM short_term_memory
    WHERE channel_id = ? AND id NOT IN (
      SELECT id FROM short_term_memory WHERE channel_id = ? ORDER BY timestamp DESC LIMIT 100
    )
  `).run(channelId, channelId);
}

export function getRecentMessages(channelId, limit = 25) {
  const db = getDB();
  return db.prepare(`
    SELECT * FROM short_term_memory
    WHERE channel_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(channelId, limit).reverse();
}

export function clearChannelMemory(channelId) {
  const db = getDB();
  db.prepare('DELETE FROM short_term_memory WHERE channel_id = ?').run(channelId);
}

export function addLongTermMemory(guildId, userId, type, content, importance = 5) {
  const db = getDB();
  db.prepare(`
    INSERT INTO long_term_memory (guild_id, user_id, memory_type, content, importance)
    VALUES (?, ?, ?, ?, ?)
  `).run(guildId, userId, type, content, importance);
}

export function getLongTermMemories(guildId, userId = null, limit = 10) {
  const db = getDB();

  if (userId) {
    return db.prepare(`
      SELECT * FROM long_term_memory
      WHERE guild_id = ? AND (user_id = ? OR user_id IS NULL)
      ORDER BY importance DESC, last_accessed DESC
      LIMIT ?
    `).all(guildId, userId, limit);
  }

  return db.prepare(`
    SELECT * FROM long_term_memory
    WHERE guild_id = ?
    ORDER BY importance DESC, last_accessed DESC
    LIMIT ?
  `).all(guildId, limit);
}

export function cleanOldMemories(days = 30) {
  const db = getDB();
  const result = db.prepare(`
    DELETE FROM long_term_memory
    WHERE importance < 7
    AND last_accessed < datetime('now', '-' || ? || ' days')
  `).run(days);

  return result.changes;
}

export function getRelationship(guildId, userId) {
  const db = getDB();
  return db.prepare(`
    SELECT * FROM relationships WHERE guild_id = ? AND user_id = ?
  `).get(guildId, userId);
}

export function updateRelationship(guildId, userId, username, friendshipDelta = 1) {
  const db = getDB();

  const existing = getRelationship(guildId, userId);

  if (existing) {
    const newLevel = Math.max(-10, Math.min(100, existing.friendship_level + friendshipDelta));
    db.prepare(`
      UPDATE relationships
      SET friendship_level = ?,
          interaction_count = interaction_count + 1,
          username = ?,
          last_interaction = CURRENT_TIMESTAMP
      WHERE guild_id = ? AND user_id = ?
    `).run(newLevel, username, guildId, userId);
  } else {
    db.prepare(`
      INSERT INTO relationships (guild_id, user_id, username, friendship_level, interaction_count)
      VALUES (?, ?, ?, ?, 1)
    `).run(guildId, userId, username, Math.max(0, friendshipDelta));
  }
}

export function setNickname(guildId, userId, nickname) {
  const db = getDB();
  db.prepare(`
    UPDATE relationships SET nickname = ? WHERE guild_id = ? AND user_id = ?
  `).run(nickname, guildId, userId);
}

export function getTopFriends(guildId, limit = 5) {
  const db = getDB();
  return db.prepare(`
    SELECT * FROM relationships
    WHERE guild_id = ?
    ORDER BY friendship_level DESC
    LIMIT ?
  `).all(guildId, limit);
}

export function getCooldown(id) {
  const db = getDB();
  const row = db.prepare('SELECT * FROM cooldowns WHERE id = ?').get(id);
  return row ? new Date(row.timestamp).getTime() : 0;
}

export function setCooldown(id) {
  const db = getDB();
  db.prepare(`
    INSERT INTO cooldowns (id, timestamp) VALUES (?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET timestamp = CURRENT_TIMESTAMP
  `).run(id);
}

export function isCooldownActive(id, durationMs) {
  const lastTime = getCooldown(id);
  return (Date.now() - lastTime) < durationMs;
}

export function dailyCleanup() {
  const db = getDB();

  const stmResult = db.prepare(`
    DELETE FROM short_term_memory
    WHERE timestamp < datetime('now', '-1 day')
  `).run();

  db.prepare(`
    DELETE FROM cooldowns
    WHERE timestamp < datetime('now', '-1 hour')
  `).run();

  const ltmResult = cleanOldMemories(30);

  logger.info(`🧹 Cleanup: ${stmResult.changes} short-term, ${ltmResult} long-term memories cleaned`);
}
