/* SISTAFUND — interactions */

// ---------- Intro: logo wipes in, then the whole screen rushes toward you ----------
function endIntro() {
  const intro = document.getElementById('intro');
  if (intro.classList.contains('done')) return;
  intro.classList.add('done');
  document.body.classList.add('loaded');
  setTimeout(() => {
    document.body.classList.add('nav-ready');
    intro.style.display = 'none';
  }, 1100);
}
window.addEventListener('load', () => setTimeout(endIntro, 1700));
setTimeout(endIntro, 3400); // fallback

// ---------- Custom cursor (dot on interactive elements) ----------
const cursor = document.getElementById('cursor');
if (window.matchMedia('(pointer: fine)').matches) {
  let cx = -100, cy = -100;
  document.addEventListener('mousemove', e => {
    cx = e.clientX; cy = e.clientY;
    cursor.style.left = cx + 'px';
    cursor.style.top = cy + 'px';
    const hot = e.target.closest('a, button, summary, .sector');
    document.body.classList.toggle('cursor-on', !!hot);
  }, { passive: true });
}

// ---------- Nav ----------
const nav = document.getElementById('nav');
let lastY = 0;

// ---------- Mobile menu ----------
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  burger.classList.remove('open');
  mobileMenu.classList.remove('open');
}));

// ---------- In-view observer (reveals, hl marker, CTA lines) ----------
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const siblings = [...el.parentElement.children].filter(s => s.classList.contains(el.dataset.grp || '—'));
    const idx = siblings.indexOf(el);
    if (idx > 0) el.style.transitionDelay = (idx * 90) + 'ms';
    el.classList.add('in-view');
    io.unobserve(el);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });

// ---------- Hero: scroll wipes each line up from behind a mask ----------
const heroPin = document.getElementById('heroPin');
const heroSection = document.getElementById('hero');
const heroItems = [...document.querySelectorAll('#heroStack .hstmt')];

// wrap each line's text in an inner element we can translate behind an overflow mask,
// and hand each line an enter/exit window along the scroll (staggered per line)
const heroLines = [];
heroItems.forEach((item, si) => {
  item.setAttribute('aria-label', item.textContent.trim().replace(/\s+/g, ' '));
  const spans = [...item.querySelectorAll('span')];
  spans.forEach((line, li) => {
    const text = line.textContent;
    line.setAttribute('aria-hidden', 'true');
    line.classList.add('hmask');
    line.innerHTML = `<i class="hln">${text}</i>`;
    const inner = line.firstChild;
    // statement 0 (headline): shown at rest, wipes up as you scroll.
    // statement 1 (gender-lens): wipes in later and stays.
    const enter0 = si === 0 ? -0.2 : 0.54 + li * 0.07;
    const enter1 = si === 0 ? -0.1 : enter0 + 0.12;
    const exit0  = si === 0 ? 0.40 + li * 0.05 : 2;   // >1 = never exits
    const exit1  = exit0 + 0.12;
    heroLines.push({ inner, enter0, enter1, exit0, exit1 });
  });
});

const lerp = (a, b, t) => a + (b - a) * t;
function lineY(l, p) {
  if (p < l.enter0) return 102;                              // still below the mask
  if (p < l.enter1) return lerp(102, 0, (p - l.enter0) / (l.enter1 - l.enter0));
  if (p < l.exit0)  return 0;                                // fully shown
  if (p < l.exit1)  return lerp(0, -108, (p - l.exit0) / (l.exit1 - l.exit0));
  return -108;                                               // wiped up and gone
}
function renderHero(p) {
  heroItems.forEach(it => { it.style.opacity = 1; });
  heroLines.forEach(l => { l.inner.style.transform = `translateY(${lineY(l, p)}%)`; });
}

// Section h2s: wrap each line (split on <br>) for the masked line reveal
document.querySelectorAll('.sec-head h2').forEach(h2 => {
  h2.innerHTML = h2.innerHTML.split(/<br\s*\/?>/i)
    .map(l => `<span class="rl">${l}</span>`).join('');
});

const watched = [];
document.querySelectorAll('.stat-cell, .about-photo, .about-head, .cta, .sec-head, .sector, .orbit-center')
  .forEach(el => { io.observe(el); watched.push(el); });
