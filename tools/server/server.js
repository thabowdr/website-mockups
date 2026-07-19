/* server.js – API, Gast-Links und statische Auslieferung des Portals.
 *
 * Start:  node server.js          (Port über PORT, Standard 8787)
 * Modi:   SMS_MODE=sim|seven      (Standard sim: nur protokollieren)
 *         BASE_URL=https://…      Basis für Gast-Links in SMS (Standard: http://127.0.0.1:PORT)
 */
'use strict';

const express = require('express');
const path = require('path');
const dbm = require('./db');
const sms = require('./sms');

const PORT = Number(process.env.PORT) || 8787;
const BASE_URL = process.env.BASE_URL || ('http://127.0.0.1:' + PORT);
const REPO_ROOT = path.join(__dirname, '..', '..');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* ---- env.js: sagt dem Frontend, dass es gegen die API laufen soll. ---- */
app.get(/\/env\.js$/, function (req, res) {
  res.type('application/javascript').send('window.RESV_API = ' + JSON.stringify(BASE_URL) + ';\n');
});

/* ---- Hilfen ---- */
function betriebOr404(req, res) {
  const b = dbm.getBetrieb(req.params.betrieb);
  if (!b) res.status(404).json({ error: 'Betrieb unbekannt' });
  return b;
}
function requireWirt(req, res) {
  const b = betriebOr404(req, res);
  if (!b) return null;
  const auth = req.headers.authorization || '';
  if (auth !== 'Bearer ' + b.token) {
    res.status(401).json({ error: 'Kein oder falsches Zugangs-Token' });
    return null;
  }
  return b;
}
function publicResv(r) {
  return dbm.rowToResv(r);
}

/* ---- Spam-Schutz: Rate-Limit pro IP (3 Anfragen / 10 min) ---- */
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(function (t) { return now - t < 10 * 60 * 1000; });
  if (list.length >= 3) { hits.set(ip, list); return true; }
  list.push(now);
  hits.set(ip, list);
  return false;
}

/* ================= Öffentliche API (Widget) ================= */

app.get('/api/:betrieb/config', function (req, res) {
  const b = betriebOr404(req, res);
  if (!b) return;
  res.json(dbm.getConfig(b));
});

app.post('/api/:betrieb/reservierungen', async function (req, res) {
  const b = betriebOr404(req, res);
  if (!b) return;
  const d = req.body || {};

  /* Honeypot: gefüllt → Bot. Nach außen "ok", nichts speichern. */
  if (d.website) return res.json({ ok: true });
  if (rateLimited(req.ip)) {
    return res.status(429).json({ error: 'Zu viele Anfragen – bitte später erneut versuchen oder anrufen.' });
  }
  if (!d.date || !d.time || !d.name || !d.phone || !(d.guests >= 1 && d.guests <= 20)) {
    return res.status(400).json({ error: 'Unvollständige Angaben' });
  }
  const day = new Date(d.date + 'T12:00:00').getDay();
  if (dbm.getConfig(b).closedDays.indexOf(day) !== -1) {
    return res.status(400).json({ error: 'An diesem Tag ist Ruhetag' });
  }
  const r = dbm.createReservierung(b.id, {
    date: d.date, time: d.time, guests: Number(d.guests),
    name: String(d.name).slice(0, 120), phone: String(d.phone).slice(0, 40),
    note: String(d.note || '').slice(0, 300)
  });
  /* Wirt sofort informieren (Simulationsmodus: nur Protokoll). */
  if (b.wirt_phone) await sms.send(b.id, r.id, 'wirt-neu', b.wirt_phone, sms.texte.wirtNeu(r));
  res.status(201).json({ ok: true, id: r.id });
});

/* ================= Wirt-API (Bearer-Token) ================= */

app.get('/api/:betrieb/reservierungen', function (req, res) {
  const b = requireWirt(req, res);
  if (!b) return;
  res.json(dbm.listReservierungen(b.id));
});

