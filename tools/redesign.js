// Redesign-Generator: liest Daten aus einem Template-Mockup (altes helles
// Standard-Template mit --tint) und rendert es neu im Pexuscode-Designsystem.
//
// Nutzung:  node tools/redesign.js <ordner-slug> <theme>
//   z. B.:  node tools/redesign.js pizzeria-luigi-abc123 italian
// Themes:   gasthaus garten italian greek doner persian wine asian japanese
//           baeckerei eiscafe fleischerei friseur partner
// Danach committen & pushen — GitHub Pages aktualisiert die Live-URL.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'm');

const U = id => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop`;

const THEMES = {
  baeckerei: {
    mode: 'light', cuisine: 'B&auml;ckerei &amp; Konditorei', icon: 'fa-bread-slice', font: 'playfair',
    h1a: 'Frisch gebacken,', h1b: 'mit Handwerk &amp; Herz.',
    accent: '#a5713a', btnText: '#fff', second: '#8a5f2e',
    cta: 'Jetzt vorbestellen',
    hero: '1509440159596-0249088772ff',
    gal: ['1549931319-a545dcf3bc73', '1555507036-ab1f4038808a', '1517433670267-08bbd4be890f', '1578985545062-69928b1d9587', '1486427944299-d1955d23e34d'],
  },
  eiscafe: {
    mode: 'light', cuisine: 'Eiscaf&eacute;', icon: 'fa-ice-cream', font: 'playfair',
    h1a: 'Eis, Torten &amp; Kaffee &mdash;', h1b: 'hausgemacht.',
    accent: '#c95d7c', btnText: '#fff', second: '#3f8e7e',
    cta: 'Jetzt anrufen',
    hero: '1501443762994-82bd5dace89a',
    gal: ['1497034825429-c343d7c6a68f', '1563805042-7684c019e1cb', '1551024506-0bccd828d307', '1495474472287-4d71bcdd2085', '1516559828984-fb3b99548b21'],
  },
  fleischerei: {
    mode: 'light', cuisine: 'Fleischerei', icon: 'fa-drumstick-bite', font: 'playfair',
    h1a: 'Gutes vom Fleischer &mdash;', h1b: 'aus eigener Herstellung.',
    accent: '#9d3c34', btnText: '#fff', second: '#7a4a2c',
    cta: 'Jetzt bestellen',
    hero: '1541529086526-db283c563270',
    gal: ['1529692236671-f1f6cf9683ba', '1558030006-450675393462', '1504674900247-0877df9cc836', '1414235077428-338989a2e8c0', '1466978913421-dad2ebd01d17'],
  },
  friseur: {
    mode: 'light', cuisine: 'Friseursalon', icon: 'fa-scissors', font: 'playfair',
    h1a: 'Ihr Stil.', h1b: 'Unser Handwerk.',
    accent: '#23201d', btnText: '#fff', second: '#b08d3e',
    cta: 'Termin vereinbaren',
    hero: '1560066984-138dadb4c035',
    gal: ['1522337660859-02fbefca4702', '1562322140-8baeececf3df', '1585747860715-2ba37e788b70', '1503951914875-452162b0f3f1', '1622286342621-4bd786c2447c'],
  },
  partner: {
    mode: 'light', cuisine: 'Service &amp; Handwerk', icon: 'fa-handshake', font: 'playfair',
    h1a: 'Ihr zuverl&auml;ssiger Partner', h1b: 'in der Region.',
    accent: '#3e6a8a', btnText: '#fff', second: '#8a6f3e',
    cta: 'Jetzt anrufen',
    hero: '1521791136064-7986c2920216',
    gal: ['1497366216548-37526070297c', '1497366811353-6870744d04b2', '1504307651254-35680f356dfd', '1581091226825-a6a2a5aee158', '1560472354-b33ff0c44a43'],
  },
  gasthaus: {
    cuisine: 'Regionale K&uuml;che', icon: 'fa-utensils', font: 'playfair',
    h1a: 'Ehrliche K&uuml;che,', h1b: 'herzlich serviert.',
    accent: '#c08a4e', btnText: '#1b130a', second: '#c9cfd6',
    hero: '1414235077428-338989a2e8c0',
    gal: ['1544025162-d76694265947', '1600891964092-4316c288032e', '1514933651103-005eec06c04b', '1552566626-52f8b828add9', '1464366400600-7168b8af9bc3'],
  },
  garten: {
    cuisine: 'Ausflugsgastst&auml;tte', icon: 'fa-tree', font: 'playfair',
    h1a: 'Einkehren, durchatmen,', h1b: 'genie&szlig;en.',
    accent: '#8fa66f', btnText: '#141810', second: '#d8c8a8',
    hero: '1521017432531-fbd92d768814',
    gal: ['1414235077428-338989a2e8c0', '1544025162-d76694265947', '1504674900247-0877df9cc836', '1552566626-52f8b828add9', '1464366400600-7168b8af9bc3'],
  },
  italian: {
    cuisine: 'Italienische K&uuml;che', icon: 'fa-pizza-slice', font: 'playfair',
    h1a: 'Wie ein Abend', h1b: 'in Italien.',
    accent: '#c4573a', btnText: '#fff', second: '#c9a05a',
    hero: '1574071318508-1cdbab80d002',
    gal: ['1513104890138-7c749659a591', '1551183053-bf91a1d81141', '1481931098730-318b6f776db0', '1556761223-4c4282c73f77', '1552566626-52f8b828add9'],
  },
  greek: {
    cuisine: 'Griechische K&uuml;che', icon: 'fa-landmark', font: 'playfair',
    h1a: 'Gastfreundschaft', h1b: 'wie im Urlaub.',
    accent: '#5588ad', btnText: '#0e1419', second: '#c9a05a',
    hero: '1533105079780-92b9be482077',
    gal: ['1600891964092-4316c288032e', '1555939594-58d7cb561ad1', '1540420773420-3366772f4999', '1504674900247-0877df9cc836', '1552566626-52f8b828add9'],
  },
  doner: {
    cuisine: 'Orientalische K&uuml;che', icon: 'fa-fire', font: 'playfair',
    h1a: 'Frisch vom Spie&szlig;,', h1b: 'mit Liebe gemacht.',
    accent: '#c0563a', btnText: '#fff', second: '#c9a05a',
    hero: '1504674900247-0877df9cc836',
    gal: ['1555939594-58d7cb561ad1', '1466978913421-dad2ebd01d17', '1550547660-d9450f859349', '1529006557810-274b9b2fc783', '1552566626-52f8b828add9'],
  },
  persian: {
    cuisine: 'Persische K&uuml;che', icon: 'fa-fire', font: 'playfair',
    h1a: 'Persische K&uuml;che,', h1b: 'herzlich serviert.',
    accent: '#b0563f', btnText: '#fff', second: '#c9a05a',
    hero: '1504674900247-0877df9cc836',
    gal: ['1555939594-58d7cb561ad1', '1466978913421-dad2ebd01d17', '1473093295043-cdd812d0e601', '1414235077428-338989a2e8c0', '1552566626-52f8b828add9'],
  },
  wine: {
    cuisine: 'Weinstube', icon: 'fa-wine-glass', font: 'playfair',
    h1a: 'Gute Weine, gutes Essen,', h1b: 'gute Zeit.',
    accent: '#a05262', btnText: '#fff', second: '#c9a05a',
    hero: '1510812431401-41d2bd2722f3',
    gal: ['1506377247377-2a5b3b417ebb', '1414235077428-338989a2e8c0', '1514933651103-005eec06c04b', '1464366400600-7168b8af9bc3', '1552566626-52f8b828add9'],
  },
  asian: {
    cuisine: 'Asiatische K&uuml;che', icon: 'fa-bowl-rice', font: 'cormorant',
    h1a: 'Frisch aus dem Wok,', h1b: 'voller Aroma.',
    accent: '#d9432f', btnText: '#fff', second: '#c9a05a',
    hero: '1512058564366-18510be2db19',
    gal: ['1569718212165-3a8278d5f624', '1555126634-323283e090fa', '1526318896980-cf78c088247c', '1617196034796-73dfa7b1fd56', '1552566626-52f8b828add9'],
  },
  japanese: {
    cuisine: 'Japanische K&uuml;che', icon: 'fa-fish', font: 'cormorant',
    h1a: 'Sushi &amp; mehr &mdash;', h1b: 'frisch zubereitet.',
    accent: '#d9432f', btnText: '#fff', second: '#c9a05a',
    hero: '1553621042-f6e147245754',
    gal: ['1579871494447-9811cf80d66c', '1607301405390-d831c242f59b', '1611143669185-af224c5e3252', '1617196034796-73dfa7b1fd56', '1552566626-52f8b828add9'],
  },
};

const FONTS = {
  playfair: { css: "'Playfair Display', serif", url: 'family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,500' },
  cormorant: { css: "'Cormorant Garamond', serif", url: 'family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500' },
};

// CLI: node tools/redesign.js <slug> <theme>  — ohne Argumente laufen die
// unten hinterlegten Zuordnungen (bereits umgestellte Mockups werden erkannt
// und übersprungen).
const CLI = process.argv.slice(2);
const SITES = CLI.length >= 2 ? { [CLI[0]]: CLI[1] } : {
  'baeckerei-barth-f2eba8': 'baeckerei',
  'baeckerei-kiessig-d226d1': 'baeckerei',
  'baeckerei-lehmann-929bb4': 'baeckerei',
  'baeckerei-moebius-6abd0e': 'baeckerei',
  'baeckerei-selbmann-92e8f9': 'baeckerei',
  'baeckerei-weise-3fddfe': 'baeckerei',
  'eiscafe-boerner-bc9034': 'eiscafe',
  'eisgarten-an-der-kassbergauffahrt-96a621': 'eiscafe',
  'piccolino-eis-grillbar-e86ac6': 'eiscafe',
  'stadtcafe-1180e0': 'eiscafe',
  'fleischerei-hendel-41d46a': 'fleischerei',
  'fleischerei-richter-00795c': 'fleischerei',
  'city-cut-147efe': 'friseur',
  'diedrich-733f5c': 'partner',
  'emil-reimann-5abff1': 'partner',
  'langrzik-juergen-00ef95': 'partner',
  'viertel-c445a2': 'partner',
};

const OLD_SITES = {
  'adler-1e9ad7': 'gasthaus',
  'am-kalkwerk-923748': 'gasthaus',
  'am-schwarzen-teich-2c7db1': 'garten',
  'asia-imbiss-hot-wok-3fad02': 'asian',
  'bistro-diyar-a43620': 'doner',
  'bistro-la-carte-be14c3': 'gasthaus',
  'bistro-treffpunkt-a01f11': 'gasthaus',
  'bologna-efc26c': 'italian',
  'delphi-462be3': 'greek',
  'die-winzerstube-7318f3': 'wine',
  'drei-schwanen-c7f470': 'gasthaus',
  'gartengaststaette-zur-erholung-f1bb07': 'garten',
  'gasthaus-zum-schlossberg-16076c': 'gasthaus',
  'gasthaus-zur-linde-550c82': 'gasthaus',
  'gasthof-draisdorf-athos-13b710': 'greek',
  'gaststaette-adelsbergturm-d218e5': 'garten',
  'gaststaette-da-ori-6cc24c': 'italian',
  'gaststaette-pfaffenberg-90a8bf': 'garten',
  'goldene-krone-d50eda': 'gasthaus',
  'japanisches-restaurant-osaka-e94db1': 'japanese',
  'jungborn-5c436e': 'gasthaus',
  'kirchbaeck-127737': 'gasthaus',
  'morgensonne-7350b1': 'gasthaus',
  'mueller-2a3901': 'gasthaus',
  'oederaner-kebab-haus-cb6ff1': 'doner',
  'onat-doener-284122': 'doner',
  'pizzeria-37c85d': 'italian',
  'pizzeria-mama-mia-1e9077': 'italian',
  'raststaette-rabensteiner-wald-f870bb': 'garten',
  'stehpizzeria-napoli-bf0816': 'italian',
  'taverne-hellas-40630b': 'greek',
  'teichhaus-abeee4': 'garten',
  'venezia-8494fc': 'italian',
  'zum-haineck-persepolis-f2ddda': 'persian',
  'zur-stadtwache-778e8c': 'gasthaus',
};

const PEXUS_TEL = '+4916095530838';

function m(re, s) { const x = s.match(re); return x ? x[1].trim() : null; }
function all(re, s) { const out = []; let x; while ((x = re.exec(s))) out.push(x); return out; }

function extract(html) {
  const d = {};
  d.title = m(/<title>([^<]+?) – [^<]*<\/title>/, html) || m(/<title>([^<]+)<\/title>/, html);
  d.label = m(/tracking-wider text-accent mb-4">\s*([\s\S]*?)\s*<\/span>/, html);
  d.heroP = m(/<p class="text-lg mb-8" style="color:var\(--muted\)">([\s\S]*?)<\/p>/, html);
  d.services = all(/<i class="fas ([\w-]+)"><\/i>\s*<\/div>\s*<h3 class="text-lg font-semibold mb-2">([\s\S]*?)<\/h3>\s*<p style="color:var\(--muted\)">([\s\S]*?)<\/p>/g, html)
    .map(x => ({ icon: x[1], title: x[2].trim(), text: x[3].trim() }));
  d.ueber = m(/<section id="ueber"[\s\S]*?<p class="text-lg leading-relaxed" style="color:var\(--muted\)">([\s\S]*?)<\/p>/, html);
  d.tags = all(/bg-tint text-accent font-semibold capitalize">([\s\S]*?)<\/span>/g, html).map(x => x[1].trim());
  d.hours = all(/<td class="py-2 font-medium">([\s\S]*?)<\/td>\s*<td class="py-2 text-right"[^>]*>([\s\S]*?)<\/td>/g, html)
    .map(x => ({ day: x[1].trim(), time: x[2].trim() }));
  if (!d.hours.length) {
    const card = m(/Öffnungszeiten<\/h3>\s*([\s\S]*?)<\/div>/, html);
    d.hoursNote = card ? (m(/<p[^>]*>([\s\S]*?)<\/p>/, card) || null) : null;
  }
  d.address = m(/fa-map-marker-alt text-accent mt-1"><\/i>\s*<span>([\s\S]*?)<\/span>/, html);
  const tels = [...new Set(all(/href="tel:([^"]+)"/g, html).map(x => x[1]))].filter(t => t !== PEXUS_TEL);
  d.tel = tels[0] || PEXUS_TEL;
  d.tel2 = tels[1] || null;
  d.telDisplay = m(/fa-phone text-accent mt-1"><\/i>\s*<a[^>]*>([\s\S]*?)<\/a>/, html);
  const mails = [...new Set(all(/href="mailto:([^"]+)"/g, html).map(x => x[1]))].filter(e => !e.includes('pexuscode'));
  d.email = mails[0] || null;
  d.faq = all(/<h3 class="font-medium">([\s\S]*?)<\/h3>[\s\S]*?<p class="pt-3 text-sm"[^>]*>([\s\S]*?)<\/p>/g, html)
    .map(x => ({ q: x[1].trim(), a: x[2].trim() }));
  d.city = d.address ? (m(/\d{5}\s+([A-Za-zÄÖÜäöüß .-]+)/, d.address) || null) : null;
  return d;
}

function prettyTel(t) {
  if (!t) return '';
  return t.replace(/^\+49/, '0').replace(/^00/, '0');
}

function render(d, theme) {
  const T = THEMES[theme];
  const F = FONTS[T.font];
  const L = T.mode === 'light';
  const P = L ? { // Palette light
    bg: '#faf7f1', panel: '#ffffff', line: 'rgba(0,0,0,.09)',
    text: '#28221b', muted: '#6e675c',
    headerBg: 'rgba(250,247,241,.5)', headerScrolled: 'rgba(250,247,241,.95)',
    heroLabel: '#f0e7d6', heroMuted: '#e2dccf', heroText: '#f7f3ea',
    heroGrad: 'rgba(28,24,20,.5) 0%, rgba(28,24,20,.62) 55%',
    cardShadow: '0 24px 60px rgba(40,30,20,.14)', cardBorderHover: 'rgba(0,0,0,.18)',
    footBg: '#241f1a', footText: '#8b8578', bannerBg: '#241f1a',
    galShade: 'rgba(28,24,20,.45)', tagBg: 'rgba(0,0,0,.04)',
  } : {
    bg: '#141312', panel: '#1d1b19', line: 'rgba(255,255,255,.08)',
    text: '#f0ebe3', muted: '#a49c90',
    headerBg: 'rgba(20,19,18,.35)', headerScrolled: 'rgba(20,19,18,.93)',
    heroLabel: 'var(--accent2)', heroMuted: 'var(--muted)', heroText: 'var(--text)',
    heroGrad: 'rgba(20,19,18,.58) 0%, rgba(20,19,18,.74) 55%',
    cardShadow: '0 24px 60px rgba(0,0,0,.45)', cardBorderHover: 'rgba(255,255,255,.22)',
    footBg: '#0c0b0a', footText: '#57534a', bannerBg: '#0c0b0a',
    galShade: 'rgba(20,19,18,.55)', tagBg: 'rgba(255,255,255,.06)',
  };
  const CTA = T.cta || 'Tisch reservieren';
  const name = d.title;
  const label = (d.label || ((d.city ? d.city + ' · ' : '') + T.cuisine)).replace(/·/g, '·');
  const telDisp = d.telDisplay || prettyTel(d.tel);
  const heroSub = d.heroP || `${T.cuisine.replace(/&uuml;/g, 'ü')} &mdash; frisch zubereitet${d.city ? ' in ' + d.city + ' und Umgebung' : ''}.`;

  const svcIcons = { 'fa-utensils': 'fa-utensils', 'fa-champagne-glasses': 'fa-champagne-glasses', 'fa-bag-shopping': 'fa-bag-shopping' };
  const services = (d.services.length ? d.services : [
    { icon: 'fa-utensils', title: 'Frische K&uuml;che', text: 'T&auml;glich frisch zubereitete Gerichte aus guten Zutaten.' },
    { icon: 'fa-champagne-glasses', title: 'Feiern &amp; Events', text: 'Ob Familienfeier oder Firmenessen &mdash; wir richten Ihre Veranstaltung gern aus.' },
    { icon: 'fa-bag-shopping', title: 'Au&szlig;er Haus', text: 'Ihre Lieblingsgerichte zum Mitnehmen &mdash; einfach vorbestellen und abholen.' },
  ]).map((s, i) => `
      <div class="card fade-up ${i === 1 ? 'd1 ' : i === 2 ? 'd2 ' : ''}rounded-sm p-8">
        <i class="fas ${svcIcons[s.icon] || s.icon} text-accent2 text-2xl mb-4"></i>
        <h3 class="font-display text-2xl mb-2">${s.title}</h3>
        <p class="text-sm leading-relaxed" style="color:var(--muted)">${s.text}</p>
      </div>`).join('');

  const gal = T.gal.map((id, i) => {
    const span = i === 0 ? ' col-span-2 row-span-2' : '';
    const w = i === 0 ? 1200 : 700;
    const dl = i === 0 ? '' : i < 3 ? ' d1' : ' d2';
    return `
      <div class="gal fade-up${dl}${span}">
        <img src="${U(T.gal[i])}&w=${w}&q=70" alt="${name} – Einblick ${i + 1}" loading="lazy" class="w-full h-full object-cover">
      </div>`;
  }).join('');

  const hoursRows = d.hours && d.hours.length ? `
      <table class="w-full text-sm">${d.hours.map((h, i) => `
        <tr${i < d.hours.length - 1 ? ' class="border-b border-line"' : ''}>
          <td class="py-3 font-medium">${h.day}</td>
          <td class="py-3 text-right" style="color:var(--muted)">${h.time}</td>
        </tr>`).join('')}
      </table>` : `
      <p class="text-sm leading-relaxed" style="color:var(--muted)">${d.hoursNote || 'Nach Vereinbarung &mdash; rufen Sie uns gern an.'}</p>`;

  const tagBadges = d.tags && d.tags.length ? `
  <div class="flex flex-wrap justify-center gap-2 mt-8">${d.tags.map(t => `
    <span class="tag-badge text-xs px-4 py-1.5 rounded-full uppercase tracking-wider">${t}</span>`).join('')}
  </div>` : '';

  const faq = (d.faq && d.faq.length ? d.faq : []).map(f => `
  <div class="faq fade-up border-b border-line py-5 cursor-pointer" onclick="this.classList.toggle('open')">
    <div class="flex justify-between items-center gap-4">
      <h3 class="font-medium">${f.q}</h3>
      <i class="faq-i fas fa-chevron-down text-accent2 transition-transform"></i>
    </div>
    <div class="faq-a"><p class="pt-4 text-sm leading-relaxed" style="color:var(--muted)">${f.a}</p></div>
  </div>`).join('');

  const faqSection = faq ? `
