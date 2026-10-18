import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(process.env.DB_FILE || path.join(DATA_DIR, 'mmo.sqlite'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL COLLATE NOCASE,
  pass_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen INTEGER,
  xp INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  day_streak INTEGER NOT NULL DEFAULT 0,
  last_day TEXT,
  settings TEXT NOT NULL DEFAULT '{}',
  avatar TEXT NOT NULL DEFAULT '{}',
  badges TEXT NOT NULL DEFAULT '[]',
  frames TEXT NOT NULL DEFAULT '["none"]',
  progress TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS questions (
  qid TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  template_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  tier TEXT NOT NULL,
  context TEXT NOT NULL DEFAULT 'learn',
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  answered_at INTEGER
);
CREATE INDEX IF NOT EXISTS q_user ON questions(user_id, created_at);
CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  qid TEXT NOT NULL,
  template_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  tier TEXT NOT NULL,
  context TEXT NOT NULL,
  correct INTEGER NOT NULL,
  counted INTEGER NOT NULL,
  time_ms INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS a_user ON attempts(user_id, created_at);
CREATE TABLE IF NOT EXISTS mistakes (
  user_id INTEGER NOT NULL,
  qid TEXT NOT NULL,
  template_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  resolved_at INTEGER,
  retries INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, qid)
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  data TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS e_user ON events(user_id, created_at);
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  body TEXT NOT NULL,
  read_at INTEGER
);
CREATE TABLE IF NOT EXISTS mocks (
  user_id INTEGER NOT NULL,
  window INTEGER NOT NULL,
  subject TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  submitted_at INTEGER,
  qids TEXT NOT NULL,
  score REAL,
  grade TEXT,
  PRIMARY KEY (user_id, window, subject)
);
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT
);
`);

export const J = {
  parse(s, d) { try { return s ? JSON.parse(s) : d; } catch { return d; } },
};

export function getMeta(key, d = null) {
  const r = db.prepare('SELECT value FROM meta WHERE key = ?').get(key);
  return r ? J.parse(r.value, d) : d;
}
export function setMeta(key, v) {
  db.prepare('INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, JSON.stringify(v));
}

export function tx(fn) {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
}