app.post('/api/:betrieb/reservierungen/:id/status', async function (req, res) {
  const b = requireWirt(req, res);
  if (!b) return;
  const r = dbm.getReservierung(b.id, req.params.id);
  if (!r) return res.status(404).json({ error: 'Reservierung unbekannt' });
  const status = req.body.status;
  if (['bestaetigt', 'storniert', 'noshow'].indexOf(status) === -1) {
    return res.status(400).json({ error: 'Ungültiger Status' });
  }
  dbm.updateReservierung(r.id, { status: status, proposed_time: null });
  let text = null;
  if (status === 'bestaetigt') text = sms.texte.bestaetigt(b.name, r, BASE_URL + '/g/' + r.guest_token);
  if (status === 'storniert') text = sms.texte.storniert(b.name, r);
  if (text) await sms.send(b.id, r.id, status, r.phone, text);
  res.json({ ok: true, sms: text });
});

app.post('/api/:betrieb/reservierungen/:id/vorschlag', async function (req, res) {
  const b = requireWirt(req, res);
  if (!b) return;
  const r = dbm.getReservierung(b.id, req.params.id);
  if (!r) return res.status(404).json({ error: 'Reservierung unbekannt' });
  const time = req.body.time;
  if (!/^\d{2}:\d{2}$/.test(time || '')) return res.status(400).json({ error: 'Ungültige Uhrzeit' });
  dbm.updateReservierung(r.id, { status: 'vorschlag', proposed_time: time });
  const updated = dbm.getReservierung(b.id, r.id);
  const text = sms.texte.vorschlag(b.name, updated, BASE_URL + '/g/' + r.guest_token);
  await sms.send(b.id, r.id, 'vorschlag', r.phone, text);
  res.json({ ok: true, sms: text });
});

app.put('/api/:betrieb/config', function (req, res) {
  const b = requireWirt(req, res);
  if (!b) return;
  const c = req.body || {};
  if (!/^\d{2}:\d{2}$/.test(c.open || '') || !/^\d{2}:\d{2}$/.test(c.close || '') ||
      !Array.isArray(c.closedDays) || !(c.seats >= 1)) {
    return res.status(400).json({ error: 'Ungültige Einstellungen' });
  }
  dbm.saveConfig(b.id, { open: c.open, close: c.close, closedDays: c.closedDays.map(Number), seats: Number(c.seats) });
  res.json({ ok: true });
});

app.get('/api/:betrieb/nachrichten', function (req, res) {
  const b = requireWirt(req, res);
  if (!b) return;
  res.json(dbm.listNachrichten(b.id));
});

/* ================= Gast-Links (aus der SMS) ================= */

