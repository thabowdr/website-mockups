# Betriebsportal

Ein Dashboard pro Gastro-Kunde, in Module unterteilt. Aufruf:
`index.html?r=<betriebs-id>&name=<Anzeigename>` — Modul-Wechsel per Hash
(`#reservierungen`, `#zeiten`, …).

## Zwei Schichten

- **Eingang (Workflows):** Reservierungen, Bestellungen, Anfragen Catering/Feiern.
  Anfrage kommt rein → Status-Workflow → SMS an den Gast.
- **Inhalte (Publishing):** Speisekarte, Öffnungszeiten/Urlaub, News/Tagesgerichte.
  Wirt pflegt Inhalte → Website (später auch Google-Profil) zeigt sie automatisch.

Die Übersicht aggregiert beides: Tageszahlen, offene Posten, heutiger Status.

## Struktur

| Pfad | Zweck |
|---|---|
| `index.html` | Shell: Seitenleiste, Hash-Routing, SMS-Toast, Modul-Registry |
| `portal.css` | gemeinsame Design-Tokens und Bausteine (Karten, Badges, Tabs, …) |
| `core/store.js` | Datenschicht (identisch mit `../reservierung/store.js`; localStorage → später API) |
| `core/ui.js` | geteilte UI-Helfer: `toast`, `tabs`, `statCards`, `placeholder`, `fmtDate` |
| `module/uebersicht.js` | Startseite |
| `module/reservierungen.js` | erstes echtes Modul (kompletter Workflow) |
| `module/zeiten.js` | Öffnungszeiten/Ruhetage/Plätze; Urlaub + Google-Sync in Vorbereitung |
| `module/bestellungen.js` … | Platzhalter, werden Modul für Modul gefüllt |

## Neues Modul anlegen

Datei `module/<name>.js`, in `index.html` einbinden, dann:

```js
Portal.register({
  id: 'name',            // Hash-Route
  title: 'Titel',
  group: 'eingang',      // '', 'eingang' oder 'inhalte'
  subtitle: '…',
  badge(ctx) { return 0; },          // optional: Zähler in der Seitenleiste
  render(container, ctx) { … }       // ctx = { restaurantId, restaurantName, store, ui }
});
```

## Merkposten Server (spätere Laptop-Session)

Node + SQLite auf VPS (~5 €/Monat, trägt alle Betriebe), ersetzt localStorage in
`core/store.js` durch API-Aufrufe. Übernimmt dann: echten SMS-Versand (seven.io),
Wirt-Benachrichtigung bei neuen Anfragen, Erinnerungs-SMS am Vortag,
Zusage-/Storno-Links für Gäste, Login pro Betrieb.
