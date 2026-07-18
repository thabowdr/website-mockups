/* Modul Übersicht – Startseite: Tageszahlen, offene Posten, heutiger Status. */
(function () {
  'use strict';

  Portal.register({
    id: 'uebersicht',
    title: 'Übersicht',
    group: '',
    subtitle: 'Alles Wichtige von heute auf einen Blick.',

    render(container, ctx) {
      const store = ctx.store;
      const ui = ctx.ui;
      const rid = ctx.restaurantId;
      const today = new Date().toISOString().slice(0, 10);

      const all = store.list(rid);
      const todays = all.filter(function (r) { return r.date === today && r.status !== 'storniert'; });
      const open = all.filter(function (r) { return r.status === 'neu' || r.status === 'vorschlag'; })
        .sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); });

      const closed = store.closedOn(rid, today);
      const cfg = store.getConfig(rid);
      const todayLine = closed
        ? '<div class="today-line closed">Heute ist <b>' + closed + '</b> – Ruhetag. Das Widget nimmt heute keine Reservierungen an.</div>'
        : '<div class="today-line">Heute geöffnet: <b>' + cfg.open + '–' + cfg.close + ' Uhr</b> · ' + cfg.seats + ' Plätze</div>';

      const attention = open.length
        ? open.map(function (r) {
            const note = r.status === 'vorschlag'
              ? 'Zeitvorschlag ' + r.proposedTime + ' Uhr wartet auf Zusage des Gastes'
              : 'Neue Anfrage – bestätigen, Zeit vorschlagen oder stornieren';
            return '<a class="card ' + r.status + '" href="#reservierungen">' +
              '<div><div class="who">' + r.name + ' · ' + r.guests + ' Pers.</div>' +
              '<div class="meta">' + ui.fmtDate(r.date) + ' um ' + r.time + ' Uhr · ' + note + '</div></div>' +
              '<span class="badge ' + r.status + '">' + r.status + '</span></a>';
          }).join('')
        : '<div class="empty">Nichts offen – alles erledigt.</div>';

      container.innerHTML =
        todayLine +
        ui.statCards([
          { value: todays.length, label: 'Reservierungen heute' },
          { value: todays.reduce(function (s, r) { return s + r.guests; }, 0), label: 'Gäste heute' },
          { value: open.length, label: 'Offene Posten' },
          { value: '–', label: 'Bestellungen heute (bald)' }
        ]) +
        '<p class="attn-lbl">Braucht deine Aufmerksamkeit</p>' +
        attention;
    }
  });
})();