document.querySelectorAll('.member').forEach(el => { el.dataset.grp = 'member'; io.observe(el); watched.push(el); });
document.querySelectorAll('.news-card').forEach(el => { el.dataset.grp = 'news-card'; io.observe(el); watched.push(el); });

// Fallback: elements jumped past (fast scroll, anchor links) still reveal
function sweepMissed(vh) {
  for (let i = watched.length - 1; i >= 0; i--) {
    const el = watched[i];
    if (el.classList.contains('in-view')) { watched.splice(i, 1); continue; }
    if (el.getBoundingClientRect().bottom < vh * 0.4) {
      el.classList.add('in-view');
      io.unobserve(el);
      watched.splice(i, 1);
    }
  }
}

// ---------- Counters ----------
const countIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = +el.dataset.count;
    const decimal = el.dataset.decimal ? +el.dataset.decimal : 0;
    const dur = 1400;
    const t0 = performance.now();
    (function tick(t) {
      const p = Math.min((t - t0) / dur, 1);
      const v = target * (1 - Math.pow(1 - p, 3));
      el.textContent = decimal ? (v / 10).toFixed(1) : Math.round(v);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
    countIO.unobserve(el);
  });
}, { threshold: 0.6 });
document.querySelectorAll('.count').forEach(el => countIO.observe(el));

// ---------- About intro: one-shot word wave (same language as the hero) ----------
const aboutIntro = document.getElementById('aboutIntro');
if (aboutIntro) {
  let ai = 0;
  const wrapWords = node => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(part => {
          if (/^\s+$/.test(part) || part === '') { frag.appendChild(document.createTextNode(part)); return; }
          const wm = document.createElement('span');
          wm.className = 'wm';
          const wi = document.createElement('span');
          wi.className = 'wi';
          wi.textContent = part;
          wi.style.transitionDelay = (ai * 0.03) + 's';
          wm.appendChild(wi);
          frag.appendChild(wm);
          ai++;
        });
        node.replaceChild(frag, child);
      } else {
        wrapWords(child);
      }
    });
  };
  wrapWords(aboutIntro);
}

// ---------- Portfolio: crossing rows ----------
const pfRows = document.querySelectorAll('.pf-row');
// duplicate each row's cards so the tracks overflow wide and the opposite-direction slide is pronounced
pfRows.forEach(row => {
  const track = row.querySelector('.pf-track');
  track.querySelectorAll('.pf-card').forEach(card => {
    const clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });
});


// ---------- Community orbit ----------
const LPS = [
  ['Steve Anavi', 'Qonto', 'steve-anavi.jpg', 'fintech'],
  ['Rémi Aubert', 'AB Tasty', 'remi-aubert.png', 'saas'],
  ['Nathalie Balla', 'La Redoute', 'nathalie-balla.jpg', 'consumer'],
  ['Jonathan Benhamou', 'Resilience, PeopleDoc', 'jon-benhamou.jpg', 'health'],
  ['Amélie Berthier', 'Zadig & Voltaire', 'amelie-berthier.jpg', 'consumer'],
  ['Clément Buyse', 'PeopleDoc', 'clement-buyse.jpg', 'saas'],
  ['Nicolas Chartier', 'Aramis Group', 'nicolas-chartier.jpg', 'consumer'],
  ['Michael Chekroun', 'Carenity', 'michael-chekroun.jpg', 'health'],
  ['Valentine de Lasteyrie', 'Albingia, Fiblac', 'valentine-de-lasteyrie.jpg', 'fintech'],
  ['Alix de Sagazan', 'AB Tasty', 'alix-de-sagazan.jpg', 'saas'],
  ['Marine de Waziers', 'Pool', 'marine-de-waziers.png', 'consumer'],
  ['Alice Default', 'Double', 'alice-default.png', 'saas'],
  ['Laurent Delaporte', 'Qapa, Microsoft', 'laurent-delaporte.jpg', 'saas'],
  ['Xavier Durand', 'Aircall', 'xavier-durand.jpg', 'saas'],
  ['Fabien Grenier', 'DataDome', 'fabien-grenier.jpg', 'frontier'],
  ['Jean-Daniel Guyot', 'Memo Bank, Captain Train', 'jd-guyot.jpg', 'fintech'],
  ['Nicolas Hernandez', '360Learning', 'nicolas-hernandez.jpg', 'saas'],
  ['Céline Lazorthes', 'Resilience, Leetchi', 'celine-lazorthes.jpg', 'fintech'],
  ['Constance Nevoret', 'LittleBig Connection', 'constance-nevoret.jpg', 'saas'],
  ['Xavier Niel', 'Free', 'xavier-niel.png', 'frontier'],
  ['Adrien Nussenbaum', 'Mirakl', 'adrien-nussenbaum.jpg', 'saas'],
  ['Philippe Oddo', 'ODDO BHF', 'phillippe-oddo.jpg', 'fintech'],
  ['Stéphane Pallez', 'Française des Jeux', 'stephane-pallez.jpg', 'consumer'],
  ['Nicolas Reboud', 'Shine', 'nicolas-reboud.jpg', 'fintech'],
  ['Cédric Sellin', 'Yogiplay, Oracle', 'cedric-sellin.jpg', 'saas'],
  ['Xavier Zeitoun', 'Zenchef', 'xavier-zeitoun.png', 'saas'],
  ['Frank Zorn', 'Deskeo', 'frank-zorn.jpg', 'consumer'],
];

