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
  if (p < w.enter0) return { y: 9, o: 0, b: 16 };
  if (p < w.enter1) {
    const t = easeOut((p - w.enter0) / (w.enter1 - w.enter0));
    return { y: 9 * (1 - t), o: Math.min(t * 1.7, 1), b: 16 * (1 - t) };
  }
  if (p < w.exit0) return { y: 0, o: 1, b: 0 };
  if (p < w.exit1) {
    const t = (p - w.exit0) / (w.exit1 - w.exit0);
    return { y: -7 * t, o: Math.max(1 - t * 1.5, 0), b: 14 * t };
  }
  return { y: -7, o: 0, b: 14 };
}
const euStars = document.querySelector('.eu-stars');
function renderHero(p) {
  heroItems.forEach(it => { it.style.opacity = 1; });
  heroWords.forEach(w => {
    if (!heroEntranceDone && w.exit0 < 2) return;   // arrival cascade owns these words
    const s = wordPose(w, p);
    w.inner.style.transform = `translateY(${s.y.toFixed(2)}%)`;
    w.inner.style.opacity = s.o.toFixed(3);
    w.inner.style.filter = s.b < 0.15 ? 'none' : `blur(${s.b.toFixed(2)}px)`;
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
const communitySec = document.getElementById('community');
// ---------- Walls of panels ----------
// A field of hard-edged columns, blurred into clouds by CSS, laid out from a fixed seed so
// it is the same on every visit. Nothing drifts: each panel lights as the pointer comes
// near it. The hero's ground and the thesis section are the same field, built by the same
// function and lit by the same code.
const NEAR = [250, 248, 240];                   // cream
const FAR  = [255, 248, 104];                   // #FFF868, the house yellow itself
const hex2 = n => n.toString(16).padStart(2, '0');
const toneAt = t => {
  const u = Math.min(Math.max(t, 0), 1);
  const k = u * u * (3 - 2 * u);                // flat at both ends
  return '#' + NEAR.map((a, i) => hex2(Math.round(a + (FAR[i] - a) * k))).join('');
};
const OVER = 9;                                 // generated past each edge, for the blur

// hosts: [{ el, offset }] — several frames can show one field at different heights
function makeWall(hosts, opts) {
  const main = hosts[0].el;
  let bars = [], nodes = [], last = 0;

  const build = () => {
    const holes = (opts.holes ? opts.holes() : []).filter(Boolean);
    let seed = opts.seed || 20260903;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const SPAN = opts.span || 100;
    bars = [];

    // the tone opens around whichever clearing is nearest
    const away = (x, y) => {
      if (!holes.length) return 1;
      let best = 1;
      for (const h of holes) {
        const dx = Math.max(h.x0 - x, 0, x - h.x1);
        const dy = Math.max(h.y0 - y, 0, y - h.y1) * 1.5;
        best = Math.min(best, Math.sqrt(dx * dx + dy * dy) / 46);
      }
      return Math.min(best, 1);
    };

    let x = -OVER;
    while (x < 100 + OVER) {
      const cw = 1.4 + rnd() * 2.8;             // the column's width, in % of the field
      let y = -OVER;
      while (y < SPAN + OVER) {                 // the column is filled top to bottom
        const h = Math.min(9 + rnd() * 24, SPAN + OVER - y);
        const near = Math.min(away(x + cw / 2, y + h / 2) * 1.55, 1);
        const foot = opts.fadeFoot ? Math.min((SPAN - (y + h)) / 22, 1) : 1;
        const room = Math.min(near, foot);
        // pale where the clearings are, free variation past them, so the masses fall
        // anywhere instead of piling against the edges
        const t = (room * 0.38 + rnd() * 0.62 * Math.min(room * 2.2, 1)) * (opts.rest ?? 1);
        bars.push({ x, w: cw, top: y, h, tone: toneAt(t) });
        y += h;
      }
      x += cw;
    }

    // rendered one to one: scaling the coordinates would move the frames apart and skip a
    // band of the field at the join
    hosts.forEach(({ el, offset }) => {
      el.innerHTML = bars.map(b =>
        `<span class="hero-bar" style="left:${b.x.toFixed(3)}%;width:${b.w.toFixed(3)}%;` +
        `top:${(b.top - (offset || 0)).toFixed(2)}%;height:${b.h.toFixed(2)}%;--tone:${b.tone}"></span>`
      ).join('');
    });
    nodes = hosts.map(({ el }) => [...el.querySelectorAll('.hero-bar')]);
  };
  build();
  addEventListener('load', build);
  addEventListener('resize', build, { passive: true });

  // the falloff is a wide ellipse, so the light sweeps across the field instead of sitting
  // on the cursor as a circle
  const REACH = opts.reach || 26;
  const light = (mx, my, host) => {
    for (let i = 0; i < bars.length; i++) {
      const b = bars[i];
      const dx = (b.x + b.w / 2) - mx;
      const dy = ((b.top + b.h / 2) - my) * 0.4;
      const d = Math.sqrt(dx * dx + dy * dy) / REACH;
      const k = d >= 1 ? '0' : ((1 - d) * (1 - d)).toFixed(3);
      nodes[host][i].style.setProperty('--k', k);
    }
  };
  const clear = () => nodes.forEach(list => list.forEach(n => n.style.setProperty('--k', '0')));
  const follow = e => {
    const now = performance.now();
    if (now - last < 16) return;                // one pass per frame's worth of time,
    last = now;                                 // without depending on the frame loop
    for (let hi = 0; hi < hosts.length; hi++) {
      const r = hosts[hi].el.getBoundingClientRect();
      if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
      if (e.clientY < r.top || e.clientY > r.bottom) continue;
      light(((e.clientX - r.left) / r.width) * 100,
            ((e.clientY - r.top) / r.height) * 100 + (hosts[hi].offset || 0), hi);
      return;
    }
  };
  addEventListener('pointermove', follow, { passive: true });
  addEventListener('mousemove', follow, { passive: true });
  addEventListener('mouseleave', clear, { passive: true });
  return { build };
}

// the hero's ground, carried across two screens: the first shows units 0-100, the photo
// section the next hundred, so a column cut at the join carries straight on
const heroWall = document.getElementById('heroWall');
if (heroWall) {
  const growWall = document.getElementById('growWall');
  const boxIn = (host, el, pad, offset) => {
    const wr = host.getBoundingClientRect();
    if (!wr.width || !el) return null;
    const q = el.getBoundingClientRect();
    if (!q.width) return null;
    return {
      x0: ((q.left - wr.left) / wr.width) * 100 - pad[0],
      x1: ((q.right - wr.left) / wr.width) * 100 + pad[0],
      y0: ((q.top - wr.top) / wr.height) * 100 - pad[1] + offset,
      y1: ((q.bottom - wr.top) / wr.height) * 100 + pad[1] + offset
    };
  };
  makeWall(
    [{ el: heroWall, offset: 0 }].concat(growWall ? [{ el: growWall, offset: 100 }] : []),
    {
      span: 200, fadeFoot: true,
      holes: () => {
        // the room the sentence needs, read off the type itself rather than guessed
        const stmts = [...document.querySelectorAll('.hstmt')].filter(e => e.getBoundingClientRect().width);
        let sentence = null;
        if (stmts.length) {
          const wr = heroWall.getBoundingClientRect();
          const l = Math.min(...stmts.map(e => e.getBoundingClientRect().left));
          const r = Math.max(...stmts.map(e => e.getBoundingClientRect().right));
          const t = Math.min(...stmts.map(e => e.getBoundingClientRect().top));
          const b = Math.max(...stmts.map(e => e.getBoundingClientRect().bottom));
          if (wr.width) sentence = {
            x0: ((l - wr.left) / wr.width) * 100 - 2.4, x1: ((r - wr.left) / wr.width) * 100 + 2.4,
            y0: ((t - wr.top) / wr.height) * 100 - 3.4, y1: ((b - wr.top) / wr.height) * 100 + 3.4
          };
        }
        const photo = growWall
          ? boxIn(growWall, document.getElementById('growFrame'), [-24, -26], 100)
          : null;
        return [sentence, photo];
      }
    }
  );
}

// and the thesis section stands on the same field, kept almost invisible at rest so only
// the hand brings it out
const statsWall = document.getElementById('statsWall');
if (statsWall) makeWall([{ el: statsWall, offset: 0 }],
  { seed: 71042, span: 100, rest: 0.22, reach: 20 });

function onScroll() {
  const y = window.scrollY;
  const vh = window.innerHeight;

  nav.classList.toggle('scrolled', y > (heroPin ? heroPin.offsetHeight - vh * 0.4 : 60));
  lastY = y;

  // hero: scrolling folds the headline away word by word
  if (heroPin && heroWords.length) {
    const total = heroPin.offsetHeight - vh;
    const p = clamp(y / total, 0, 1);
    renderHero(p);
    heroSection.classList.toggle('scrolled-past', p > 0.02);
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

