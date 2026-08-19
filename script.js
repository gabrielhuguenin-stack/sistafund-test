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

// ---------- FAQ: reveal the rest of the questions on demand ----------
const faqToggle = document.getElementById('faqToggle');
const faqMore = document.getElementById('faqMore');
if (faqToggle && faqMore) {
  const label = faqToggle.querySelector('.faq-toggle-label');
  faqToggle.addEventListener('click', () => {
    const open = faqMore.classList.toggle('open');
    faqToggle.classList.toggle('open', open);
    faqToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    label.textContent = open ? 'Show fewer questions' : 'Show all questions';
  });
}

// ---------- Team scatter: prints fan out of a pile onto the table as you scroll ----------
const teamScatter = document.getElementById('teamScatter');
const scatterPrints = teamScatter ? [...teamScatter.querySelectorAll('.ts-print')] : [];
// Resting place of each print on the table: left/top in %, rotation, width, layer.
// Reading order is carried by the layering and a slight size taper — Tatiana sits
// on top and largest, Gabriel underneath — while their spots on the table stay put.
// Rows are spaced so prints only ever overlap on their blank top margin —
// never on a face — while the layering keeps the reading order.
const SCATTER = [
  { x:  0, y:  0, r: -6, w: 43, z: 10 },   // Tatiana
  { x: 53, y:  4, r:  5, w: 42, z:  9 },   // Marie
  { x:  4, y: 30, r:  3, w: 42, z:  8 },   // Natacha
  { x: 55, y: 34, r: -5, w: 41, z:  7 },   // Arthur
  { x:  1, y: 60, r:  6, w: 41, z:  6 },   // Timothée
  { x: 54, y: 64, r: -3, w: 41, z:  5 },   // Gabriel
];
scatterPrints.forEach((p, i) => {
  const t = SCATTER[i];
  p.style.left = t.x + '%'; p.style.top = t.y + '%';
  p.style.width = t.w + '%'; p.style.zIndex = t.z;
});

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

// every WORD gets its own mask; scrolling folds the headline away word by word
// while the second statement assembles itself the same way, each word settling
// from a slight tilt — a cascade rather than a block wipe
const heroWords = [];
heroItems.forEach((item, si) => {
  item.setAttribute('aria-label', item.textContent.trim().replace(/\s+/g, ' '));
  const words = [];
  [...item.querySelectorAll('span')].forEach(line => {
    const parts = line.textContent.split(' ');
    line.textContent = '';
    line.setAttribute('aria-hidden', 'true');
    parts.forEach((w, k) => {
      if (k) line.appendChild(document.createTextNode(' '));
      const m = document.createElement('span'); m.className = 'hmask';
      const inner = document.createElement('i'); inner.className = 'hln';
      inner.textContent = w;
      m.appendChild(inner); line.appendChild(m);
      words.push(inner);
    });
  });
  const W = Math.max(words.length - 1, 1);
  words.forEach((inner, j) => {
    const f = j / W;
    // statement 0: on show at rest, folds away 0.30 → 0.56 in cascade.
    // statement 1: assembles 0.58 → 0.90, then stays.
    const enter0 = si === 0 ? -0.2 : 0.58 + f * 0.18;
    const enter1 = si === 0 ? -0.1 : enter0 + 0.12;
    const exit0  = si === 0 ? 0.30 + f * 0.16 : 2;
    const exit1  = exit0 + 0.10;
    heroWords.push({ inner, enter0, enter1, exit0, exit1 });
  });
});

// on arrival (once the intro clears) the headline assembles itself word by word
let heroEntranceDone = false;
const s0Words = heroWords.filter(w => w.exit0 < 2);
s0Words.forEach(w => { w.inner.style.transform = 'translateY(108%) rotate(5deg)'; });
setTimeout(() => {
  s0Words.forEach((w, j) => {
    w.inner.style.transition = `transform .9s cubic-bezier(.22,1,.36,1) ${j * 75}ms`;
    w.inner.style.transform = 'translateY(0%) rotate(0deg)';
  });
  setTimeout(() => {
    s0Words.forEach(w => { w.inner.style.transition = ''; });
    heroEntranceDone = true;
    onScroll();
  }, 950 + s0Words.length * 75);
}, 1900);

const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = t => 1 - Math.pow(1 - t, 3);
function wordPose(w, p) {
  if (p < w.enter0) return { y: 108, r: 5 };                 // still below the mask
  if (p < w.enter1) {
    const t = easeOut((p - w.enter0) / (w.enter1 - w.enter0));
    return { y: 108 * (1 - t), r: 5 * (1 - t) };             // rises and settles straight
  }
  if (p < w.exit0) return { y: 0, r: 0 };
  if (p < w.exit1) {
    const t = (p - w.exit0) / (w.exit1 - w.exit0);
    return { y: -112 * t, r: -4 * t };                        // folds up and away
  }
  return { y: -112, r: -4 };
}
function renderHero(p) {
  heroItems.forEach(it => { it.style.opacity = 1; });
  heroWords.forEach(w => {
    if (!heroEntranceDone && w.exit0 < 2) return;   // arrival cascade owns these words
    const s = wordPose(w, p);
    w.inner.style.transform = `translateY(${s.y.toFixed(2)}%) rotate(${s.r.toFixed(2)}deg)`;
  });
}

// Section h2s: wrap each line (split on <br>) for the masked line reveal
document.querySelectorAll('.sec-head h2').forEach(h2 => {
  h2.innerHTML = h2.innerHTML.split(/<br\s*\/?>/i)
    .map(l => `<span class="rl">${l}</span>`).join('');
});

