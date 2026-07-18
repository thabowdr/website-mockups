# Reservierungs-Modul

Grundstruktur für Online-Reservierung mit Dashboard, kopierbar in jedes Kundenprojekt.

## Dateien

| Datei | Zweck |
|---|---|
| `store.js` | Gemeinsame Datenschicht (aktuell localStorage, später API) inkl. SMS-Texte und Vorschlags-Logik |
| `widget.js` | Einbettbares Reservierungsformular für die Kundenseite |
| `dashboard.html` | Übersicht für den Betreiber: bestätigen, Zeit vorschlagen, stornieren, No-Show – mit SMS-Vorschau |
| `index.html` | Demo-Seite mit eingebettetem Widget und simuliertem Gast-Handy (SMS-Eingang, Zusage/Ablehnung) |

## Benachrichtigungen & Zeitvorschlag

- Jede Aktion des Wirts (Bestätigen, Stornieren, Zeit vorschlagen) erzeugt den
  SMS-Text, der im Live-Betrieb an die Gast-Nummer geht. In der Demo wird er
  nur angezeigt (Dashboard-Toast) und am „Gast-Handy“ auf der Demo-Seite
  zugestellt.
- „Zeit vorschlagen“ überschreibt die Reservierung nicht: Status wird
  `vorschlag`, der Gast bekommt die Alternative per SMS und muss zusagen
  (Live-Betrieb: Bestätigungs-Link; Demo: Knopf am Gast-Handy). Erst dann
  springt die Reservierung mit neuer Uhrzeit auf `bestaetigt`.
- Echter Versand später über einen SMS-Anbieter (z. B. seven.io, Twilio)
  serverseitig – die Texte kommen fertig aus `ResvStore.smsText()`.

## Einstellungen, Kapazität, Schutz

- **Öffnungszeiten & Ruhetage**: im Dashboard unter „Einstellungen“ pflegbar
  (Standard: Montag Ruhetag, 11:00–21:30, 40 Plätze). Das Widget bietet nur
  buchbare Zeiten an und sperrt Ruhetage mit Hinweis.
- **Auslastung**: Tab „Heute“ zeigt belegte Plätze je Uhrzeit
  (gelb ab 80 %, rot ab 100 %).
- **Datenschutz**: Pflicht-Checkbox mit Speicher-/Löschhinweis am Formular.
  Für den Live-Betrieb pro Kunde ergänzen: Datenschutzerklärung der Website
  und AV-Vertrag.
- **Spam-Schutz**: Honeypot-Feld, Mindest-Ausfüllzeit, max. 3 Anfragen pro
  10 Minuten je Browser. Harte Grenzen später serverseitig.
- **Gast-Storno (vorbereitet)**: Bestätigungs-SMS enthält einen
  [Storno-Link]-Platzhalter; `ResvStore.cancelByGuest()` setzt den Status.
  Im Live-Betrieb wird daraus eine kleine Bestätigungsseite hinter dem Link.

## Demo testen

1. `index.html` öffnen, Reservierung abschicken.
2. `dashboard.html?r=demo` öffnen (gern zweiter Tab) – die Anfrage erscheint
   sofort unter „Offene Anfragen“ und kann bestätigt werden.

## In ein Kundenprojekt übernehmen

1. `store.js` und `widget.js` in den Mockup-Ordner kopieren.
2. In die Seite einbauen:

   ```html
   <div id="resv-widget" data-restaurant="gasthaus-zur-linde"></div>
   <script src="store.js"></script>
   <script src="widget.js"></script>
   ```

3. Farben ans Design anpassen (CSS-Variablen am `#resv-widget`-Container):

   ```css
   #resv-widget { --resv-accent: #c08a4e; --resv-bg: #1d1b19;
                  --resv-text: #f0ebe3; --resv-muted: #a49c90; }
   ```

4. `dashboard.html` mitkopieren; Aufruf: `dashboard.html?r=gasthaus-zur-linde`.

## Später: echter Betrieb

Alle Lese-/Schreibzugriffe laufen über `ResvStore.backend` in `store.js`.
Für den Live-Betrieb dort localStorage durch `fetch()`-Aufrufe gegen eine
kleine API ersetzen – Widget und Dashboard bleiben unverändert.
Das Dashboard bekommt dann noch einen Login vorgeschaltet.