const ringA = document.getElementById('ringA');
const ringB = document.getElementById('ringB');
const ringAItems = [], ringBItems = [];
LPS.slice(0, 8).forEach(lp => ringAItems.push(makeOrbitItem(lp, ringA)));
LPS.slice(8, 20).forEach(lp => ringBItems.push(makeOrbitItem(lp, ringB)));

function makeOrbitItem(lp, ring) {
  const d = document.createElement('div');
  d.className = 'orbit-item';
  const org = lp[1].split(',')[0].trim();   // short company label under the portrait
  d.innerHTML = `<span class="orbit-photo"><img src="img/community/${lp[2]}" alt="${lp[0]}"></span><span class="orbit-org">${org}</span>`;
  ring.appendChild(d);
  return d;
}

function layoutOrbit(rotation, appear = 1) {
  const orbit = document.getElementById('orbit');
  const W = orbit.clientWidth, H = orbit.clientHeight;
  const vmin = Math.min(W, H);
  const size = Math.max(64, vmin * 0.12);          // bigger portraits, constant size
  // outer ring fits inside the section, leaving room for the company caption below
  const rB = Math.min(W, H) / 2 - size * 0.8 - 26;
  const rA = rB * 0.62;
  const pop = i => clamp(appear * 3.2 - i * 0.14, 0, 1);   // portraits fade in one by one
  ringAItems.forEach((el, i) => {
    const a = rotation + (i / ringAItems.length) * 360;
    el.style.setProperty('--size', size + 'px');
    el.style.opacity = pop(i);
    el.style.transform = `rotate(${a}deg) translateX(${rA}px) rotate(${-a}deg)`;
  });
  ringBItems.forEach((el, i) => {
    const a = -rotation * 0.7 + (i / ringBItems.length) * 360 + 15;
    el.style.setProperty('--size', size * 0.85 + 'px');
    el.style.opacity = pop(i + 4);
    el.style.transform = `rotate(${a}deg) translateX(${rB}px) rotate(${-a}deg)`;
  });
}

// ---------- Scroll loop ----------
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const aboutImg = document.getElementById('aboutImg');
const communitySec = document.getElementById('community');
const commPinEl = document.getElementById('commPin');

function onScroll() {
  const y = window.scrollY;
  const vh = window.innerHeight;

  nav.classList.toggle('scrolled', y > 60);
  lastY = y;

  // hero: scrolling wipes each headline line up from behind its mask
  if (heroPin && heroLines.length) {
    const total = heroPin.offsetHeight - vh;
    const p = clamp(y / total, 0, 1);
    renderHero(p);
    heroSection.classList.toggle('scrolled-past', p > 0.02);
  }

  // about photo parallax
  if (aboutImg) {
    const r = aboutImg.parentElement.getBoundingClientRect();
    if (r.bottom > 0 && r.top < vh) {
      const p = (vh - r.top) / (vh + r.height);
      aboutImg.style.transform = `translateY(${(p - 0.5) * -14}%)`;
    }
  }

  // portfolio crossing rows
  pfRows.forEach((row, i) => {
    const r = row.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) return;
    const track = row.querySelector('.pf-track');
    const overflow = Math.max(track.scrollWidth - row.clientWidth, 0);
    const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
    const x = i % 2 === 0 ? -overflow * p : -overflow * (1 - p);
    track.style.transform = `translateX(${x}px)`;
  });

  // community: held on screen while the orbit assembles, then keeps turning
  if (commPinEl) {
    const r = commPinEl.getBoundingClientRect();
    if (r.bottom > 0 && r.top < vh) {
      const total = commPinEl.offsetHeight - vh;
      const p = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
      layoutOrbit(p * 300, p);
    }
  }

  sweepMissed(vh);
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });
onScroll();

