/* Modul Reservierungen – Eingangs-Workflow (umgezogen aus reservierung/dashboard.html). */
(function () {
  'use strict';

  let tab = 'heute';
  let proposing = null; // Reservierungs-ID, für die gerade eine Zeit gewählt wird

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  Portal.register({
    id: 'reservierungen',
    title: 'Reservierungen',
    group: 'eingang',
    subtitle: 'Tischanfragen bestätigen, Zeiten vorschlagen, Auslastung im Blick.',

    badge(ctx) {
      return ctx.store.list(ctx.restaurantId).filter(function (r) {
        return r.status === 'neu';
      }).length;
    },

    render(container, ctx) {
      const store = ctx.store;
      const ui = ctx.ui;
      const rid = ctx.restaurantId;

      function inDays(dateStr, n) {
        const diff = (new Date(dateStr) - new Date(today())) / 86400000;
        return diff >= 0 && diff < n;
      }
      function timeOptions(except) {
        return store.slots(rid)
          .filter(function (t) { return t !== except; })
          .map(function (t) { return '<option>' + t + '</option>'; })
          .join('');
      }
      function loadChips(dateStr) {
        const cfg = store.getConfig(rid);
        const load = store.slotLoad(rid, dateStr);
        const times = Object.keys(load).sort();
        if (!times.length) return '';
        return '<p class="load-lbl">Auslastung heute (von ' + cfg.seats + ' Plätzen)</p><div class="load">' +
          times.map(function (t) {
            const n = load[t];
            const cls = n >= cfg.seats ? 'full' : (n >= cfg.seats * 0.8 ? 'warn' : '');
            return '<span class="chip ' + cls + '">' + t + ' · <b>' + n + '</b>/' + cfg.seats + '</span>';
          }).join('') + '</div>';
      }

      const statsEl = document.createElement('div');
      const listEl = document.createElement('div');
      container.appendChild(statsEl);
      container.appendChild(ui.tabs([
        { id: 'heute', label: 'Heute' },
        { id: 'kommend', label: 'Kommend' },
        { id: 'alle', label: 'Alle' }
      ], tab, function (t) { tab = t; renderList(); }));
      container.appendChild(listEl);

      function renderList() {
        const all = store.list(rid)
          .slice()
          .sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); });

        const todays = all.filter(function (r) { return r.date === today() && r.status !== 'storniert'; });
        statsEl.innerHTML = ui.statCards([
          { value: todays.length, label: 'Reservierungen heute' },
          { value: todays.reduce(function (s, r) { return s + r.guests; }, 0), label: 'Gäste heute' },
          { value: all.filter(function (r) { return r.status === 'neu'; }).length, label: 'Offene Anfragen' },
          { value: all.filter(function (r) { return inDays(r.date, 7) && r.status !== 'storniert'; }).length, label: 'Nächste 7 Tage' }
        ]);

        let rows = all;
        if (tab === 'heute') rows = all.filter(function (r) { return r.date === today(); });
        if (tab === 'kommend') rows = all.filter(function (r) { return r.date > today(); });

        const chips = tab === 'heute' ? loadChips(today()) : '';
        if (!rows.length) {
          listEl.innerHTML = chips + '<div class="empty">Keine Reservierungen in dieser Ansicht.</div>';
          return;
        }
        listEl.innerHTML = chips + rows.map(function (r) {
          const canAct = r.status === 'neu' || r.status === 'bestaetigt';
          let actions = '';
          if (proposing === r.id) {
            actions = '<select id="prop-time">' + timeOptions(r.time) + '</select>' +
              '<button data-act="propose-send" data-id="' + r.id + '">Vorschlag senden</button>' +
              '<button data-act="propose-cancel">Abbrechen</button>';
          } else {
            actions = [
              r.status === 'neu' ? '<button data-act="bestaetigt" data-id="' + r.id + '">Bestätigen</button>' : '',
              r.status === 'neu' ? '<button data-act="propose" data-id="' + r.id + '">Zeit vorschlagen</button>' : '',
              canAct ? '<button data-act="storniert" data-id="' + r.id + '">Stornieren</button>' : '',
              r.status === 'bestaetigt' && r.date <= today() ? '<button data-act="noshow" data-id="' + r.id + '">No-Show</button>' : ''
            ].join('');
          }
          const proposedNote = r.status === 'vorschlag' && r.proposedTime
            ? ' · Vorschlag: ' + r.proposedTime + ' Uhr (wartet auf Zusage)' : '';
          return '<div class="card ' + r.status + '">' +
            '<div><div class="who">' + r.name + ' · ' + r.guests + ' Pers.</div>' +
            '<div class="meta">' + ui.fmtDate(r.date) + ' um ' + r.time + ' Uhr · ' + r.phone +
            (r.note ? ' · „' + r.note + '“' : '') + proposedNote + '</div></div>' +
            '<span class="badge ' + r.status + '">' + r.status + '</span>' +
            '<div class="actions">' + actions + '</div></div>';
        }).join('');
      }

      listEl.addEventListener('click', function (e) {
        const btn = e.target.closest('button[data-act]');
        if (!btn) return;
        const act = btn.dataset.act;
        const id = btn.dataset.id;
        if (act === 'propose') {
          proposing = id;
        } else if (act === 'propose-cancel') {
          proposing = null;
        } else if (act === 'propose-send') {
          const time = listEl.querySelector('#prop-time').value;
          const text = ctx.store.propose(rid, id, time, ctx.restaurantName);
          proposing = null;
          const r = ctx.store.get(rid, id);
          if (text && r) ui.toast(r.phone, text);
        } else {
          const text = ctx.store.setStatus(rid, id, act, ctx.restaurantName);
          const r = ctx.store.get(rid, id);
          if (text && r && (act === 'bestaetigt' || act === 'storniert')) ui.toast(r.phone, text);
        }
        renderList();
      });

      renderList();
    }
  });
})();
