/* SISTAFUND — scroll engine shared by every page */

/* Inertial scroll: the wheel eases the page instead of jumping it (Lenis-style).
   Real window scrolling is preserved, so sticky sections and scroll-driven
   animations keep working; trackpads on touch devices are left alone. */
(function () {
  if (matchMedia('(pointer: coarse)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  let target = scrollY, current = scrollY, raf = null;
  const loop = () => {
    current += (target - current) * 0.12;
    if (Math.abs(target - current) < 0.5) {
      current = target; raf = null;
      scrollTo({ top: current, behavior: 'instant' });
      return;
    }
    scrollTo({ top: current, behavior: 'instant' });
    raf = requestAnimationFrame(loop);
  };
  addEventListener('wheel', e => {
    if (e.ctrlKey || e.metaKey) return;                          // pinch zoom
    if (document.body.classList.contains('locked')) return;      // modal open
    if (e.target.closest('.overlay.open, .mobile-menu.open')) return;
    e.preventDefault();
    const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;  // Firefox line mode
    target = clamp(target + delta, 0, document.documentElement.scrollHeight - innerHeight);
    if (raf === null) raf = requestAnimationFrame(loop);
  }, { passive: false });
  // keys, scrollbar drags and anchor jumps move the page without us: stay in sync
  addEventListener('scroll', () => { if (raf === null) target = current = scrollY; }, { passive: true });
})();

/* The home page's press has a front page and a run: the latest story is given its size,
   with a large picture and a title at fifty, and the ones behind it pass under it in a
   track that travels with the scroll, like the portfolio rows. A column of ruled rows made
   the section far longer than anything else on the page. */
(function () {
  const top = document.querySelector('[data-news-top]');
  const track = document.querySelector('[data-news-track]');
  if (!window.NEWS) return;
  const shots = window.NEWS_IMG || [];

  const card = (i, kind) => {
    const [date, source, title, url] = window.NEWS[i];
    const a = document.createElement('a');
    a.className = 'ncard ' + kind + (shots[i] ? '' : ' ncard--nofoto');
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    // a picture that 404s takes its frame with it and the card falls back to one column,
    // rather than showing a hole where the photograph should be
    a.innerHTML = (shots[i]
        ? `<figure class="ncard-shot"><img src="img/news/${shots[i]}" alt="${title}"${i ? ' loading="lazy"' : ''}` +
          ` onerror="this.closest('.ncard').classList.add('ncard--nofoto');this.closest('.ncard-shot').remove()"></figure>`
        : '') +
      `<span class="ncard-say">` +
        `<span class="ncard-meta"><b>${source}</b><i>${date}</i></span>` +
        `<span class="ncard-title">${title}</span>` +
      `</span>`;
    return a;
  };

  if (top) {
    const n = +top.dataset.newsTop || 1;
    for (let i = 0; i < Math.min(n, window.NEWS.length); i++) {
      const a = card(i, 'ncard--lead');
      a.setAttribute('data-reveal', 'card');
      a.querySelector('.ncard-say').insertAdjacentHTML('beforeend',
        '<span class="btn ncard-go">Read it <i class="btn-arrow">\u2197</i></span>');
      top.appendChild(a);
    }
  }

  if (track) {
    const from = +track.dataset.newsFrom || 1;
    const n = +track.dataset.newsTrack || 9;
    for (let i = from; i < Math.min(from + n, window.NEWS.length); i++) {
      track.appendChild(card(i, 'ncard--min'));
    }
  }
})();

/* Built BEFORE the reveal engine on purpose: the engine collects [data-reveal] once,
   so a tile appended afterwards is never observed and stays at opacity 0 forever. */
/* The home's team is a small gallery, not one huge picture with a pager: a group reads as
   a row of faces. Each portrait says who it is under the pointer, as the community grid
   does. Gabriel is left out here — he is on the dedicated page. */
(function () {
  const host = document.querySelector('[data-team-row]');
  if (!host || !window.TEAM) return;
  const n = +host.dataset.teamRow || 5;
  window.TEAM.slice(0, n).forEach(([name, role, file], i) => {
    const a = document.createElement('a');
    a.className = 'team-face';
    a.href = 'team.html';
    a.setAttribute('data-reveal', 'image');
    a.style.setProperty('--rd', (i * 90) + 'ms');
    a.innerHTML = `<img src="img/team/${file}" alt="${name}"${i > 2 ? ' loading="lazy"' : ''}>` +
      `<span class="pcf-tag"><b>${name}</b><i>${role}</i></span>`;
    host.appendChild(a);
  });
})();

/* Scroll reveal engine for the dedicated pages
   Elements are visible by default; the hidden state is only armed once this
   script runs (html.anim), and three safety nets guarantee nothing stays hidden. */
(function () {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = [...document.querySelectorAll('[data-reveal]')];
  if (!targets.length || reduced) return;

  // stagger children of a [data-stagger] container
  targets.forEach(el => {
    const parent = el.closest('[data-stagger]');
    if (!parent) return;
    const i = [...parent.querySelectorAll('[data-reveal]')].indexOf(el);
    if (i > 0) el.style.setProperty('--rd', Math.min(i, 8) * 80 + 'ms');
  });

  // Only animate a page the user is actually looking at: a backgrounded tab freezes
  // transitions, which would leave revealed content stuck at opacity 0.
  if (document.visibilityState !== 'visible') return;
  root.classList.add('anim');           // arms the hidden state in CSS

  const disarm = () => {                // hard reset: everything visible, no transition needed
    root.classList.remove('anim');
    targets.forEach(el => el.classList.add('shown'));
  };
  addEventListener('visibilitychange', () => { if (document.hidden) disarm(); });

  const show = el => { el.classList.add('shown'); io.unobserve(el); };

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) show(e.target); });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  targets.forEach(el => io.observe(el));

  // net 1: anything already on (or above) the screen reveals right away
  const sweep = () => {
    const vh = innerHeight;
    targets.forEach(el => {
      if (el.classList.contains('shown')) return;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.92) show(el);
    });
  };
  requestAnimationFrame(sweep);
  addEventListener('scroll', sweep, { passive: true });
  addEventListener('resize', sweep, { passive: true });

  // net 2 + 3: timers, so a throttled tab can never leave content hidden
  setTimeout(sweep, 700);
  setTimeout(() => { if (targets.some(el => !el.classList.contains('shown'))) sweep(); }, 2500);
})();