// ---------- Overlays ----------
function openOverlay(el) {
  el.classList.add('open');
  el.setAttribute('aria-hidden', 'false');
  document.body.classList.add('locked');
}
function closeOverlay(el) {
  el.classList.remove('open');
  el.setAttribute('aria-hidden', 'true');
  if (!document.querySelector('.overlay.open')) document.body.classList.remove('locked');
}
document.querySelectorAll('[data-close]').forEach(b =>
  b.addEventListener('click', () => closeOverlay(b.closest('.overlay'))));
document.querySelectorAll('.overlay').forEach(o => o.addEventListener('click', e => {
  if (e.target === o) closeOverlay(o);
}));
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const open = [...document.querySelectorAll('.overlay.open')];
  if (open.length) closeOverlay(open[open.length - 1]);
});

document.getElementById('openManifesto').addEventListener('click', () =>
  openOverlay(document.getElementById('manifestoOverlay')));

// Community overlay: build full LP grid once
const lpGrid = document.getElementById('lpGrid');
LPS.forEach(([name, org, file, sector], i) => {
  const d = document.createElement('div');
  d.className = 'lp';
  d.dataset.sector = sector;
  d.style.transitionDelay = (i * 30) + 'ms';
  d.innerHTML = `<div class="lp-photo"><img src="img/community/${file}" alt="${name}" loading="lazy"></div>
    <span class="lp-name">${name}</span><span class="lp-org">${org}</span>`;
  lpGrid.appendChild(d);
});
document.getElementById('openCommunity').addEventListener('click', () =>
  openOverlay(document.getElementById('communityOverlay')));

// Community filters (sectors + institutions)
const lpInstitutions = document.getElementById('lpInstitutions');
document.getElementById('lpFilters').addEventListener('click', e => {
  const btn = e.target.closest('.filter');
  if (!btn) return;
  document.querySelectorAll('#lpFilters .filter').forEach(f => f.classList.remove('active'));
  btn.classList.add('active');
  const f = btn.dataset.filter;
  lpInstitutions.hidden = f !== 'institutions';
  lpGrid.style.display = f === 'institutions' ? 'none' : '';
  if (f !== 'institutions') {
    lpGrid.querySelectorAll('.lp').forEach((d, i) => {
      const show = f === 'all' || d.dataset.sector === f;
      d.style.display = show ? '' : 'none';
      d.style.transitionDelay = '0ms';
    });
  }
});


