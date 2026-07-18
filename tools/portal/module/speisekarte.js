/* Modul Digitale Speisekarte – Platzhalter (Inhalte/Publishing). */
(function () {
  'use strict';

  Portal.register({
    id: 'speisekarte',
    title: 'Speisekarte',
    group: 'inhalte',
    subtitle: 'Gerichte und Preise selbst pflegen – die Website zieht automatisch nach.',

    render(container, ctx) {
      container.innerHTML = ctx.ui.placeholder(
        'Der Wirt ändert Preise, Gerichte und Kategorien hier im Portal – die Speisekarte ' +
        'auf der Website aktualisiert sich sofort. Kein veraltetes PDF mehr. ' +
        'Gerichte lassen sich als „aus“ markieren und saisonal ein- und ausblenden.'
      );
    }
  });
})();
