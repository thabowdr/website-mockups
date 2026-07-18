/* Modul News – Platzhalter (Inhalte/Publishing): Tagesgerichte, Urlaub, Meldungen. */
(function () {
  'use strict';

  Portal.register({
    id: 'news',
    title: 'News',
    group: 'inhalte',
    subtitle: 'Tagesgerichte und Meldungen einmal eintragen, überall anzeigen.',

    render(container, ctx) {
      container.innerHTML = ctx.ui.placeholder(
        'Tagesgericht oder Meldung („Wir machen Urlaub vom …“) einmal eintragen – ' +
        'erscheint automatisch als Banner auf der Website und später als Beitrag ' +
        'auf Facebook/Instagram und im Google-Profil. Mittagskarte in 30 Sekunden ' +
        'statt drei Apps.'
      );
    }
  });
})();
