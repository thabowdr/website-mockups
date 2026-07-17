# Reservierungs-Modul

Grundstruktur für Online-Reservierung mit Dashboard, kopierbar in jedes Kundenprojekt.

## Dateien

| Datei | Zweck |
|---|---|
| `store.js` | Gemeinsame Datenschicht (aktuell localStorage, später API) |
| `widget.js` | Einbettbares Reservierungsformular für die Kundenseite |
| `dashboard.html` | Übersicht für den Betreiber: bestätigen, stornieren, No-Show |
| `index.html` | Demo-Seite mit eingebettetem Widget |

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
