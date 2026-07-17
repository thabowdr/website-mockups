/*
 * store.js – gemeinsame Datenschicht für Widget und Dashboard.
 *
 * Aktuell: localStorage (Demo/Prototyp, läuft ohne Server).
 * Später: Die vier Funktionen in ResvStore.backend durch fetch()-Aufrufe
 * gegen eine echte API ersetzen – Widget und Dashboard bleiben unverändert.
 */
(function () {
  'use strict';

  function key(restaurantId) {
    return 'resv:' + restaurantId;
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
    create(restaurantId, data) {
      const all = backend.list(restaurantId);
      const resv = Object.assign({
        id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        createdAt: new Date().toISOString(),
        status: 'neu' // neu | bestaetigt | storniert | noshow
      }, data);
      all.push(resv);
      backend.saveAll(restaurantId, all);
      return resv;
    },
    setStatus(restaurantId, id, status) {
      const all = backend.list(restaurantId);
      const r = all.find(function (x) { return x.id === id; });
      if (r) {
        r.status = status;
        backend.saveAll(restaurantId, all);
      }
      return r;
    }
  };

  window.ResvStore = {
    backend: backend,
    list: backend.list,
    create: backend.create,
    setStatus: backend.setStatus,

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
