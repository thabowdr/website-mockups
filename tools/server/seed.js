/* seed.js – Betrieb anlegen: node seed.js <id> "<Name>" [wirt-telefon] */
'use strict';

const dbm = require('./db');

const [id, name, phone] = process.argv.slice(2);
if (!id || !name) {
  console.log('Aufruf: node seed.js <betriebs-id> "<Anzeigename>" [wirt-telefon]');
  process.exit(1);
}
if (dbm.getBetrieb(id)) {
  console.log('Betrieb "' + id + '" existiert bereits. Token bleibt unverändert:', dbm.getBetrieb(id).token);
  process.exit(0);
}
const token = dbm.createBetrieb(id, name, phone);
console.log('Betrieb angelegt:', id, '(' + name + ')');
console.log('Zugangs-Token für das Portal:', token);