<!-- FAQ -->
<section class="max-w-3xl mx-auto px-4 pb-20 md:pb-28">
  <h2 class="font-display text-4xl text-center mb-12 fade-up">H&auml;ufige Fragen</h2>
${faq}
</section>
` : '';

  const mapsQ = d.address ? encodeURIComponent(d.address.replace(/<[^>]+>/g, '')) : null;
  const emailLi = d.email ? `
        <li class="flex gap-3"><i class="fas fa-envelope text-accent2 mt-1"></i>
          <a href="mailto:${d.email}" class="hover:text-white transition-colors break-all">${d.email}</a></li>` : '';
  const tel2Li = d.tel2 ? `
        <li class="flex gap-3"><i class="fas fa-mobile-screen text-accent2 mt-1"></i>
          <a href="tel:${d.tel2}" class="hover:text-white transition-colors">${prettyTel(d.tel2)}</a></li>` : '';
  const mapsBtn = mapsQ ? `
        <a href="https://maps.google.com/?q=${mapsQ}" target="_blank" rel="noopener"
           class="btn-ghost px-6 py-3 rounded-sm font-medium inline-flex items-center">
          <i class="fas fa-route mr-2 text-xs"></i>Route planen</a>` : '';

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${name} – ${T.cuisine.replace(/&uuml;/g, 'ü').replace(/&auml;/g, 'ä').replace(/&szlig;/g, 'ß').replace(/&amp;/g, '&')}${d.city ? ' in ' + d.city : ''}</title>
<meta name="description" content="${name} – frisch zubereitet, herzlich serviert${d.city ? ' – in ' + d.city : ''}.">
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?${F.url}&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: ${P.bg};
    --panel: ${P.panel};
    --line: ${P.line};
    --accent: ${T.accent};
    --accent2: ${T.second};
    --text: ${P.text};
    --muted: ${P.muted};
  }
  html { scroll-behavior: smooth; }
  html, body { overflow-x: hidden; max-width: 100%; background: var(--bg); }
  body { color: var(--text); font-family: 'Inter', system-ui, sans-serif; font-weight: 300; }
  img { max-width: 100%; }
  [id] { scroll-margin-top: 96px; }

  .font-display { font-family: ${F.css}; }
  .text-accent { color: var(--accent); }
  .text-accent2 { color: var(--accent2); }
  .border-line { border-color: var(--line); }

  .label {
    font-size: .7rem; letter-spacing: .35em; text-transform: uppercase;
    color: var(--accent2); font-weight: 500;
  }
  .hairline { width: 56px; height: 1px; background: var(--accent2); opacity: .5; }

  .hero-bg {
    position: absolute; inset: 0;
    background:
      linear-gradient(180deg, ${P.heroGrad}, var(--bg) 100%),
      url('${U(T.hero)}&w=2000&q=75') center/cover no-repeat;
  }

  .btn-primary {
    background: var(--accent); color: ${T.btnText}; font-weight: 500;
    transition: filter .2s ease, transform .2s ease;
    box-shadow: 0 8px 28px rgba(0,0,0,.35);
  }
  .btn-primary:hover { filter: brightness(1.1); transform: translateY(-2px); }
  .btn-ghost {
    border: 1px solid ${L ? 'rgba(0,0,0,.3)' : 'rgba(255,255,255,.25)'}; color: var(--text);
    transition: all .25s ease;
  }
  .btn-ghost:hover { background: var(--accent2); border-color: var(--accent2); color: ${L ? '#fff' : '#14161a'}; }
  .hero-ghost { border: 1px solid rgba(255,255,255,.35); color: ${P.heroText}; transition: all .25s ease; }
  .hero-ghost:hover { background: rgba(255,255,255,.92); border-color: #fff; color: #1c1814; }

  .card { background: var(--panel); border: 1px solid var(--line); transition: transform .3s ease, border-color .3s ease, box-shadow .3s ease; }
  .card:hover { transform: translateY(-6px); border-color: ${P.cardBorderHover}; box-shadow: ${P.cardShadow}; }

  .tag-badge { background: ${P.tagBg}; border: 1px solid var(--line); color: var(--accent2); }

  .hero-label { color: ${P.heroLabel}; }
  .hero-text { color: ${P.heroText}; }
  .hero-muted { color: ${P.heroMuted}; }

  .gal { position: relative; overflow: hidden; border-radius: .375rem; }
  .gal img { transition: transform .6s ease; display: block; }
  .gal:hover img { transform: scale(1.06); }
  .gal::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(180deg, transparent 60%, ${P.galShade});
    opacity: 0; transition: opacity .4s ease; pointer-events: none;
  }
  .gal:hover::after { opacity: 1; }

  .faq-a { max-height: 0; overflow: hidden; transition: max-height .35s ease; }
  .faq.open .faq-a { max-height: 320px; }
  .faq.open .faq-i { transform: rotate(180deg); }

  .fade-up { opacity: 0; transform: translateY(28px); transition: opacity .8s ease, transform .8s ease; }
  .fade-up.show { opacity: 1; transform: none; }
  .d1 { transition-delay: .1s; } .d2 { transition-delay: .2s; }

  #site-header { background: ${P.headerBg}; backdrop-filter: blur(12px); transition: background .3s ease, border-color .3s ease; border-bottom: 1px solid transparent; }
  #site-header.scrolled { background: ${P.headerScrolled}; border-bottom-color: var(--line); }
  ${L ? `#site-header:not(.scrolled) { color: ${P.heroText}; } #site-header:not(.scrolled) nav a { color: ${P.heroMuted}; } #site-header:not(.scrolled) nav a:hover { color: #fff; }` : ''}

  @media (prefers-reduced-motion: reduce) {
    .fade-up { opacity: 1; transform: none; transition: none; }
    .card, .gal img { transition: none; }
  }
