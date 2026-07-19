/* Modul Öffnungszeiten – Ruhetage, Zeiten, Kapazität; später Urlaub + Google-Sync. */
(function () {
  'use strict';

  Portal.register({
    id: 'zeiten',
    title: 'Öffnungszeiten',
    group: 'inhalte',
    subtitle: 'Gilt sofort für das Reservierungs-Widget auf der Website.',

    async render(container, ctx) {
      const store = ctx.store;
      const rid = ctx.restaurantId;
      const cfg = await store.getConfig(rid);
      const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // Mo … So

      container.innerHTML = `
        <div class="settings">
          <h2>Öffnungszeiten &amp; Ruhetage</h2>
          <label>Ruhetage (angehakt = geschlossen)</label>
          <div class="days">
            ${dayOrder.map(function (d) {
              const closed = cfg.closedDays.indexOf(d) !== -1;
              return '<label class="' + (closed ? 'closed' : '') + '">' +
                '<input type="checkbox" data-day="' + d + '"' + (closed ? ' checked' : '') + '>' +
                store.dayNames[d].slice(0, 2) + '</label>';
            }).join('')}
          </div>
          <div class="row2">
            <div><label>Geöffnet ab</label><input type="time" id="cfg-open" value="${cfg.open}"></div>
            <div><label>Letzte Reservierung</label><input type="time" id="cfg-close" value="${cfg.close}"></div>
            <div><label>Plätze gesamt</label><input type="number" id="cfg-seats" min="1" value="${cfg.seats}"></div>
          </div>
          <button type="button" class="save" id="cfg-save">Speichern</button>
          <span class="saved" id="cfg-saved"></span>
        </div>
        <div class="placeholder">
          <span class="soon">In Vorbereitung</span>
          <p><strong>Urlaub eintragen:</strong> Zeitraum wählen, Widget und Website zeigen
          automatisch „Wir machen Urlaub bis …“.<br><br>
          <strong>Google-Sync:</strong> Öffnungszeiten, Ruhetage und Urlaub werden automatisch
          ins Google-Unternehmensprofil übertragen – die häufigste Fehlerquelle
          („bei Google steht offen, war aber zu“) verschwindet.</p>
        </div>`;

      container.querySelector('#cfg-save').addEventListener('click', async function () {
        const closedDays = Array.prototype.slice
          .call(container.querySelectorAll('.days input:checked'))
          .map(function (i) { return Number(i.dataset.day); });
        try {
          await store.saveConfig(rid, {
            open: container.querySelector('#cfg-open').value,
            close: container.querySelector('#cfg-close').value,
            seats: Number(container.querySelector('#cfg-seats').value),
            closedDays: closedDays
          });
          container.querySelector('#cfg-saved').textContent = 'Gespeichert – gilt sofort auch fürs Widget.';
        } catch (e) {
          container.querySelector('#cfg-saved').textContent = 'Fehler: ' + e.message;
        }
        container.querySelectorAll('.days label').forEach(function (l) {
          l.classList.toggle('closed', l.querySelector('input').checked);
        });
      });
    }
  });
})();
