/* sms.js – Versand-Adapter. Modus über SMS_MODE:
 *   "sim"   (Standard): nur in der DB protokollieren – nichts geht raus.
 *   "seven": echter Versand über seven.io (SEVEN_API_KEY nötig).
 */
'use strict';

const dbm = require('./db');

const MODE = process.env.SMS_MODE === 'seven' ? 'seven' : 'sim';

async function sendSeven(to, text) {
  const res = await fetch('https://gateway.seven.io/api/sms', {
    method: 'POST',
    headers: {
      'X-Api-Key': process.env.SEVEN_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ to: to, text: text, from: process.env.SMS_FROM || 'Reservierung' })
  });
  if (!res.ok) throw new Error('seven.io: HTTP ' + res.status);
}

module.exports = {
  mode: MODE,

  /* Nachricht protokollieren und – je nach Modus – wirklich verschicken. */
  async send(betriebId, resvId, event, toPhone, text) {
    dbm.logNachricht(betriebId, resvId, event, toPhone, text, MODE);
    if (MODE === 'seven') {
      try {
        await sendSeven(toPhone, text);
      } catch (e) {
        console.error('SMS-Versand fehlgeschlagen:', e.message);
      }
    }
  },

  /* SMS-Texte – gleiche Wortwahl wie im Frontend-Prototyp (core/store.js). */
  texte: {
    fmtDate(d) { return d.split('-').reverse().join('.'); },
    bestaetigt(name, r, stornoUrl) {
      return name + ': Ihre Reservierung am ' + this.fmtDate(r.date) + ' um ' + r.time +
        ' Uhr für ' + r.guests + ' Person(en) ist bestätigt. Bis bald! ' +
        'Falls Sie nicht kommen können: ' + stornoUrl;
    },
    storniert(name, r) {
      return name + ': Ihre Reservierung am ' + this.fmtDate(r.date) + ' um ' + r.time +
        ' Uhr können wir leider nicht anbieten. Bitte melden Sie sich gern für einen anderen Termin.';
    },
    vorschlag(name, r, zusageUrl) {
      return name + ': Um ' + r.time + ' Uhr ist leider kein Tisch frei. Alternativ hätten wir am ' +
        this.fmtDate(r.date) + ' um ' + r.proposed_time + ' Uhr Platz für Sie. ' +
        'Bitte bestätigen Sie über den Link: ' + zusageUrl;
    },
    erinnerung(name, r) {
      return name + ': Erinnerung an Ihre Reservierung morgen, ' + this.fmtDate(r.date) +
        ' um ' + r.time + ' Uhr für ' + r.guests + ' Person(en). Bis morgen!';
    },
    wirtNeu(r) {
      return 'Neue Reservierungsanfrage: ' + r.name + ', ' + r.guests + ' Pers., ' +
        this.fmtDate(r.date) + ' um ' + r.time + ' Uhr' +
        (r.note ? ' („' + r.note + '“)' : '') + '. Bitte im Portal bestätigen.';
    },
    wirtGastStorno(r) {
      return 'Gast hat storniert: ' + r.name + ', ' + r.guests + ' Pers., ' +
        this.fmtDate(r.date) + ' um ' + r.time + ' Uhr.';
    }
  }
};