</style>
</head>
<body>

<!-- Hinweis-Banner -->
<div class="text-center text-xs sm:text-sm py-2 px-4" style="background:${P.bannerBg}; color:#8b8578">
  Unverbindlicher Design-Vorschlag von Pexuscode ·
  <a class="underline hover:text-white" href="tel:+4916095530838">+49 160 95530838</a> ·
  <a class="underline hover:text-white" href="mailto:pexuscodede@gmail.com">pexuscodede@gmail.com</a>
</div>

<!-- Header -->
<header id="site-header" class="sticky top-0 z-40">
  <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
    <a href="#top" class="flex items-center gap-3">
      <span class="text-accent2 text-xl"><i class="fas ${T.icon}"></i></span>
      <span class="font-display text-lg md:text-xl tracking-wide leading-tight">${name}</span>
    </a>
    <nav class="hidden md:flex items-center gap-7 text-sm" style="color:var(--muted)">
      <a href="#angebot" class="hover:text-white transition-colors">Angebot</a>
      <a href="#galerie" class="hover:text-white transition-colors">Galerie</a>
      <a href="#ueber" class="hover:text-white transition-colors">&Uuml;ber uns</a>
      <a href="#kontakt" class="hover:text-white transition-colors">Kontakt</a>
    </nav>
    <div class="flex items-center gap-3">
      <a href="tel:${d.tel}" class="hidden sm:inline-flex btn-primary px-5 py-2.5 rounded-sm text-sm items-center">
        <i class="fas fa-phone mr-2 text-xs"></i>${telDisp}
      </a>
      <button id="burger" class="md:hidden text-2xl text-accent2" aria-label="Menü öffnen"><i class="fas fa-bars"></i></button>
    </div>
  </div>
  <nav id="mobile-nav" class="hidden md:hidden px-4 pb-5 flex-col gap-4 text-sm" style="background:${L ? 'rgba(250,247,241,.98)' : 'rgba(20,19,18,.97)'}; color:var(--muted)">
    <a href="#angebot" class="block py-1">Angebot</a>
    <a href="#galerie" class="block py-1">Galerie</a>
    <a href="#ueber" class="block py-1">&Uuml;ber uns</a>
    <a href="#kontakt" class="block py-1">Kontakt</a>
    <a href="tel:${d.tel}" class="btn-primary inline-flex self-start px-5 py-2.5 rounded-sm mt-1"><i class="fas fa-phone mr-2 text-xs"></i>Anrufen</a>
  </nav>
