/*
 * store.js – gemeinsame Datenschicht für Widget und Portal.
 *
 * Zwei Modi, gleiche (asynchrone) Schnittstelle:
 *   - api:   aktiv, wenn window.RESV_API gesetzt ist (liefert der Server über env.js).
 *            Alle Zugriffe laufen gegen tools/server/.
 *   - local: localStorage – für statische Demos (Artifact, file://) ohne Server.
 *
 * Wirt-Endpunkte brauchen im api-Modus ein Token (setToken); bei 401 wirft
 * jeder Aufruf ein Error-Objekt mit .status = 401 – das Portal zeigt dann den Login.
 */
(function () {
  'use strict';

  const API = typeof window !== 'undefined' && window.RESV_API ? window.RESV_API : null;
  const DAY_NAMES = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const DEFAULT_CONFIG = { open: '11:00', close: '21:30', closedDays: [1], seats: 40 };

  /* ================= Hilfen ================= */

  function fmtDate(d) {
    return d.split('-').reverse().join('.');
  }
  function slotsFromConfig(cfg) {
    const toMin = function (t) {
      const p = t.split(':');
      return Number(p[0]) * 60 + Number(p[1]);
    };
    const out = [];
    for (let m = toMin(cfg.open); m <= toMin(cfg.close) - 30; m += 30) {
      out.push(String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'));
    }
    return out;
  }

  let token = null;
  function tokenKey(rid) { return 'resv:token:' + rid; }

  async function apiFetch(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (token) opts.headers.Authorization = 'Bearer ' + token;
    const res = await fetch(API + path, opts);
    if (!res.ok) {
      let msg = 'HTTP ' + res.status;
      try { msg = (await res.json()).error || msg; } catch (e) { /* keine JSON-Antwort */ }
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  /* ================= local-Backend (localStorage) ================= */

  function lKey(rid) { return 'resv:' + rid; }
  function lCfgKey(rid) { return 'resv:cfg:' + rid; }
  function lList(rid) {
    try { return JSON.parse(localStorage.getItem(lKey(rid))) || []; } catch (e) { return []; }
  }
  function lSave(rid, all) { localStorage.setItem(lKey(rid), JSON.stringify(all)); }
  function lGet(rid, id) { return lList(rid).find(function (x) { return x.id === id; }); }
  function lUpdate(rid, id, patch) {
    const all = lList(rid);
    const r = all.find(function (x) { return x.id === id; });
    if (r) { Object.assign(r, patch); lSave(rid, all); }
    return r;
  }
  function lConfig(rid) {
    try {
      return Object.assign({}, DEFAULT_CONFIG, JSON.parse(localStorage.getItem(lCfgKey(rid))) || {});
    } catch (e) {
      return Object.assign({}, DEFAULT_CONFIG);
    }
  }

  function lSmsText(name, r, event) {
    const when = fmtDate(r.date) + ' um ' + r.time + ' Uhr';
    switch (event) {
      case 'bestaetigt':
        return name + ': Ihre Reservierung am ' + when + ' für ' + r.guests +
          ' Person(en) ist bestätigt. Bis bald! Falls Sie nicht kommen können: [Storno-Link]';
      case 'storniert':
        return name + ': Ihre Reservierung am ' + when +
          ' können wir leider nicht anbieten. Bitte melden Sie sich gern für einen anderen Termin.';
      case 'vorschlag':
        return name + ': Um ' + r.time + ' Uhr ist leider kein Tisch frei. ' +
          'Alternativ hätten wir am ' + fmtDate(r.date) + ' um ' + r.proposedTime +
          ' Uhr Platz für Sie. Bitte bestätigen Sie über den Link: [Zusage-Link]';
      default:
        return '';
    }
  }
  function lPushMsg(rid, r, event, text) {
    lUpdate(rid, r.id, {
      messages: (r.messages || []).concat([{ ts: new Date().toISOString(), text: text, event: event }])
    });
  }

  /* ================= Öffentliche Schnittstelle ================= */

  window.ResvStore = {
    mode: API ? 'api' : 'local',
    dayNames: DAY_NAMES,
    fmtDate: fmtDate,

    /* --- Token (nur api-Modus) --- */
    setToken(rid, t) {
      token = t;
      try { localStorage.setItem(tokenKey(rid), t); } catch (e) {}
    },
    loadToken(rid) {
      try { token = localStorage.getItem(tokenKey(rid)); } catch (e) {}
      return token;
    },
    clearToken(rid) {
      token = null;
      try { localStorage.removeItem(tokenKey(rid)); } catch (e) {}
    },

    /* --- Konfiguration --- */
    async getConfig(rid) {
      if (API) return apiFetch('/api/' + rid + '/config');
      return lConfig(rid);
    },
    async saveConfig(rid, cfg) {
      if (API) return apiFetch('/api/' + rid + '/config', { method: 'PUT', body: JSON.stringify(cfg) });
      localStorage.setItem(lCfgKey(rid), JSON.stringify(cfg));
      return { ok: true };
    },
    async slots(rid) {
      return slotsFromConfig(await this.getConfig(rid));
    },
    async closedOn(rid, dateStr) {
      const cfg = await this.getConfig(rid);
      const day = new Date(dateStr + 'T12:00:00').getDay();
      return cfg.closedDays.indexOf(day) !== -1 ? DAY_NAMES[day] : null;
    },

    /* --- Reservierungen --- */
    async list(rid) {
      if (API) return apiFetch('/api/' + rid + '/reservierungen');
      return lList(rid);
    },
    async get(rid, id) {
      if (API) {
        const all = await this.list(rid);
        return all.find(function (x) { return x.id === id; });
      }
      return lGet(rid, id);
    },
    /* Anlegen (Widget). data darf ein Honeypot-Feld "website" enthalten. */
    async create(rid, data) {
      if (API) return apiFetch('/api/' + rid + '/reservierungen', { method: 'POST', body: JSON.stringify(data) });
      const all = lList(rid);
      const resv = Object.assign({
        id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        createdAt: new Date().toISOString(),
        status: 'neu',
        messages: []
      }, data);
      delete resv.website;
      all.push(resv);
      lSave(rid, all);
      return { ok: true, id: resv.id };
    },
    /* Statuswechsel durch den Wirt; gibt den (simulierten) SMS-Text zurück. */
    async setStatus(rid, id, status, name) {
      if (API) {
        const res = await apiFetch('/api/' + rid + '/reservierungen/' + id + '/status', {
          method: 'POST', body: JSON.stringify({ status: status })
        });
        return res.sms;
      }
      const r = lGet(rid, id);
      if (!r) return null;
      const text = lSmsText(name || rid, r, status);
      lUpdate(rid, id, { status: status, proposedTime: null });
      if (text) lPushMsg(rid, lGet(rid, id), status, text);
      return text;
    },
    async propose(rid, id, time, name) {
      if (API) {
        const res = await apiFetch('/api/' + rid + '/reservierungen/' + id + '/vorschlag', {
          method: 'POST', body: JSON.stringify({ time: time })
        });
        return res.sms;
      }
      const r = lGet(rid, id);
      if (!r) return null;
      const next = Object.assign({}, r, { proposedTime: time });
      const text = lSmsText(name || rid, next, 'vorschlag');
      lUpdate(rid, id, { status: 'vorschlag', proposedTime: time });
      lPushMsg(rid, lGet(rid, id), 'vorschlag', text);
      return text;
    },

    /* --- Gast-Antworten (nur local-Demo; im api-Modus laufen sie über /g/<token>) --- */
    async acceptProposal(rid, id) {
      const r = lGet(rid, id);
      if (!r || r.status !== 'vorschlag') return null;
      lUpdate(rid, id, { time: r.proposedTime, proposedTime: null, status: 'bestaetigt' });
      const u = lGet(rid, id);
      lPushMsg(rid, u, 'bestaetigt', lSmsText(rid, u, 'bestaetigt'));
      return u;
    },
    async declineProposal(rid, id) {
      const r = lGet(rid, id);
      if (!r || r.status !== 'vorschlag') return null;
      return lUpdate(rid, id, { proposedTime: null, status: 'storniert' });
    },
    async cancelByGuest(rid, id) {
      const r = lGet(rid, id);
      if (!r || (r.status !== 'bestaetigt' && r.status !== 'neu')) return null;
      return lUpdate(rid, id, { status: 'storniert' });
    },

    /* --- SMS-Ausgang (Gast-Handy-Demo / Portal) --- */
    async listNachrichten(rid) {
      if (API) return apiFetch('/api/' + rid + '/nachrichten');
      const out = [];
      lList(rid).forEach(function (r) {
        (r.messages || []).forEach(function (m) {
          out.push({ ts: m.ts, event: m.event, to_phone: r.phone, text: m.text, resv: r });
        });
      });
      out.sort(function (a, b) { return b.ts.localeCompare(a.ts); });
      return out;
    },

    /* --- Auslastung je Uhrzeit an einem Tag --- */
    async slotLoad(rid, dateStr) {
      const all = await this.list(rid);
      const load = {};
      all.forEach(function (r) {
        if (r.date !== dateStr) return;
        if (['neu', 'bestaetigt', 'vorschlag'].indexOf(r.status) === -1) return;
        load[r.time] = (load[r.time] || 0) + r.guests;
      });
      return load;
    },

    /* --- Demo-Daten (nur local) --- */
    seedDemo(rid) {
      if (API || lList(rid).length) return;
      const today = new Date();
      function d(offset) {
        const x = new Date(today);
        x.setDate(x.getDate() + offset);
        return x.toISOString().slice(0, 10);
      }
      const rows = [
        { date: d(0), time: '12:00', guests: 2, name: 'Familie Berger', phone: '0371 111111', note: '', status: 'bestaetigt' },
        { date: d(0), time: '18:30', guests: 4, name: 'Herr Uhlig', phone: '0172 2222222', note: 'Fensterplatz', status: 'bestaetigt' },
        { date: d(0), time: '19:00', guests: 6, name: 'Frau Neumann', phone: '0371 333333', note: 'Geburtstag', status: 'neu' },
        { date: d(1), time: '17:30', guests: 3, name: 'Herr Öztürk', phone: '0163 4444444', note: '', status: 'neu' },
        { date: d(2), time: '19:30', guests: 8, name: 'Stammtisch Kegelverein', phone: '0371 555555', note: 'Hinterzimmer', status: 'bestaetigt' }
      ];
      lSave(rid, rows.map(function (r, i) {
        return Object.assign({ id: 'a' + (i + 1), createdAt: new Date().toISOString(), messages: [] }, r);
      }));
    }
  };
})();
