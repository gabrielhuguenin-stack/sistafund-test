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

// ---------- Team carousel: filmstrip slides horizontally, next portrait peeking; seamless loop ----------
const teamSlider = document.getElementById('teamSlider');
if (teamSlider) {
  const track = document.getElementById('teamTrack');
  const real = [...track.querySelectorAll('.team-slide')];
  const capEl = document.getElementById('teamCap');
  const countEl = document.getElementById('teamCount');
  const len = real.length;
  track.appendChild(real[0].cloneNode(true));   // trailing clone for a seamless wrap
  let ti = 0, timer = null, animating = false;
  const step = () => track.children[1].getBoundingClientRect().left - track.children[0].getBoundingClientRect().left;
  const place = animate => {
    track.style.transition = animate ? '' : 'none';
    track.style.transform = `translateX(${-ti * step()}px)`;
    if (!animate) void track.offsetWidth;         // commit the jump before re-enabling transitions
  };
  const sync = () => { const r = ti % len; capEl.textContent = real[r].dataset.cap; countEl.textContent = r + 1; };
  const next = () => { if (animating) return; animating = true; ti++; place(true); sync(); };
  track.addEventListener('transitionend', () => {
    animating = false;
    if (ti >= len) { ti = 0; place(false); sync(); }
  });
  const start = () => { stop(); timer = setInterval(next, 3600); };
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  teamSlider.addEventListener('click', () => { next(); start(); });
  teamSlider.addEventListener('mouseenter', stop);
  teamSlider.addEventListener('mouseleave', start);
  window.addEventListener('resize', () => place(false));
  place(false); sync(); start();
}

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
const parPhotos = [...document.querySelectorAll('.member-photo img, .news-img img')];
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