</header>

<!-- Hero -->
<section id="top" class="relative -mt-[76px]">
  <div class="hero-bg"></div>
  <div class="relative max-w-6xl mx-auto px-4 pt-44 pb-28 md:pt-56 md:pb-40">
    <div class="max-w-2xl fade-up show">
      <p class="label hero-label mb-5">${label}</p>
      <h1 class="font-display hero-text text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.08] mb-6">
        ${T.h1a}<br>
        <span class="italic ${L ? '' : 'text-accent2'}">${T.h1b}</span>
      </h1>
      <p class="hero-muted text-lg md:text-xl mb-10 max-w-xl">${heroSub}</p>
      <div class="flex flex-wrap gap-4">
        <a href="tel:${d.tel}" class="btn-primary px-8 py-3.5 rounded-sm">${CTA}</a>
        <a href="#angebot" class="hero-ghost px-8 py-3.5 rounded-sm font-medium">Unser Angebot</a>
      </div>
    </div>
  </div>
</section>

<!-- Angebot -->
<section id="angebot" class="max-w-6xl mx-auto px-4 py-20 md:py-28">
  <div class="text-center mb-14 fade-up">
    <p class="label mb-4">01 &mdash; Unser Angebot</p>
    <h2 class="font-display text-4xl md:text-5xl mb-4">Das erwartet Sie</h2>
    <div class="hairline mx-auto"></div>
  </div>
  <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">${services}
  </div>