// ---------- Portfolio modal ----------
const COMPANIES = {
  pave: ['Pave Space', 'Frontier Tech', 'pave.png', 'Heavy kickstage to unlock orbital logistics.', 'Julie Böhning, Jérémy Marciacq', 'Vaud (CH), 2023'],
  waiv: ['Waiv', 'HealthTech', 'waiv.png', 'Accelerating AI-enabled precision oncology testing.', 'Meriem Sefta, Lionel Guillou', 'Paris, 2025'],
  recupere: ['Recupere Metals', 'Sustainability', 'recupere.png', 'Patented mechanical process producing electrical-grade copper wire from 100% recycled scrap.', 'Katie Marsh, Julien Vaïssette', 'Paris, 2025'],
  tec: ['The Exploration Company', 'Frontier Tech', 'tec.png', 'Democratizing space exploration, making it affordable, sustainable and open, for space & non-space industries.', 'Hélène Huby & co-founders', 'Bordeaux, 2021'],
  numi: ['Nūmi', 'HealthTech', 'numi.jpg', 'Developing in vivo breast milk, in vitro.', 'Eden Banon-Lagrange, Eugénie Pezé-Heidsieck', 'Paris, 2023'],
  orakl: ['Orakl Oncology', 'HealthTech', 'orakl.png', 'Accelerating drug discovery in oncology.', 'Fanny Jaulin, Diane-Laure Pagès, Gustave Ronteix', 'Paris, 2023'],
  femaleinvest: ['Female Invest', 'Fintech', 'femaleinvest.webp', 'On a mission to close the financial gender gap, democratizing investing for everyone, globally.', 'A.-S. Hartvigsen, C. Falkenberg, E. Due Bitz', 'Copenhagen, 2021'],
  underdog: ['Underdog', 'Sustainability', 'underdog.png', 'Full-stack solution for refurbished household appliances, structuring the circular economy in Europe.', 'Claire Bretton, Laura Chavigny, Mathieu Maure', 'Nantes / Paris, 2022'],
  astran: ['Astran', 'Frontier Tech', 'astran.png', 'Zero Trust cloud storage solution for sensitive data.', 'Yosra Jarraya, Gilles Seghaier, Yahya Jarraya', 'Paris, 2021'],
  mallow: ['Mallow', 'Frontier Tech', 'mallow.png', 'Educational toys for children at the intersection of cognitive science and AI.', 'Flore Cousin, Cédric O', 'Paris, 2024'],
  vizzia: ['Vizzia', 'Sustainability', 'vizzia.png', 'Leveraging computer vision and AI to detect illegal waste dumping.', 'Katrin de Proyart, Alexandre Leboucher', 'Paris, 2022'],
  optimiz: ['Optimiz Construction', 'Sustainability', 'optimiz.png', 'Helping construction firms optimize materials to save time, money and CO₂.', 'Marion Malandain', 'Paris, 2020'],
  notom: ['NOTOM', 'Frontier Tech', 'notom.png', 'Bridging OT & IT through AI-driven reindustrialisation in factories.', 'Paola Fedou, Jean-Philippe Gross', 'Paris, 2025'],
  stealth: ['Stealth', 'Frontier Tech', 'stealth.png', 'Unlocking Ocean Intelligence.', '', 'UK, 2022'],
  stealth2: ['Stealth 2', 'HealthTech', 'stealth2.png', 'Gut Health Monitoring.', '', 'UK, 2026'],
};

const pfModal = document.getElementById('pfModal');
const pfDetail = document.getElementById('pfDetail');
function showCompany(key) {
  const c = COMPANIES[key];
  if (!c) return;
  pfDetail.innerHTML = `
    <div class="pf-detail-logo"><img src="img/logos/${c[2]}" alt="${c[0]}"></div>
    <div class="pf-detail-body">
      <span class="pf-detail-tag">${c[1]}</span>
      <h3>${c[0]}</h3>
      <p>${c[3]}</p>
      <div class="pf-detail-meta"><span>${c[4]}</span><span>${c[5]}</span></div>
    </div>`;
  openOverlay(pfModal);
}
document.querySelectorAll('.pf-card').forEach(card =>
  card.addEventListener('click', () => showCompany(card.dataset.co)));

// ---------- Portfolio overlay: full filterable grid ----------
const pfAllGrid = document.getElementById('pfAllGrid');
Object.entries(COMPANIES).forEach(([key, c]) => {
  const b = document.createElement('button');
  b.className = 'pf-all-card';
  b.dataset.sector = c[1];
  b.dataset.co = key;
  b.innerHTML = `<span class="pf-logo"><img src="img/logos/${c[2]}" alt="${c[0]}" loading="lazy"></span>
    <span class="pf-name">${c[0]}</span><span class="pf-sector">${c[1]}</span>`;
  pfAllGrid.appendChild(b);
});
document.getElementById('openPortfolio').addEventListener('click', () =>
  openOverlay(document.getElementById('portfolioOverlay')));
document.getElementById('pfFilters').addEventListener('click', e => {
  const btn = e.target.closest('.filter');
  if (!btn) return;
  document.querySelectorAll('#pfFilters .filter').forEach(f => f.classList.remove('active'));
  btn.classList.add('active');
  const f = btn.dataset.filter;
  pfAllGrid.querySelectorAll('.pf-all-card').forEach(card => {
    card.style.display = (f === 'all' || card.dataset.sector === f) ? '' : 'none';
  });
});
pfAllGrid.addEventListener('click', e => {
  const card = e.target.closest('.pf-all-card');
  if (card) showCompany(card.dataset.co);
});
