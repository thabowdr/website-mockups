# Server betreiben

## Lokal / zum Testen

```bash
cd tools/server
npm install
node seed.js demo "Gasthaus Demo" "0371 000000"   # gibt das Zugangs-Token aus
node server.js                                     # Port 8787
```

- Portal: `http://127.0.0.1:8787/tools/portal/index.html?r=demo&name=Gasthaus%20Demo`
  (Anmeldung mit dem Token aus seed.js)
- Widget-Demo: `http://127.0.0.1:8787/tools/reservierung/index.html?r=demo`
  (SMS-Ausgang am „Gast-Handy“ braucht `&token=<token>`)
- Gast-Links aus den SMS: `http://127.0.0.1:8787/g/<guest_token>`

## Umgebungsvariablen

| Variable | Standard | Zweck |
|---|---|---|
| `PORT` | 8787 | HTTP-Port |
| `BASE_URL` | `http://127.0.0.1:PORT` | Basis für Gast-Links in SMS (live: `https://…`) |
| `SMS_MODE` | `sim` | `sim` = nur protokollieren, `seven` = echter Versand |
| `SEVEN_API_KEY` | – | API-Key von seven.io (nur bei `SMS_MODE=seven`) |
| `SMS_FROM` | `Reservierung` | Absenderkennung der SMS |
| `DISABLE_TIMERS` | – | gesetzt = keine Erinnerungs-/Aufräum-Timer (für Tests) |

## Eingebaute Automatik

- **Erinnerungs-SMS**: stündlicher Lauf, erinnert bestätigte Reservierungen von morgen (einmalig).
- **DSGVO-Aufräumen**: Reservierungen + Nachrichten werden 30 Tage nach dem Besuchsdatum gelöscht.
- **Spam-Schutz**: Honeypot-Feld und 3 Anfragen / 10 Minuten pro IP.

## Live-Hosting (sobald entschieden)

Generisch gilt: Node ≥ 20, ein Prozess (`node server.js`), Daten liegen in
`tools/server/data/portal.db` (SQLite, regelmäßig sichern). Vor die App gehört
TLS (z. B. Caddy/nginx als Reverse-Proxy) und `BASE_URL` auf die echte Domain.
Konkrete Skripte (VPS mit systemd + Caddy oder PaaS-Konfiguration) folgen nach
der Hosting-Entscheidung.