</section>

<!-- Galerie -->
<section id="galerie" class="border-t border-b border-line" style="background:var(--panel)">
  <div class="max-w-6xl mx-auto px-4 py-20 md:py-28">
    <div class="text-center mb-14 fade-up">
      <p class="label mb-4">02 &mdash; Einblicke</p>
      <h2 class="font-display text-4xl md:text-5xl mb-4">Ein Eindruck von uns</h2>
      <div class="hairline mx-auto"></div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[160px] md:auto-rows-[200px]">${gal}
    </div>
  </div>
</section>

<!-- Über uns -->
<section id="ueber" class="max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
  <div class="fade-up">
    <p class="label mb-4">03 &mdash; &Uuml;ber uns</p>
    <h2 class="font-display text-4xl md:text-5xl mb-4">Herzlich willkommen</h2>
    <div class="hairline mx-auto mb-7"></div>
    <p class="text-lg leading-relaxed" style="color:var(--muted)">${d.ueber || heroSub}</p>${tagBadges}
  </div>
</section>

<!-- Kontakt -->
<section id="kontakt" class="border-t border-line" style="background:var(--panel)">
  <div class="max-w-6xl mx-auto px-4 py-20 md:py-28">
    <div class="text-center mb-14 fade-up">
      <p class="label mb-4">04 &mdash; Besuchen Sie uns</p>
      <h2 class="font-display text-4xl md:text-5xl mb-4">&Ouml;ffnungszeiten &amp; Kontakt</h2>
      <div class="hairline mx-auto"></div>
    </div>
    <div class="grid md:grid-cols-2 gap-6">
      <div class="card fade-up rounded-sm p-9" style="background:var(--bg)">
        <h3 class="font-display text-2xl mb-6"><i class="far fa-clock text-accent2 mr-3"></i>&Ouml;ffnungszeiten</h3>${hoursRows}
      </div>
      <div class="card fade-up d1 rounded-sm p-9" style="background:var(--bg)">
        <h3 class="font-display text-2xl mb-6"><i class="fas fa-location-dot text-accent2 mr-3"></i>Kontakt</h3>
        <ul class="space-y-4 text-sm" style="color:var(--muted)">
          ${d.address ? `<li class="flex gap-3"><i class="fas fa-map-marker-alt text-accent2 mt-1"></i>
          <span>${d.address}</span></li>` : ''}
          <li class="flex gap-3"><i class="fas fa-phone text-accent2 mt-1"></i>
            <a href="tel:${d.tel}" class="hover:text-white transition-colors">${telDisp}</a></li>${tel2Li}${emailLi}
        </ul>
        <div class="flex flex-wrap gap-4 mt-8">
          <a href="tel:${d.tel}" class="btn-primary px-6 py-3 rounded-sm inline-flex items-center">
            <i class="fas fa-phone mr-2 text-xs"></i>Jetzt anrufen</a>${mapsBtn}
        </div>
      </div>
    </div>
  </div>
