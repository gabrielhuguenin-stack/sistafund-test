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
    const arrow = faqToggle.querySelector('.btn-arrow');
    if (arrow) arrow.innerHTML = open ? '&uarr;' : '&darr;';
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
    // The first statement leaves early so the second has room to take its time:
    // it folds away 0.22 → 0.50, and the second assembles 0.46 → 0.88. Each word of the
    // second gets 0.30 of the hero's travel to come out of the ground — the arrival is the
    // slower of the two movements, because that is the one being read.
    const enter0 = si === 0 ? -0.2 : 0.46 + f * 0.12;
    const enter1 = si === 0 ? -0.1 : enter0 + 0.3;
    const exit0  = si === 0 ? 0.22 + f * 0.1 : 2;
    const exit1  = exit0 + 0.18;
    heroWords.push({ inner, enter0, enter1, exit0, exit1 });
  });
});

// on arrival (once the intro clears) the headline assembles itself word by word
let heroEntranceDone = false;
const s0Words = heroWords.filter(w => w.exit0 < 2);
s0Words.forEach(w => { w.inner.style.transform = 'translateY(150%) rotate(5deg)'; });
setTimeout(() => {
  s0Words.forEach((w, j) => {
    w.inner.style.transition = `transform 1.1s cubic-bezier(.22,1,.36,1) ${j * 85}ms,` +
      ` opacity 1.1s cubic-bezier(.22,1,.36,1) ${j * 85}ms,` +
      ` filter 1.1s cubic-bezier(.22,1,.36,1) ${j * 85}ms`;
    w.inner.style.transform = 'translateY(0%)';
    w.inner.style.opacity = '1';
    w.inner.style.filter = 'none';
  });
  setTimeout(() => {
    s0Words.forEach(w => { w.inner.style.transition = ''; });
    heroEntranceDone = true;
    onScroll();
  }, 1150 + s0Words.length * 85);
}, 1900);

const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = t => 1 - Math.pow(1 - t, 3);
// flat at both ends: a word does not start moving abruptly and does not stop abruptly.
// An ease-out alone left a jolt at the first frame of an arrival, which read as a snap.
const smooth = t => t * t * (3 - 2 * t);
function wordPose(w, p) {
  if (p < w.enter0) return { y: 5, o: 0, b: 7 };
  if (p < w.enter1) {
    const t = smooth((p - w.enter0) / (w.enter1 - w.enter0));
    return { y: 5 * (1 - t), o: t, b: 7 * (1 - t) };
  }
  if (p < w.exit0) return { y: 0, o: 1, b: 0 };
  if (p < w.exit1) {
    const t = smooth((p - w.exit0) / (w.exit1 - w.exit0));
    return { y: -4 * t, o: 1 - t, b: 6.5 * t };
  }
  return { y: -4, o: 0, b: 6.5 };
}
function renderHero(p) {
  heroItems.forEach(it => { it.style.opacity = 1; });
  heroWords.forEach(w => {
    if (!heroEntranceDone && w.exit0 < 2) return;   // arrival cascade owns these words
    const s = wordPose(w, p);
    w.inner.style.transform = `translateY(${s.y.toFixed(2)}%)`;
    w.inner.style.opacity = s.o.toFixed(3);
    w.inner.style.filter = s.b < 0.15 ? 'none' : `blur(${s.b.toFixed(2)}px)`;
  });
}

// Section h2s: wrap each line (split on <br>) for the masked line reveal
document.querySelectorAll('.sec-head h2').forEach(h2 => {
  h2.innerHTML = h2.innerHTML.split(/<br\s*\/?>/i)
    .map(l => `<span class="rl">${l}</span>`).join('');
});

const watched = [];
document.querySelectorAll('.about-photo, .about-head, .cta, .sec-head, .sector, .comm-word')
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
/* The travel is the SET's own overflow, crossed once — so every plate sweeps through the
   middle of the screen and none is stuck at an edge. It used to be 0.36 of the DOUBLED track,
   which came to 976 px for the six-plate row: more movement than this, and yet the first and
   last plates never arrived. Measured on the real set it is 636 px — calmer and complete. */
