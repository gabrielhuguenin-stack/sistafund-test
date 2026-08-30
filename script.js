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

// ---------- FAQ: built from the site's own wording, first four then a fold ----------
const faqList = document.getElementById('faqList');
const faqListMore = document.getElementById('faqListMore');
if (faqList && window.FAQ) {
  const FAQ_VISIBLE = 4;
  window.FAQ.forEach(([q, a], i) => {
    const d = document.createElement('details');
    d.className = 'faq-item';
    const s = document.createElement('summary');
    s.append(document.createTextNode(q));
    const x = document.createElement('span'); x.className = 'faq-x'; x.textContent = '+';
    s.appendChild(x);
    const p = document.createElement('p'); p.textContent = a;
    d.append(s, p);
    (i < FAQ_VISIBLE ? faqList : faqListMore).appendChild(d);
  });
}

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
  [...item.querySelectorAll('.hline')].forEach(line => {
    const hi = (line.dataset.hi || '').toLowerCase();
    const parts = line.textContent.trim().split(/\s+/);
    line.textContent = '';
    line.setAttribute('aria-hidden', 'true');
    parts.forEach((w, k) => {
      if (k) line.appendChild(document.createTextNode(' '));
      const m = document.createElement('span'); m.className = 'hmask';
      const inner = document.createElement('i'); inner.className = 'hln';
      // the pivotal word of the line gets the yellow treatment
      if (hi && w.toLowerCase().replace(/[^a-z-]/g, '') === hi) inner.classList.add('hw-hi');
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
s0Words.forEach(w => { w.inner.style.transform = 'translateY(150%) rotate(5deg)'; });
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
  if (p < w.enter0) return { y: 150, r: 5 };                 // still below the mask
  if (p < w.enter1) {
    const t = easeOut((p - w.enter0) / (w.enter1 - w.enter0));
    return { y: 150 * (1 - t), r: 5 * (1 - t) };             // rises and settles straight
  }
  if (p < w.exit0) return { y: 0, r: 0 };
  if (p < w.exit1) {
    const t = (p - w.exit0) / (w.exit1 - w.exit0);
    return { y: -150 * t, r: -4 * t };                        // folds up and away
  }
  return { y: -150, r: -4 };
}
const euStars = document.querySelector('.eu-stars');
function renderHero(p) {
  heroItems.forEach(it => { it.style.opacity = 1; });
  heroWords.forEach(w => {
    if (!heroEntranceDone && w.exit0 < 2) return;   // arrival cascade owns these words
    const s = wordPose(w, p);
    w.inner.style.transform = `translateY(${s.y.toFixed(2)}%) rotate(${s.r.toFixed(2)}deg)`;
  });
  // the stars only surface as the gender-lens claim assembles
  if (euStars) {
    const t = Math.min(Math.max((p - 0.62) / 0.24, 0), 1);
    euStars.style.opacity = (t * 0.24).toFixed(3);
  }
}

// Section h2s: wrap each line (split on <br>) for the masked line reveal
document.querySelectorAll('.sec-head h2').forEach(h2 => {
  h2.innerHTML = h2.innerHTML.split(/<br\s*\/?>/i)
    .map(l => `<span class="rl">${l}</span>`).join('');
});

const watched = [];
document.querySelectorAll('.about-photo, .about-head, .cta, .sec-head, .sector, .comm-say')
  .forEach(el => { io.observe(el); watched.push(el); });
// the fund band: each term arrives just after the one to its left
document.querySelectorAll('.stat-item').forEach((el, i) => {
  el.style.transitionDelay = (i * 0.11) + 's';
  io.observe(el); watched.push(el);
});
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
const PF_TRAVEL = 0.36;   // share of the track's overflow crossed per screen of scroll
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


// ---------- Community mosaic ----------
// The grid is drawn empty, then fills: portraits drop into their cells in diagonal
// waves as the section crosses the screen. Same idea as the rest of the page — the
// structure exists first, the content arrives into it.
const LPS = window.LPS || [];
const commMosaic = document.getElementById('commMosaic');
const commCells = [];
LPS.forEach(([name, org, file]) => {
  const d = document.createElement('div');
  d.className = 'comm-cell';
  d.innerHTML = `<img src="img/community/${file}" alt="${name}" loading="lazy">` +
    `<span class="comm-tag"><b>${name}</b><i>${org}</i></span>`;
  commMosaic.appendChild(d);
  commCells.push(d);
});

// the order of arrival is read off the grid itself, so it holds at every breakpoint:
// a wave running from the top left corner down to the bottom right
let commOrder = [];
// square rows, measured rather than guessed: a percentage would resolve against nothing
function sizeCommCells() {
  if (!commMosaic) return;
  const cols = getComputedStyle(commMosaic).gridTemplateColumns.split(' ').length;
  const w = commMosaic.clientWidth - 3;              // the 1.5px rule on each edge
  const cell = (w - (cols - 1) * 1.5) / cols;
  // measured before layout the width reads zero: leave the CSS fallback rather than
  // writing a negative row height, which would flatten the whole grid
  if (cell > 20) commMosaic.style.setProperty('--cell', cell.toFixed(2) + 'px');
}
function orderCommCells() {
  sizeCommCells();
  const boxes = commCells.map(el => ({ el, r: el.getBoundingClientRect() }));
  const rows = [...new Set(boxes.map(b => Math.round(b.r.top)))].sort((a, b) => a - b);
  const cols = [...new Set(boxes.map(b => Math.round(b.r.left)))].sort((a, b) => a - b);
  boxes.forEach(b => {
    const row = rows.indexOf(Math.round(b.r.top));
    const col = cols.indexOf(Math.round(b.r.left));
    // odd rows come in from the left, even rows from the right, and every row advances at
    // the same pace: two fronts crossing, as the portfolio rows do
    const left = row % 2 === 0;
    b.el.style.setProperty('--from', left ? '-101%' : '101%');
    b.k = (left ? col : cols.length - 1 - col) * 10 + row;
  });
  commOrder = boxes.sort((a, b) => a.k - b.k).map(b => b.el);
}
let commFilled = -1;
function fillCommunity(p) {
  const n = Math.round(p * commOrder.length);
  if (n === commFilled) return;
  commFilled = n;
  commOrder.forEach((el, i) => el.classList.toggle('is-in', i < n));
}

// ---------- Scroll loop ----------
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const growPin = document.getElementById('growPin');
const growFrame = document.getElementById('growFrame');
const growImg = document.getElementById('growImg');
const growDim = document.getElementById('growDim');
const growCopy = document.getElementById('growCopy');
const parPhotos = [...document.querySelectorAll('.member-photo img, .news-img img')];
const heroLemon = document.getElementById('heroLemon');
const lemonAccents = [...document.querySelectorAll('.lemon-accent')];
const communitySec = document.getElementById('community');
// ---------- Thesis deck ----------
// the same book the dedicated pages open on, turned by the scroll instead of the arrows
const thesisDeck = document.getElementById('thesisDeck');
const tleaves = thesisDeck ? [...thesisDeck.querySelectorAll('.tleaf')] : [];
let tOpen = -1;
function turnThesis(k) {
  const n = tleaves.length;
  if (k === tOpen || k < 0 || k >= n) return;
  tOpen = k;
  tleaves.forEach((el, i) => {
    // the stack reads as what is still to come
    const place = (i - k + n) % n;
    el.classList.toggle('is-open', place === 0);
    el.classList.toggle('is-shut', place !== 0);
    el.style.setProperty('--p', place - 1);
  });
}
if (thesisDeck) {
  thesisDeck.querySelectorAll('[data-tstep]').forEach(b => {
    b.addEventListener('click', () => {
      const n = tleaves.length;
      turnThesis((tOpen + +b.dataset.tstep + n) % n);
    });
  });
  // a closed card can also be opened by clicking its spine
  tleaves.forEach((el, i) => el.addEventListener('click', () => {
    if (el.classList.contains('is-shut')) turnThesis(i);
  }));
}
if (tleaves.length) turnThesis(0);

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
  }

  // the group photo opens from a small frame to the full screen, then the
  // statement fades up over it — the sequence is entirely scroll-driven
  if (growPin && growFrame) {
    const r = growPin.getBoundingClientRect();
    const total = growPin.offsetHeight - vh;
    const p = clamp(-r.top / total, 0, 1);
    const ease = t => t * t * (3 - 2 * t);

    const open = ease(clamp(p / 0.52, 0, 1));                 // frame opens
    const iv = (1 - open) * 30, ih = (1 - open) * 27;
    growFrame.style.clipPath = `inset(${iv.toFixed(2)}% ${ih.toFixed(2)}%)`;
    // The opening window is the middle band of the screen, and left alone it lands on
    // their torsos: the faces sit at 20-31% of this picture. So the picture rides down
    // at the start and settles as the frame grows. Translate after scale, so the shift
    // is read in the frame's own space and not multiplied by the zoom.
    const ride = (1 - open) * 22;
    growImg.style.transform = `translateY(${ride.toFixed(2)}%) scale(${(1.18 - open * 0.18).toFixed(3)})`;

    const t = ease(clamp((p - 0.5) / 0.26, 0, 1));            // then it dims and speaks
    growDim.style.opacity = (t * 0.66).toFixed(3);
    growCopy.style.opacity = t.toFixed(3);
    growCopy.style.transform = `translateY(${((1 - t) * 3).toFixed(2)}vh)`;
    growCopy.classList.toggle('on', t > 0.6);
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
    // only a share of the overflow is travelled: the same crossing, far calmer
    const overflow = Math.max(track.scrollWidth - row.clientWidth, 0) * PF_TRAVEL;
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

  // community: the grid fills as the section crosses the screen
  if (commMosaic) {
    if (!commOrder.length) orderCommCells();
    const r = commMosaic.getBoundingClientRect();
    const p = clamp((vh * 0.9 - r.top) / (vh * 0.95 + r.height), 0, 1);
    fillCommunity(p);
  }

  sweepMissed(vh);
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', () => { commOrder = []; commFilled = -1; onScroll(); }, { passive: true });
addEventListener('load', () => { commOrder = []; onScroll(); });
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
      <div class="pf-detail-meta">
        ${c[4] ? `<div class="pf-fact"><span class="pf-fact-k">Founder(s)</span><span class="pf-fact-v">${c[4]}</span></div>` : ''}
        ${c[5] ? `<div class="pf-fact"><span class="pf-fact-k">Location(s)</span><span class="pf-fact-v">${c[5]}</span></div>` : ''}
        ${c[6] ? `<div class="pf-fact"><span class="pf-fact-k">Founded</span><span class="pf-fact-v">${c[6]}</span></div>` : ''}
        ${c[7] ? `<div class="pf-fact"><span class="pf-fact-k">Partnered</span><span class="pf-fact-v">${c[7]}</span></div>` : ''}
      </div>
    </div>`;
  openOverlay(pfModal);
}
document.querySelectorAll('.pf-card').forEach(card =>
  card.addEventListener('click', () => showCompany(card.dataset.co)));