</section>

${faqSection}
<!-- Footer -->
<footer class="border-t border-line" style="background:${P.footBg}">
  <div class="max-w-6xl mx-auto px-4 py-14 text-center">
    <p class="text-2xl mb-3" style="color:${L ? '#c9b184' : 'var(--accent2)'}"><i class="fas ${T.icon}"></i></p>
    <div class="font-display text-2xl mb-2" style="color:#f0ebe3">${name}</div>
    ${d.address ? `<p class="text-sm mb-2" style="color:#8b8578">${d.address}</p>` : ''}
    <p class="text-xs mt-4" style="color:${P.footText}">&copy; 2026 ${name} · Impressum · Datenschutz</p>
    <p class="text-xs mt-4" style="color:${P.footText}">
      Design-Vorschlag erstellt von <a class="underline hover:text-white" href="https://www.pexuscode.de/">Pexuscode</a>, 09557 Fl&ouml;ha
    </p>
  </div>
</footer>

<script>
  var burger = document.getElementById('burger'), mnav = document.getElementById('mobile-nav');
  if (burger) burger.addEventListener('click', function () { mnav.classList.toggle('hidden'); mnav.classList.toggle('flex'); });
  document.querySelectorAll('#mobile-nav a').forEach(function (a) {
    a.addEventListener('click', function () { mnav.classList.add('hidden'); mnav.classList.remove('flex'); });
  });
  var header = document.getElementById('site-header');
  window.addEventListener('scroll', function () {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fade-up').forEach(function (el) { io.observe(el); });
</script>
</body>
</html>
`;
}

let done = 0, problems = [];
for (const [dir, theme] of Object.entries(SITES)) {
  if (!THEMES[theme]) { problems.push(dir + ': unbekanntes Theme "' + theme + '" (siehe Kopfzeile)'); continue; }
  const file = path.join(ROOT, dir, 'index.html');
  if (!fs.existsSync(file)) { problems.push(dir + ': Ordner nicht gefunden unter m/'); continue; }
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('--tint')) { problems.push(dir + ': not the old template, skipped'); continue; }
  const d = extract(html);
  if (!d.title) { problems.push(dir + ': no title'); continue; }
  const out = render(d, theme);
  if (out.includes('undefined') || out.includes('null')) problems.push(dir + ': contains undefined/null');
  fs.writeFileSync(file, out, 'utf8');
  done++;
  console.log(`${dir} [${theme}] tel=${d.tel === PEXUS_TEL ? 'PEXUS-FALLBACK' : d.tel} hours=${d.hours.length ? d.hours.length + ' rows' : 'note'} faq=${d.faq.length} svc=${d.services.length}`);
}
console.log(`\n${done} generated. Problems: ${problems.length ? problems.join(' | ') : 'none'}`);
