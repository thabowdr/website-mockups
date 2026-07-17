/*
 * widget.js – einbettbares Reservierungs-Widget.
 *
 * Einbau in eine Kundenseite:
 *   <div id="resv-widget" data-restaurant="gasthaus-zur-linde"></div>
 *   <script src="store.js"></script>
 *   <script src="widget.js"></script>
 *
 * Farben über CSS-Variablen an das jeweilige Design anpassen:
 *   --resv-accent, --resv-bg, --resv-text, --resv-muted, --resv-line
 */
(function () {
  'use strict';

  const mount = document.getElementById('resv-widget');
  if (!mount || !window.ResvStore) return;
  const restaurantId = mount.dataset.restaurant || 'demo';

  const css = `
    .resv { --accent: var(--resv-accent, #c08a4e); --bg: var(--resv-bg, #1d1b19);
            --text: var(--resv-text, #f0ebe3); --muted: var(--resv-muted, #a49c90);
            --line: var(--resv-line, rgba(255,255,255,.12));
            background: var(--bg); color: var(--text); border: 1px solid var(--line);
            border-radius: 10px; padding: 1.5rem; max-width: 420px;
            font-family: inherit; }
    .resv h3 { margin: 0 0 1rem; font-size: 1.15rem; }
    .resv label { display: block; font-size: .8rem; color: var(--muted); margin: .75rem 0 .25rem; }
    .resv input, .resv select, .resv textarea {
      width: 100%; box-sizing: border-box; padding: .55rem .7rem;
      background: rgba(255,255,255,.05); color: var(--text);
      border: 1px solid var(--line); border-radius: 6px; font: inherit; }
    .resv input:focus, .resv select:focus, .resv textarea:focus { outline: 1px solid var(--accent); }
    .resv .row { display: flex; gap: .75rem; }
    .resv .row > div { flex: 1; }
    .resv button { margin-top: 1.25rem; width: 100%; padding: .7rem;
      background: var(--accent); color: #1b130a; font-weight: 600; font: inherit;
      border: 0; border-radius: 6px; cursor: pointer; }
    .resv button:hover { filter: brightness(1.1); }
    .resv .ok { text-align: center; padding: 1.5rem 0; }
    .resv .ok strong { color: var(--accent); }
  `;

  function timeOptions() {
    const out = [];
    for (let h = 11; h <= 21; h++) {
      ['00', '30'].forEach(function (m) {
        out.push(h + ':' + m);
      });
    }
    return out.map(function (t) { return '<option>' + t + '</option>'; }).join('');
  }

  const today = new Date().toISOString().slice(0, 10);

  mount.innerHTML = `
    <style>${css}</style>
    <div class="resv">
      <h3>Tisch reservieren</h3>
      <form>
        <div class="row">
          <div><label>Datum</label><input type="date" name="date" min="${today}" value="${today}" required></div>
          <div><label>Uhrzeit</label><select name="time">${timeOptions()}</select></div>
        </div>
        <div class="row">
          <div><label>Personen</label><input type="number" name="guests" min="1" max="20" value="2" required></div>
          <div><label>Telefon</label><input type="tel" name="phone" placeholder="0371 …" required></div>
        </div>
        <label>Name</label><input type="text" name="name" required>
        <label>Anmerkung (optional)</label><textarea name="note" rows="2"></textarea>
        <button type="submit">Reservierung anfragen</button>
      </form>
    </div>`;

  mount.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault();
    const f = e.target;
    ResvStore.create(restaurantId, {
      date: f.date.value,
      time: f.time.value,
      guests: Number(f.guests.value),
      name: f.name.value.trim(),
      phone: f.phone.value.trim(),
      note: f.note.value.trim()
    });
    mount.querySelector('.resv').innerHTML = `
      <div class="ok">
        <strong>Vielen Dank, ${f.name.value.trim()}!</strong><br><br>
        Ihre Anfrage für ${f.guests.value} Person(en) am ${f.date.value.split('-').reverse().join('.')}
        um ${f.time.value} Uhr ist eingegangen.<br><br>
        Sie erhalten in Kürze eine Bestätigung.
      </div>`;
  });
})();
