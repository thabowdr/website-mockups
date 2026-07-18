/* Modul Online-Bestellungen – Platzhalter (Eingangs-Workflow wie Reservierungen). */
(function () {
  'use strict';

  Portal.register({
    id: 'bestellungen',
    title: 'Bestellungen',
    group: 'eingang',
    subtitle: 'Online-Bestellung und Vorbestellung zur Abholung.',

    render(container, ctx) {
      container.innerHTML = ctx.ui.placeholder(
        'Gäste bestellen über die Website zur Abholung – ohne Lieferando-Provision. ' +
        'Bestellungen laufen hier ein wie Reservierungen: annehmen, Abholzeit bestätigen, ' +
        'der Gast bekommt automatisch eine SMS. Auch für Bäckereien geeignet ' +
        '(Brötchen und Torten vorbestellen).'
      );
    }
  });
})();