function guestPage(b, r, flash) {
  const fmt = sms.texte.fmtDate(r.date);
  let actions = '';
  if (r.status === 'vorschlag') {
    actions = `
      <p>Vorgeschlagene neue Uhrzeit: <b>${r.proposed_time} Uhr</b></p>
      <form method="post" action="/g/${r.guest_token}/antwort"><input type="hidden" name="aktion" value="zusagen">
        <button class="primary">Neue Zeit zusagen</button></form>
      <form method="post" action="/g/${r.guest_token}/antwort"><input type="hidden" name="aktion" value="ablehnen">
        <button>Ablehnen (Reservierung stornieren)</button></form>`;
  } else if (r.status === 'bestaetigt' || r.status === 'neu') {
    actions = `
      <form method="post" action="/g/${r.guest_token}/antwort"><input type="hidden" name="aktion" value="stornieren">
        <button>Reservierung stornieren</button></form>`;
  }
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>Ihre Reservierung – ${b.name}</title>
<style>
  body { margin: 0; background: #14161a; color: #eef0f2; font-family: system-ui, sans-serif;
         min-height: 100vh; display: grid; place-items: center; padding: 1.5rem; box-sizing: border-box; }
  .box { background: #1c1f24; border: 1px solid rgba(255,255,255,.09); border-radius: 12px;
         padding: 2rem; max-width: 380px; width: 100%; }
  h1 { font-size: 1.05rem; margin: 0 0 1rem; }
  p { line-height: 1.6; font-size: .95rem; }
  .muted { color: #99a0a8; font-size: .85rem; }
  .flash { color: #6fbf8a; }
  .status { display: inline-block; font-size: .7rem; text-transform: uppercase; letter-spacing: .06em;
            border-radius: 999px; padding: .25rem .7rem; background: rgba(255,255,255,.08); }
  form { margin-top: .75rem; }
  button { width: 100%; padding: .7rem; border-radius: 8px; font: inherit; cursor: pointer;
           background: transparent; border: 1px solid rgba(255,255,255,.25); color: #eef0f2; }
  button.primary { background: #c08a4e; border: 0; color: #1b130a; font-weight: 600; }
</style></head><body>
<div class="box">
  <h1>${b.name}</h1>
  ${flash ? '<p class="flash">' + flash + '</p>' : ''}
  <p>Reservierung für <b>${r.name}</b><br>
     ${fmt} um <b>${r.time} Uhr</b> · ${r.guests} Person(en)</p>
  <p><span class="status">${r.status}</span></p>
  ${actions}
  <p class="muted">Fragen? Rufen Sie uns gern an.</p>
</div></body></html>`;
}

app.get('/g/:token', function (req, res) {
  const r = dbm.getByGuestToken(req.params.token);
  if (!r) return res.status(404).send('Link ungültig oder abgelaufen.');
  const b = dbm.getBetrieb(r.betrieb_id);
  res.send(guestPage(b, r, req.query.ok ? 'Vielen Dank, wir haben Ihre Antwort erhalten.' : ''));
});

app.post('/g/:token/antwort', async function (req, res) {
  const r = dbm.getByGuestToken(req.params.token);
  if (!r) return res.status(404).send('Link ungültig oder abgelaufen.');
  const b = dbm.getBetrieb(r.betrieb_id);
  const aktion = req.body.aktion;
  if (aktion === 'zusagen' && r.status === 'vorschlag') {
    dbm.updateReservierung(r.id, { time: r.proposed_time, proposed_time: null, status: 'bestaetigt' });
    const updated = dbm.getReservierung(b.id, r.id);
    await sms.send(b.id, r.id, 'bestaetigt', r.phone,
      sms.texte.bestaetigt(b.name, updated, BASE_URL + '/g/' + r.guest_token));
  } else if (aktion === 'ablehnen' && r.status === 'vorschlag') {
    dbm.updateReservierung(r.id, { proposed_time: null, status: 'storniert' });
    if (b.wirt_phone) await sms.send(b.id, r.id, 'wirt-storno', b.wirt_phone, sms.texte.wirtGastStorno(r));
  } else if (aktion === 'stornieren' && (r.status === 'bestaetigt' || r.status === 'neu')) {
    dbm.updateReservierung(r.id, { status: 'storniert' });
    if (b.wirt_phone) await sms.send(b.id, r.id, 'wirt-storno', b.wirt_phone, sms.texte.wirtGastStorno(r));
  }
  res.redirect('/g/' + req.params.token + '?ok=1');
});

/* ================= Statische Auslieferung (Portal, Widget, Mockups) ================= */

app.use(express.static(REPO_ROOT, { index: 'index.html' }));

/* ================= Timer: Erinnerung + DSGVO-Aufräumen ================= */

async function runTimers() {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  for (const r of dbm.dueReminders(tomorrow)) {
    const b = dbm.getBetrieb(r.betrieb_id);
    await sms.send(b.id, r.id, 'erinnerung', r.phone, sms.texte.erinnerung(b.name, r));
    dbm.updateReservierung(r.id, { reminded: 1 });
  }
  const purged = dbm.purgeOld(30);
  if (purged) console.log('DSGVO-Aufräumen:', purged, 'alte Reservierung(en) gelöscht');
}
if (!process.env.DISABLE_TIMERS) {
  setInterval(function () { runTimers().catch(console.error); }, 60 * 60 * 1000);
  runTimers().catch(console.error);
}

app.listen(PORT, function () {
  console.log('Portal-Server läuft: ' + BASE_URL + '  (SMS-Modus: ' + sms.mode + ')');
  console.log('Portal:      ' + BASE_URL + '/tools/portal/index.html?r=<betrieb>');
  console.log('Widget-Demo: ' + BASE_URL + '/tools/reservierung/index.html');
});

module.exports = { app, runTimers };
