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
 *
 * Öffnungszeiten/Ruhetage kommen aus ResvStore.getConfig() und werden im
 * Dashboard unter „Einstellungen“ gepflegt.
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
    .resv .row > div { flex: 1; min-width: 0; }
    .resv button { margin-top: 1.25rem; width: 100%; padding: .7rem;
      background: var(--accent); color: #1b130a; font-weight: 600; font: inherit;
      border: 0; border-radius: 6px; cursor: pointer; }
    .resv button:hover { filter: brightness(1.1); }
    .resv .ok { text-align: center; padding: 1.5rem 0; }
    .resv .ok strong { color: var(--accent); }
    .resv .err { color: #d97a6f; font-size: .85rem; margin-top: .5rem; display: none; }
    .resv .err.show { display: block; }
    .resv .privacy { display: flex; gap: .5rem; align-items: flex-start; margin-top: 1rem; }
    .resv .privacy input { width: auto; margin-top: .2rem; }
    .resv .privacy span { font-size: .75rem; color: var(--muted); line-height: 1.5; }
    .resv .hp { position: absolute; left: -9999px; height: 0; overflow: hidden; }
  `;

  function timeOptions() {
    return ResvStore.slots(restaurantId)
      .map(function (t) { return '<option>' + t + '</option>'; })
      .join('');
  }

  const today = new Date().toISOString().slice(0, 10);
  const renderedAt = Date.now();

  /* Einfacher Spam-Schutz im Browser; die harte Grenze kommt später serverseitig. */
  function tooMany() {
    try {
      const k = 'resv:rate:' + restaurantId;
      const now = Date.now();
      const hits = (JSON.parse(localStorage.getItem(k)) || [])
        .filter(function (t) { return now - t < 10 * 60 * 1000; });
      if (hits.length >= 3) return true;
      hits.push(now);
      localStorage.setItem(k, JSON.stringify(hits));
      return false;
    } catch (e) {
      return false;
    }
  }

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
        <div class="hp" aria-hidden="true"><label>Website</label><input type="text" name="website" tabindex="-1" autocomplete="off"></div>
        <label class="privacy"><input type="checkbox" name="privacy" required>
          <span>Ich bin einverstanden, dass meine Angaben zur Bearbeitung der Reservierung
          gespeichert und per SMS-Benachrichtigung verwendet werden. Die Daten werden
          30 Tage nach dem Besuch gelöscht.</span></label>
        <div class="err" role="alert"></div>
        <button type="submit">Reservierung anfragen</button>
      </form>
    </div>`;

  const err = mount.querySelector('.err');
  function showErr(msg) {
    err.textContent = msg;
    err.classList.add('show');
  }

  mount.querySelector('input[name=date]').addEventListener('change', function (e) {
    const closed = ResvStore.closedOn(restaurantId, e.target.value);
    if (closed) showErr(closed + 's haben wir Ruhetag – bitte wählen Sie einen anderen Tag.');
    else err.classList.remove('show');
  });

  mount.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault();
    const f = e.target;
    err.classList.remove('show');

    const closed = ResvStore.closedOn(restaurantId, f.date.value);
    if (closed) {
      showErr(closed + 's haben wir Ruhetag – bitte wählen Sie einen anderen Tag.');
      return;
    }
    /* Honeypot gefüllt oder unmenschlich schnell abgeschickt → still verwerfen. */
    const isBot = f.website.value !== '' || Date.now() - renderedAt < 3000;
    if (!isBot && tooMany()) {
      showErr('Zu viele Anfragen in kurzer Zeit – bitte versuchen Sie es später erneut oder rufen Sie uns an.');
      return;
    }
    if (!isBot) {
      ResvStore.create(restaurantId, {
        date: f.date.value,
        time: f.time.value,
        guests: Number(f.guests.value),
        name: f.name.value.trim(),
        phone: f.phone.value.trim(),
        note: f.note.value.trim()
      });
    }
    mount.querySelector('.resv').innerHTML = `
      <div class="ok">
        <strong>Vielen Dank, ${f.name.value.trim()}!</strong><br><br>
        Ihre Anfrage für ${f.guests.value} Person(en) am ${f.date.value.split('-').reverse().join('.')}
        um ${f.time.value} Uhr ist eingegangen.<br><br>
        Sie erhalten in Kürze eine Bestätigung per SMS.
      </div>`;
  });
})();