/* Team stack: each card dims as the next print slides over it
   (no scale change: every print keeps exactly the same size) */
(function () {
  const cards = [...document.querySelectorAll('.tcard')];
  if (!cards.length) return;
  let ticking = false;
  const run = () => {
    cards.forEach((c, i) => {
      const next = cards[i + 1];
      if (!next) { c.style.filter = ''; return; }
      const r = next.getBoundingClientRect();
      const p = Math.min(Math.max((innerHeight - r.top) / (innerHeight * 0.85), 0), 1);
      c.style.filter = `brightness(${(1 - p * 0.09).toFixed(3)})`;
    });
    ticking = false;
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  run();
})();

/* Page opening cascade
   The frames leave the screen at their own pace, and the pictures form a queue:
   each step promotes every one of them a place up in size, so a small picture
   travels into the large frame while the one leaving shrinks back to the entry. */
(function () {
  const frames = [...document.querySelectorAll('[data-drift]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (frames.length && !reduced) {
    let ticking = false;
    const run = () => {
      const vh = innerHeight;
      frames.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const p = Math.min(Math.max((vh - r.top) / (vh + r.height), 0), 1);
        el.style.transform = `translateY(${((p - 0.5) * +el.dataset.drift).toFixed(2)}vh)`;
      });
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    run();
  }

  document.querySelectorAll('.pcascade').forEach(cascade => {
    // one window or several: window w holds the picture w steps ahead of the one in hand,
    // so a second frame shows what comes next rather than repeating what is shown
    const windows = [...cascade.querySelectorAll('.pcwindow')];
    const sets = windows.length ? windows.map(w => [...w.querySelectorAll('.pcq')])
                                : [[...cascade.querySelectorAll('.pcq')]];
    const queue = sets[0];
    const open = cascade.closest('.page-open') || cascade.parentElement;
    const marks = cascade.querySelector('.pcdots');
    const steps = queue.length;
    if (steps < 2) return;

    const lead = open.querySelector('[data-cascade-lead]');
    let k = 0;

    /* The same row of marks the community carries on the home: one rule per picture, the one
       in hand long, the others short. No gauge filling up — that was a progress bar, and the
       site has none anywhere else. Each mark turns its own print. */
    const dots = marks ? queue.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pcdot';
      b.setAttribute('aria-label', 'Picture ' + (i + 1) + ' of ' + steps);
      b.addEventListener('click', () => lay(i, false));
      marks.appendChild(b);
      return b;
    }) : [];

    /* Depth 0 is the print in hand; 1, 2, 3 are the ones already laid, showing their
       edges under it; anything deeper waits out of the pile. */
    const lay = (step, wipe) => {
      k = (step + steps) % steps;
      sets.forEach((set, w) => set.forEach((el, i) => {
        // ONE PRINT SHOWING PER WINDOW, dissolving into the next — the home's own mechanism.
        // Nothing is moved and nothing is stacked: the class carries the whole change, and
        // the row of marks counts the SET, not the frames.
        el.classList.remove('is-top', 'is-back', 'is-far', 'laying');
        el.classList.toggle('is-top', i === (k + w) % steps);
      }));
      if (wipe) {
        const top = queue[k];
        top.classList.add('laying');
        void top.offsetWidth;            // let the closed clip take, then open it
        top.classList.remove('laying');
      }
      dots.forEach((d, i) => d.classList.toggle('on', i === k));
      // the headline belongs to whichever picture is now in hand
      if (lead && queue[k].dataset.title) {
        const d = queue[k].dataset;
        lead.querySelector('b').textContent = d.source;
        lead.querySelector('i').textContent = d.date;
        const a = lead.querySelector('a');
        a.textContent = d.title;
        a.href = d.url;
        lead.classList.remove('turning');
        void lead.offsetWidth;
        lead.classList.add('turning');
      }
    };

    /* NOTHING TURNS ON ITS OWN. The pile used to lay a new print every 5.6 s, while the
       community on the home — built from the SAME row of marks — changes only when it is
       asked to. One component, two opposite rules, met twice on the same site. The home's
       rule wins: the marks are the control, and a picture stays until someone turns it. */

    lay(0, false);
  });
})();

