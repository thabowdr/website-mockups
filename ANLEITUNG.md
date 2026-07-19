# Reservierungssystem lokal testen (Laptop)

So startest du das komplette System auf deinem Rechner. Voraussetzung:
[Node.js](https://nodejs.org) (Version 20 oder neuer) ist installiert.

## 1. Code holen

```bash
git clone https://github.com/thabowdr/website-mockups.git
cd website-mockups
git checkout claude/gastro-automation-tools-7jlunk
```

(Wenn du das Repo schon hast: `git checkout claude/gastro-automation-tools-7jlunk && git pull`)

## 2. Server einrichten und starten

```bash
cd tools/server
npm install
node seed.js gasthaus-zur-linde "Gasthaus Zur Linde" "0160 00000000"
```

Die letzte Zeile gibt dein **Zugangs-Token** aus – notieren, das ist der
Portal-Login. (Die Telefonnummer ist die „Wirt-Nummer“ für Benachrichtigungen,
im Simulationsmodus wird sie nur protokolliert.)

```bash
node server.js
```

Der Server läuft jetzt auf `http://127.0.0.1:8787` und bleibt an, solange das
Terminal offen ist (Beenden: `Strg+C`).

## 3. Die drei Rollen des Tests (drei Browser-Tabs)

| Rolle | Adresse |
|---|---|
| **Website (Gast)** | `http://127.0.0.1:8787/m/gasthaus-zur-linde-550c82/index.html#reservieren` |
| **Portal (Wirt)** | `http://127.0.0.1:8787/tools/portal/index.html?r=gasthaus-zur-linde&name=Gasthaus%20Zur%20Linde` |
| **Gast-Handy (SMS-Ausgang)** | `http://127.0.0.1:8787/tools/reservierung/index.html?r=gasthaus-zur-linde&token=DEIN-TOKEN` |

## 4. Testablauf

1. **Website:** Auf der Gasthaus-Seite im Abschnitt „Online reservieren“ eine
   Anfrage abschicken.
2. **Portal:** Mit dem Token anmelden. Die Anfrage steht unter „Reservierungen“
   (Tab „Kommend“ bzw. „Alle“), die Übersicht zeigt sie unter „Braucht deine
   Aufmerksamkeit“. Bestätigen, stornieren oder „Zeit vorschlagen“.
3. **Gast-Handy:** Zeigt jede SMS, die im Live-Betrieb an den Gast (und an dich
   als Wirt) gehen würde – inklusive des Links, den der Gast antippen würde.
4. **Gast-Link:** Den Link aus der SMS öffnen – dort kann der „Gast“ zusagen,
   ablehnen oder stornieren. Das Portal zeigt die Änderung sofort.
5. **Öffnungszeiten:** Im Portal unter „Öffnungszeiten“ z. B. einen Ruhetag
   ändern – das Widget auf der Website sperrt den Tag sofort.

## Gut zu wissen

- **SMS gehen noch nicht wirklich raus** (Simulationsmodus). Echter Versand
  wird später nur per Zugangsdaten aktiviert (`tools/server/DEPLOY.md`).
- Die Daten liegen in `tools/server/data/portal.db`. Zum Zurücksetzen des
  Tests: Server stoppen, Ordner `tools/server/data` löschen, neu seeden.
- Für den Live-Gang (echte URL statt 127.0.0.1) siehe `tools/server/DEPLOY.md`
  – dafür fehlt nur noch die Hosting-Entscheidung.