const watched = [];
document.querySelectorAll('.stat-cell, .about-photo, .about-head, .cta, .sec-head, .sector, .orbit-center, .team-intro-text')
  .forEach(el => { io.observe(el); watched.push(el); });
document.querySelectorAll('.member').forEach(el => { el.dataset.grp = 'member'; io.observe(el); watched.push(el); });
document.querySelectorAll('.about-col').forEach(el => { el.dataset.grp = 'about-col'; io.observe(el); watched.push(el); });
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
const LPS = window.LPS || [];

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
  // portraits ease in one by one and settle onto their ring; the whole
  // constellation then keeps drifting, slowly, with the scroll
  const ease = t => t * t * (3 - 2 * t);
  const pop = i => ease(clamp(appear * 2.6 - i * 0.11, 0, 1));
  ringAItems.forEach((el, i) => {
    const a = rotation + (i / ringAItems.length) * 360;
    const t = pop(i);
    el.style.setProperty('--size', size + 'px');
    el.style.opacity = t;
    el.style.transform = `rotate(${a}deg) translateX(${rA * (0.92 + 0.08 * t)}px) rotate(${-a}deg)`;
  });
  ringBItems.forEach((el, i) => {
    const a = -rotation * 0.6 + (i / ringBItems.length) * 360 + 15;
    const t = pop(i + 4);
    el.style.setProperty('--size', size * 0.85 + 'px');
    el.style.opacity = t;
    el.style.transform = `rotate(${a}deg) translateX(${rB * (0.92 + 0.08 * t)}px) rotate(${-a}deg)`;
  });
}

// ---------- Scroll loop ----------
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const aboutImg = document.getElementById('aboutImg');
const parPhotos = [...document.querySelectorAll('.member-photo img, .news-img img')];
const heroLemon = document.getElementById('heroLemon');
const lemonAccents = [...document.querySelectorAll('.lemon-accent')];
const communitySec = document.getElementById('community');
const commPinEl = document.getElementById('commPin');

function onScroll() {
  const y = window.scrollY;
  const vh = window.innerHeight;

  nav.classList.toggle('scrolled', y > 60);
  lastY = y;

  // hero: scrolling folds the headline away word by word
  if (heroPin && heroWords.length) {
    const total = heroPin.offsetHeight - vh;
    const p = clamp(y / total, 0, 1);
    renderHero(p);
    heroSection.classList.toggle('scrolled-past', p > 0.02);
    // the lemons rise and turn gently across the hero's scroll
    if (heroLemon) {
      heroLemon.style.transform =
        `translate3d(${(-p * 4).toFixed(2)}vw, ${(-p * 18).toFixed(2)}vh, 0) rotate(${(-6 + p * 16).toFixed(1)}deg)`;
    }
    const pct = document.getElementById('heroPct');
    if (pct) pct.textContent = Math.round(y / (document.documentElement.scrollHeight - vh) * 100);
  }

  // team prints: dealt out of a single pile one by one, then left drifting gently
  if (teamScatter && scatterPrints.length) {
    const r = teamScatter.getBoundingClientRect();
    if (r.bottom > -120 && r.top < vh + 120) {
      const p = clamp((vh - r.top) / (vh * 0.95), 0, 1);
      const ease = t => t * t * (3 - 2 * t);
      scatterPrints.forEach((el, i) => {
        const tg = SCATTER[i];
        const t = ease(clamp(p * 1.75 - i * 0.1, 0, 1));       // dealt in order
        // travel from the middle of the pile to its place on the table
        const dx = r.width * ((26 - tg.x) / 100) * (1 - t);
        const dy = r.height * ((26 - tg.y) / 100) * (1 - t);
        // once settled, each print keeps breathing at its own pace
        const drift = (p - 0.5) * (i % 2 ? -9 : 7) * t;
        const rot = tg.r * t + (1 - t) * (i % 2 ? 9 : -9);      // untwists as it lands
        el.style.transform =
          `translate(${dx.toFixed(1)}px, ${(dy + drift).toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${(0.86 + 0.14 * t).toFixed(3)})`;
        el.style.opacity = Math.min(1, t * 2.4);
      });
    }
  }

  // about photo parallax
  if (aboutImg) {
    const r = aboutImg.parentElement.getBoundingClientRect();
    if (r.bottom > 0 && r.top < vh) {
      const p = (vh - r.top) / (vh + r.height);
      aboutImg.style.transform = `translateY(${(p - 0.5) * -14}%)`;
    }
  }

  // scattered lemons drift a touch out of step with the page
  lemonAccents.forEach(a => {
    const r = a.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const p = (vh - r.top) / (vh + r.height);
    a.style.transform = `translateY(${((p - 0.5) * +a.dataset.lspeed).toFixed(2)}vh)`;
  });

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

  // photos: image drifts slower than its frame (internal parallax), staying within the overflow
  parPhotos.forEach(img => {
    const r = img.parentElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
    img.style.setProperty('--py', (-2 - p * 12).toFixed(2) + '%');
  });

  // community: held on screen while the orbit assembles, then keeps turning
  if (commPinEl) {
    const r = commPinEl.getBoundingClientRect();
    if (r.bottom > 0 && r.top < vh) {
      const total = commPinEl.offsetHeight - vh;
      const p = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
      layoutOrbit(p * 26, p);
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

// ---------- Portfolio modal ----------
const COMPANIES = window.COMPANIES || {};

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

