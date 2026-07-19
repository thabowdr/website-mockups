/* db.js – SQLite-Schema und Zugriffsfunktionen. */
'use strict';

const Database = require('better-sqlite3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, 'portal.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS betriebe (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    token       TEXT NOT NULL,
    wirt_phone  TEXT DEFAULT '',
    open        TEXT DEFAULT '11:00',
    close       TEXT DEFAULT '21:30',
    closed_days TEXT DEFAULT '[1]',
    seats       INTEGER DEFAULT 40
  );
  CREATE TABLE IF NOT EXISTS reservierungen (
    id            TEXT PRIMARY KEY,
    betrieb_id    TEXT NOT NULL REFERENCES betriebe(id),
    date          TEXT NOT NULL,
    time          TEXT NOT NULL,
    guests        INTEGER NOT NULL,
    name          TEXT NOT NULL,
    phone         TEXT NOT NULL,
    note          TEXT DEFAULT '',
    status        TEXT DEFAULT 'neu',
    proposed_time TEXT,
    guest_token   TEXT UNIQUE,
    reminded      INTEGER DEFAULT 0,
    created_at    TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS nachrichten (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    resv_id  TEXT REFERENCES reservierungen(id),
    betrieb_id TEXT NOT NULL,
    ts       TEXT DEFAULT (datetime('now')),
    event    TEXT NOT NULL,
    to_phone TEXT NOT NULL,
    text     TEXT NOT NULL,
    mode     TEXT DEFAULT 'sim'
  );
  CREATE INDEX IF NOT EXISTS idx_resv_betrieb ON reservierungen(betrieb_id, date);
  CREATE INDEX IF NOT EXISTS idx_msg_betrieb ON nachrichten(betrieb_id, ts);
`);

function newId(prefix) {
  return prefix + crypto.randomBytes(6).toString('hex');
}

function rowToResv(r) {
  if (!r) return null;
  return {
    id: r.id, date: r.date, time: r.time, guests: r.guests,
    name: r.name, phone: r.phone, note: r.note, status: r.status,
    proposedTime: r.proposed_time, createdAt: r.created_at
  };
}

module.exports = {
  db,
  newId,

  getBetrieb(id) {
    return db.prepare('SELECT * FROM betriebe WHERE id = ?').get(id);
  },
  createBetrieb(id, name, wirtPhone) {
    const token = crypto.randomBytes(12).toString('hex');
    db.prepare('INSERT INTO betriebe (id, name, token, wirt_phone) VALUES (?, ?, ?, ?)')
      .run(id, name, token, wirtPhone || '');
    return token;
  },
  getConfig(betrieb) {
    return {
      name: betrieb.name,
      open: betrieb.open,
      close: betrieb.close,
      closedDays: JSON.parse(betrieb.closed_days),
      seats: betrieb.seats
    };
  },
  saveConfig(betriebId, cfg) {
    db.prepare('UPDATE betriebe SET open = ?, close = ?, closed_days = ?, seats = ? WHERE id = ?')
      .run(cfg.open, cfg.close, JSON.stringify(cfg.closedDays), cfg.seats, betriebId);
  },

  listReservierungen(betriebId) {
    return db.prepare('SELECT * FROM reservierungen WHERE betrieb_id = ? ORDER BY date, time')
      .all(betriebId).map(rowToResv);
  },
  getReservierung(betriebId, id) {
    return db.prepare('SELECT * FROM reservierungen WHERE betrieb_id = ? AND id = ?').get(betriebId, id);
  },
  getByGuestToken(token) {
    return db.prepare('SELECT * FROM reservierungen WHERE guest_token = ?').get(token);
  },
  createReservierung(betriebId, data) {
    const id = newId('r');
    const guestToken = crypto.randomBytes(10).toString('hex');
    db.prepare(`INSERT INTO reservierungen
      (id, betrieb_id, date, time, guests, name, phone, note, guest_token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, betriebId, data.date, data.time, data.guests, data.name, data.phone, data.note || '', guestToken);
    return db.prepare('SELECT * FROM reservierungen WHERE id = ?').get(id);
  },
  updateReservierung(id, patch) {
    const allowed = { status: 'status', proposed_time: 'proposed_time', time: 'time', reminded: 'reminded' };
    const sets = [];
    const vals = [];
    Object.keys(patch).forEach(function (k) {
      if (allowed[k]) { sets.push(allowed[k] + ' = ?'); vals.push(patch[k]); }
    });
    if (!sets.length) return;
    vals.push(id);
    db.prepare('UPDATE reservierungen SET ' + sets.join(', ') + ' WHERE id = ?').run(...vals);
  },

  logNachricht(betriebId, resvId, event, toPhone, text, mode) {
    db.prepare('INSERT INTO nachrichten (betrieb_id, resv_id, event, to_phone, text, mode) VALUES (?, ?, ?, ?, ?, ?)')
      .run(betriebId, resvId, event, toPhone, text, mode || 'sim');
  },
  listNachrichten(betriebId, limit) {
    return db.prepare('SELECT * FROM nachrichten WHERE betrieb_id = ? ORDER BY id DESC LIMIT ?')
      .all(betriebId, limit || 50);
  },

  /* Für Erinnerungs-Timer: bestätigte Reservierungen von morgen, noch nicht erinnert. */
  dueReminders(tomorrow) {
    return db.prepare(`SELECT * FROM reservierungen
      WHERE date = ? AND status = 'bestaetigt' AND reminded = 0`).all(tomorrow);
  },

  /* DSGVO: Reservierungen löschen, deren Datum länger als N Tage zurückliegt. */
  purgeOld(days) {
    const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const old = db.prepare('SELECT id FROM reservierungen WHERE date < ?').all(cutoff);
    const delMsg = db.prepare('DELETE FROM nachrichten WHERE resv_id = ?');
    const delResv = db.prepare('DELETE FROM reservierungen WHERE id = ?');
    old.forEach(function (r) { delMsg.run(r.id); delResv.run(r.id); });
    return old.length;
  },

  rowToResv
};
