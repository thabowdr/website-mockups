/*
 * store.js – gemeinsame Datenschicht für Widget und Dashboard.
 *
 * Aktuell: localStorage (Demo/Prototyp, läuft ohne Server).
 * Später: Die Funktionen in ResvStore.backend durch fetch()-Aufrufe gegen
 * eine echte API ersetzen – Widget und Dashboard bleiben unverändert.
 * Der SMS-Versand (smsText/notify) läuft dann serverseitig über einen
 * Anbieter wie seven.io oder Twilio; hier wird er nur simuliert und als
 * Nachrichtenverlauf an der Reservierung gespeichert.
 */
(function () {
  'use strict';

  function key(restaurantId) {
    return 'resv:' + restaurantId;
  }

  function fmtDate(d) {
    return d.split('-').reverse().join('.');
  }

  const backend = {
    list(restaurantId) {
      try {
        return JSON.parse(localStorage.getItem(key(restaurantId))) || [];
      } catch (e) {
        return [];
      }
    },
    saveAll(restaurantId, reservations) {
      localStorage.setItem(key(restaurantId), JSON.stringify(reservations));
    },
    get(restaurantId, id) {
      return backend.list(restaurantId).find(function (x) { return x.id === id; });
    },
    create(restaurantId, data) {
      const all = backend.list(restaurantId);
      const resv = Object.assign({
        id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        createdAt: new Date().toISOString(),
        status: 'neu', // neu | bestaetigt | vorschlag | storniert | noshow
        messages: []
      }, data);
      all.push(resv);
      backend.saveAll(restaurantId, all);
      return resv;
    },
    update(restaurantId, id, patch) {
      const all = backend.list(restaurantId);
      const r = all.find(function (x) { return x.id === id; });
      if (r) {
        Object.assign(r, patch);
        backend.saveAll(restaurantId, all);
      }
      return r;
    }
  };

  /* Nachrichtentexte, die im Live-Betrieb als SMS an r.phone gehen würden. */
  function smsText(restaurantName, r, event) {
    const when = fmtDate(r.date) + ' um ' + r.time + ' Uhr';
    switch (event) {
      case 'bestaetigt':
        return restaurantName + ': Ihre Reservierung am ' + when + ' für ' +
          r.guests + ' Person(en) ist bestätigt. Bis bald!';
      case 'storniert':
        return restaurantName + ': Ihre Reservierung am ' + when +
          ' können wir leider nicht anbieten. Bitte melden Sie sich gern für einen anderen Termin.';
      case 'vorschlag':
        return restaurantName + ': Um ' + r.time + ' Uhr ist leider kein Tisch frei. ' +
          'Alternativ hätten wir am ' + fmtDate(r.date) + ' um ' + r.proposedTime +
          ' Uhr Platz für Sie. Bitte bestätigen Sie über den Link: [Zusage-Link]';
      default:
        return '';
    }
  }

  window.ResvStore = {
    backend: backend,
    list: backend.list,
    get: backend.get,
    create: backend.create,
    smsText: smsText,

    /* Statuswechsel inkl. simulierter SMS; gibt den Nachrichtentext zurück. */
    setStatus(restaurantId, id, status, restaurantName) {
      const r = backend.get(restaurantId, id);
      if (!r) return null;
      const patch = { status: status };
      const text = smsText(restaurantName || restaurantId, Object.assign({}, r, patch), status);
      if (text) {
        patch.messages = (r.messages || []).concat([{ ts: new Date().toISOString(), text: text }]);
      }
      backend.update(restaurantId, id, patch);
      return text;
    },

    /* Wirt schlägt eine andere Uhrzeit vor – Gast muss zusagen. */
    propose(restaurantId, id, newTime, restaurantName) {
      const r = backend.get(restaurantId, id);
      if (!r) return null;
      const next = Object.assign({}, r, { proposedTime: newTime });
      const text = smsText(restaurantName || restaurantId, next, 'vorschlag');
      backend.update(restaurantId, id, {
        status: 'vorschlag',
        proposedTime: newTime,
        messages: (r.messages || []).concat([{ ts: new Date().toISOString(), text: text }])
      });
      return text;
    },

    /* Antwort des Gastes auf einen Vorschlag (im Live-Betrieb via Link). */
    acceptProposal(restaurantId, id) {
      const r = backend.get(restaurantId, id);
      if (!r || r.status !== 'vorschlag') return null;
      return backend.update(restaurantId, id, {
        time: r.proposedTime, proposedTime: null, status: 'bestaetigt'
      });
    },
    declineProposal(restaurantId, id) {
      const r = backend.get(restaurantId, id);
      if (!r || r.status !== 'vorschlag') return null;
      return backend.update(restaurantId, id, { proposedTime: null, status: 'storniert' });
    },

    /* Demo-Daten einspielen, falls noch keine Reservierungen existieren. */
    seedDemo(restaurantId) {
      if (backend.list(restaurantId).length) return;
      const today = new Date();
      function d(offset) {
        const x = new Date(today);
        x.setDate(x.getDate() + offset);
        return x.toISOString().slice(0, 10);
      }
      [
        { date: d(0), time: '12:00', guests: 2, name: 'Familie Berger', phone: '0371 111111', note: '', status: 'bestaetigt' },
        { date: d(0), time: '18:30', guests: 4, name: 'Herr Uhlig', phone: '0172 2222222', note: 'Fensterplatz', status: 'bestaetigt' },
        { date: d(0), time: '19:00', guests: 6, name: 'Frau Neumann', phone: '0371 333333', note: 'Geburtstag', status: 'neu' },
        { date: d(1), time: '17:30', guests: 3, name: 'Herr Öztürk', phone: '0163 4444444', note: '', status: 'neu' },
        { date: d(2), time: '19:30', guests: 8, name: 'Stammtisch Kegelverein', phone: '0371 555555', note: 'Hinterzimmer', status: 'bestaetigt' }
      ].forEach(function (r) {
        backend.create(restaurantId, r);
      });
    }
  };
})();