/* Sector marks at the pointer
   Passing over an area of interest summons its own picto, which trails the cursor. */
(function () {
  const zones = [...document.querySelectorAll('[data-sec]')].filter(z => z.tagName !== 'IMG');
  if (!zones.length) return;
  if (matchMedia('(pointer: coarse)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const box = document.createElement('div');
  box.className = 'sec-cursor';
  box.setAttribute('aria-hidden', 'true');
  const marks = {};
  Object.entries({ health: 'health.png', frontier: 'frontier.png', sustain: 'sustain.png', ai: 'ai.png' })
    .forEach(([key, file]) => {
      const im = document.createElement('img');
      im.src = 'img/sectors/' + file; im.alt = '';
      box.appendChild(im); marks[key] = im;
    });
  document.body.appendChild(box);

  let x = 0, y = 0, cx = 0, cy = 0, raf = null;
  // offset down and to the right of the pointer: the mark accompanies the word
  // rather than landing on top of it
  const place = () => { box.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) translate(6%, -20%)`; };
  const loop = () => {
    cx += (x - cx) * 0.16; cy += (y - cy) * 0.16;
    place();
    raf = (Math.abs(x - cx) > 0.4 || Math.abs(y - cy) > 0.4) ? requestAnimationFrame(loop) : null;
  };

  zones.forEach(z => {
    const key = z.dataset.sec;
    if (!marks[key]) return;
    z.addEventListener('pointerenter', e => {
      Object.values(marks).forEach(im => im.classList.remove('on'));
      marks[key].classList.add('on');
      box.classList.toggle('inv', z.hasAttribute('data-sec-inv'));
      cx = x = e.clientX; cy = y = e.clientY;      // it arrives under the pointer, no flight in
      place();
      box.classList.add('on');
    });
    z.addEventListener('pointermove', e => {
      x = e.clientX; y = e.clientY;
      if (raf === null) raf = requestAnimationFrame(loop);
    });
    z.addEventListener('pointerleave', () => box.classList.remove('on'));
  });
})();

/* Gentle parallax: images drift slower than their frame while in view */
(function () {
  const items = [...document.querySelectorAll('[data-parallax] img')];
  if (!items.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ticking = false;
  const run = () => {
    const vh = innerHeight;
    items.forEach(img => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const p = Math.min(Math.max((vh - r.top) / (vh + r.height), 0), 1);
      img.style.setProperty('--py', (-2 - p * 10).toFixed(2) + '%');
    });
    ticking = false;
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  run();
})();

/* A FILTERED GRID MUST NOT JUMP.
   Filtering is done by hiding plates, so the grid changes row count and everything below it —
   the closing mark, the footer — is thrown down or up in one frame. It went unnoticed while the
   counts happened to be close; with four areas, three of them land on a single row and Climate,
   with five companies, is the only one needing a second. Switching between the other three
   moved nothing and switching to Climate moved the page 224 px, which reads as a glitch rather
   than as a choice.
   So the box settles instead of snapping: its height is pinned, the filter applied, and the
   height run to the new one. Shared by the portfolio and the community, which filter the same
   way. A hidden tab freezes transitions, so the pin is always released on a timer as well as on
   transitionend — a box left locked to a pixel height would never grow again. */
window.settleHeight = function (el, apply) {
  if (!el) { apply(); return; }
  if (document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) { apply(); return; }

  // where the box is RIGHT NOW, mid-flight included: reading it during a transition gives the
  // current state, not the target, which is exactly what a new run should start from
  const from = el.getBoundingClientRect().height;
  // and the previous run is called off first — its timer would otherwise fire a second later
  // and release this run's pin in mid-air, which is the snap we came here to remove
  if (el._settleStop) el._settleStop();
  el.style.transition = ''; el.style.height = ''; el.style.overflow = '';

  // BOTH heights are read FREE, before anything is pinned. Pinning first and then asking for
  // scrollHeight cannot work: scrollHeight never reports less than the box it is measured in,
  // so every filter that SHRANK the grid came back "unchanged" and snapped instead.
  // Nothing is painted between these reads — it is all one synchronous task.
  apply();
  const to = el.getBoundingClientRect().height;
  if (Math.abs(to - from) < 1) return;

  const onEnd = ev => { if (ev.target === el && ev.propertyName === 'height') release(); };
  let timer = null;
  const stop = () => { clearTimeout(timer); el.removeEventListener('transitionend', onEnd); el._settleStop = null; };
  const release = () => { stop(); el.style.transition = ''; el.style.height = ''; el.style.overflow = ''; };
  el._settleStop = stop;

  el.style.overflow = 'hidden';
  el.style.height = from + 'px';
  void el.offsetHeight;                       // the pinned height has to land before it moves
  el.style.transition = 'height .52s cubic-bezier(.22, 1, .36, 1)';
  el.style.height = to + 'px';
  el.addEventListener('transitionend', onEnd);
  // a hidden tab freezes transitions: never leave the box locked to a pixel height
  timer = setTimeout(release, 1000);
};