const PF_TRAVEL = 1;
const NEWS_TRAVEL = 0.72; // a share of the run's overflow: calm, and it still shows most of itself
let newsRun;
const pfRows = document.querySelectorAll('.pf-row');
/* EVERY PLATE GETS ITS TURN IN THE MIDDLE. The cards used to be duplicated once and the track
   pulled left from zero, so a row's FIRST plate sat at the very edge when the row was only
   just entering at the foot of the screen, and was already gone by the time the row was
   comfortably in view — Rebaba, the newest company, was never actually seen. The set is now
   cloned on BOTH sides, and the travel is centred on the real set: the originals sweep through
   the middle of the screen, and the clones are only there so no gap can ever open at an edge. */
pfRows.forEach(row => {
  const track = row.querySelector('.pf-track');
  const cards = [...track.querySelectorAll('.pf-card')];
  const clone = card => { const c = card.cloneNode(true); c.setAttribute('aria-hidden', 'true'); return c; };
  cards.forEach(card => track.appendChild(clone(card)));
  [...cards].reverse().forEach(card => track.insertBefore(clone(card), track.firstChild));
  track.dataset.set = cards.length;
});


// ---------- Community mosaic ----------
// The grid is drawn empty, then fills: portraits drop into their cells in diagonal
// waves as the section crosses the screen. Same idea as the rest of the page — the
// structure exists first, the content arrives into it.
const LPS = window.LPS || [];
/* THE COMMUNITY, WRITTEN. Not a band of photographs travelling on its own: the community is
   its names, set as one field of display capitals on the ink, and the words stand in the
   middle of them — the names run around the block instead of beside it. Nothing moves at
   rest; a name lights yellow under the hand. Each name carries its company in Portrait,
   which is what separates one from the next: no bullet, no rule between words. */
/* The two frames hold five pictures and move as a pair: the left one shows the picture the
   marks point at, the right one the next. They are turned by hand — the frames themselves
   are clickable, and a row of marks under them says how many there are and where you are.
   No arrow and no gauge: a short bar for the one in view, a dot for each of the others.
   Each frame carries TWO layers and a change is a dissolve from one to the other: setting a
   new source on a visible image blanks it for a frame, and that was the flash. Nothing is
   ever shown before it is decoded. */
const commShots = [...document.querySelectorAll('.comm-shot')];
const commDots = document.getElementById('commDots');
const COMM_PICS = ['comm-cocktail.jpg', 'comm-daylight.jpg', 'comm-talking.jpg',
                   'comm-poilane.jpg', 'comm-fans.jpg'];
let commAt = 0;
if (commShots.length) {
  addEventListener('load', () => COMM_PICS.forEach(f => { new Image().src = 'img/life/' + f; }));

  const dots = COMM_PICS.map((_, j) => {
    if (!commDots) return null;
    const b = document.createElement('button');
    b.className = 'comm-dot';
    b.type = 'button';
    b.setAttribute('aria-label', 'Picture ' + (j + 1));
    b.addEventListener('click', () => setCommunity(j));
    commDots.appendChild(b);
    return b;
  }).filter(Boolean);

  /* A click while a frame is still dissolving is remembered, not dropped: the frame keeps
     the picture it was last asked for and takes it as soon as it is free. Otherwise two
     clicks in quick succession left the marks and the pictures out of step. */
  const run = frame => {
    const pic = frame.dataset.want;
    if (!pic || frame.dataset.busy) return;
    const layers = [...frame.querySelectorAll('img')];
    const front = layers.find(l => l.classList.contains('on')) || layers[0];
    const back = layers.find(l => l !== front);
    if ((front.getAttribute('src') || '').endsWith(pic)) return;
    frame.dataset.busy = '1';
    const next = new Image();
    next.onload = () => {
      back.src = next.src;
      back.alt = front.alt;
      // a beat for the layer to be painted before it is faded in — a timer and not
      // `requestAnimationFrame`, which a hidden tab suspends: the swap would then be stuck
      // half done, with the frame marked busy for ever
      setTimeout(() => {
        back.classList.add('on');
        front.classList.remove('on');
        setTimeout(() => { delete frame.dataset.busy; run(frame); }, 560);
      }, 20);
    };
    next.onerror = () => { delete frame.dataset.busy; };
    next.src = 'img/life/' + pic;
  };
  const dissolve = (frame, pic) => { frame.dataset.want = pic; run(frame); };

  function setCommunity(i) {
    commAt = (i + COMM_PICS.length) % COMM_PICS.length;
    commShots.forEach((f, k) => dissolve(f, COMM_PICS[(commAt + k) % COMM_PICS.length]));
    dots.forEach((d, j) => d.classList.toggle('on', j === commAt));
  }

  commShots.forEach(f => {
    f.addEventListener('click', () => setCommunity(commAt + 1));
    f.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCommunity(commAt + 1); }
    });
  });
  setCommunity(0);
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

