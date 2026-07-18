/*
 * ui.js – geteilte UI-Bausteine des Portals.
 * Alle Module bekommen dieses Objekt als ctx.ui gereicht.
 */
(function () {
  'use strict';

  window.PortalUI = {
    fmtDate(d) {
      return d.split('-').reverse().join('.');
    },

    /* Simulierte SMS-Vorschau (Live-Betrieb: echter Versand serverseitig). */
    toast(phone, text) {
      const el = document.getElementById('toast');
      if (!el) return;
      el.querySelector('.to').textContent = 'SMS an ' + phone + ' (Simulation)';
      el.querySelector('.txt').textContent = text;
      el.classList.add('show');
    },

    tabs(defs, active, onSwitch) {
      const el = document.createElement('div');
      el.className = 'tabs';
      el.innerHTML = defs.map(function (t) {
        return '<button data-tab="' + t.id + '"' + (t.id === active ? ' class="active"' : '') + '>' + t.label + '</button>';
      }).join('');
      el.addEventListener('click', function (e) {
        const btn = e.target.closest('button[data-tab]');
        if (!btn) return;
        el.querySelectorAll('button').forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        onSwitch(btn.dataset.tab);
      });
      return el;
    },

    statCards(items) {
      return '<div class="stats">' + items.map(function (s) {
        return '<div class="stat"><div class="num">' + s.value + '</div><div class="lbl">' + s.label + '</div></div>';
      }).join('') + '</div>';
    },

    placeholder(text) {
      return '<div class="placeholder"><span class="soon">In Vorbereitung</span><p>' + text + '</p></div>';
    }
  };
})();
