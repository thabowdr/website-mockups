/* Modul Anfragen (Catering/Feiern) – Platzhalter (Eingangs-Workflow). */
(function () {
  'use strict';

  Portal.register({
    id: 'anfragen',
    title: 'Anfragen',
    group: 'eingang',
    subtitle: 'Catering, Feiern und Veranstaltungen.',

    render(container, ctx) {
      container.innerHTML = ctx.ui.placeholder(
        'Anfragen für Feiern, Catering und geschlossene Gesellschaften kommen strukturiert ' +
        'aus dem Website-Formular hier an (Anlass, Datum, Personenzahl, Budget). ' +
        'Mit Antwortvorlagen antwortet der Wirt in zwei Minuten statt Telefon-Pingpong – ' +
        'und nichts geht im E-Mail-Postfach verloren.'
      );
    }
  });
})();