// ONE FIELD PER STRETCH OF CREAM. A field behind each section head meant a junction
// between every band and the next; fading their edges only turned a line into a fading
// line. Each of these runs edge to edge between two black bands, so there is nothing to
// see where the ground begins. The grain is coarse: over three thousand pixels the hero's
// fine columns would read as stripes, and that many panels cannot be lit on every pass.
[['groundOne', 20903], ['groundTwo', 50411]].forEach(([id, seed]) => {
  const el = document.getElementById(id);
  if (el) makeWall([{ el, offset: 0 }], { seed, span: 100, rest: 0.2, reach: 24, grain: 2 });
});

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

  // the press run travels the same way a portfolio row does. The track is built by
  // reveal.js, which runs after this file, so it is looked up on the first pass.
  if (newsRun === undefined) newsRun = document.getElementById('newsTrack') || null;
  if (newsRun) {
    const host = newsRun.parentElement;
    const r = host.getBoundingClientRect();
    if (r.bottom > -100 && r.top < vh + 100) {
      const overflow = Math.max(newsRun.scrollWidth - host.clientWidth, 0);
      const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
      newsRun.style.transform = `translateX(${(-overflow * p * NEWS_TRAVEL).toFixed(1)}px)`;
    }
  }

  // portfolio crossing rows
  pfRows.forEach((row, i) => {
    const r = row.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) return;
    const track = row.querySelector('.pf-track');
    const cards = track.querySelectorAll('.pf-card');
    const n = +track.dataset.set || cards.length;
    const pitch = cards.length > 1
      ? cards[1].offsetLeft - cards[0].offsetLeft
      : cards[0].offsetWidth;
    const setW = n * pitch;                       // one set, trailing gutter included
    // the middle of the scroll puts the real set in the middle of the screen
    const mid = setW + (setW - pitch + cards[0].offsetWidth - row.clientWidth) / 2;
    const travel = Math.max(setW - row.clientWidth, 0) * PF_TRAVEL;
    const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
    const x = -mid + (i % 2 === 0 ? 1 : -1) * travel * (0.5 - p);
    track.style.transform = `translateX(${x.toFixed(1)}px)`;
  });

  // photos: image drifts slower than its frame (internal parallax), staying within the overflow
  parPhotos.forEach(img => {
    const r = img.parentElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
    img.style.setProperty('--py', (-2 - p * 12).toFixed(2) + '%');
  });


  sweepMissed(vh);
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });
addEventListener('load', onScroll);
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
  // the founders, large — not the logo again: that is the plate the reader just clicked
  pfDetail.innerHTML = `
    <figure class="pfd-shot"><img src="img/founders/${key}.jpg" alt="Founders of ${c[0]}"></figure>
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
      <div class="pf-detail-go">${c[8]
        ? `<a class="btn" href="${c[8]}" target="_blank" rel="noopener">More on their website <span class="btn-arrow">&rarr;</span></a>`
        : `<span class="btn btn--waiting" aria-disabled="true">More on their website <span class="btn-arrow">&rarr;</span></span>`}</div>
    </div>`;
  openOverlay(pfModal);
}
document.querySelectorAll('.pf-card').forEach(card =>
  card.addEventListener('click', () => showCompany(card.dataset.co)));

