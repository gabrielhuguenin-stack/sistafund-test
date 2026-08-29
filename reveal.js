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

/* The home's team runs on the same queue: the portraits travel up through the places
   and the name follows whoever reaches the large frame. */
(function () {
  const host = document.querySelector('[data-team-cascade]');
  if (!host || !window.TEAM) return;
  window.TEAM.forEach(([name, role, file], i) => {
    const q = document.createElement('div');
    q.className = 'pcq';
    q.dataset.drift = '0';
    Object.assign(q.dataset, { title: name, source: role, date: '', url: 'team.html' });
    q.innerHTML = `<figure class="pcf-frame" data-reveal="image" style="--rd:${i * 160}ms">
      <img src="img/team/${file}" alt="${name}" class="on"${i > 2 ? ' loading="lazy"' : ''}>
      <span class="pcf-tag"><b>${name}</b><i>${role}</i></span>
    </figure>`;
    host.appendChild(q);
  });
})();

/* The home page's press is an index, not a queue: the stories are ruled rows and the
   frame beside them holds whichever one the reader is on. The rows invert to yellow the
   way the sector lines do — a press page reads as a list, not as a stack of pictures. */
(function () {
  const list = document.querySelector('[data-news-list]');
  if (!list || !window.NEWS) return;
  const shots = window.NEWS_IMG || [];
  const frame = document.querySelector('.news-shot img');
  const n = +list.dataset.newsList || 6;
  window.NEWS.slice(0, n).forEach(([date, source, title, url], i) => {
    const a = document.createElement('a');
    a.className = 'news-row';
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    a.dataset.shot = shots[i] || '';
    a.style.setProperty('--rd', (i * 90) + 'ms');
    a.innerHTML = `<span class="news-row-meta"><b>${source}</b><i>${date}</i></span>` +
      `<span class="news-row-title">${title}</span>` +
      `<span class="btn-arrow">\u2197</span>`;
    list.appendChild(a);
  });
  const rows = [...list.querySelectorAll('.news-row')];
  const show = row => {
    if (!frame || !row.dataset.shot) return;
    rows.forEach(r => r.classList.toggle('on', r === row));
    if (frame.getAttribute('src') === 'img/news/' + row.dataset.shot) return;
    frame.classList.remove('in');
    frame.src = 'img/news/' + row.dataset.shot;
    frame.alt = row.querySelector('.news-row-title').textContent;
    requestAnimationFrame(() => frame.classList.add('in'));
  };
  rows.forEach(r => r.addEventListener('mouseenter', () => show(r)));
  if (rows[0]) show(rows[0]);
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
    const queue = [...cascade.querySelectorAll('.pcq')];
    const open = cascade.closest('.page-open') || cascade.parentElement;
    const nav = cascade.querySelector('.pcnav') || open.querySelector('.pcnav');
    const steps = queue.length;
    if (steps < 3 || !nav) { if (nav) nav.remove(); return; }
    // how many leaves stand closed at any moment: the CSS measures the pile from it
    cascade.style.setProperty('--leaves', steps - 2);

    // one leaf is open, the rest stand closed beside it in the order of the queue
    const DRIFT = ['-1.6', '2.4', '3.2', '4', '4.6'];
    const lead = open.querySelector('[data-cascade-lead]');
    let k = 0, timer = null;

    const goTo = step => {
      k = (step + steps) % steps;
      queue.forEach((el, i) => {
        const place = (i - k + steps) % steps;
        el.classList.remove('is-open', 'is-leaf', 'is-gone');
        // the one that has just closed is the last of the queue, and it is the only one
        // that travels from the open place: it slides out past the back of the stack
        el.classList.add(place === 0 ? 'is-open' : place === steps - 1 ? 'is-gone' : 'is-leaf');
        el.style.setProperty('--p', place);
        el.dataset.drift = DRIFT[place] || '0';
      });
      // the headline belongs to whichever picture now stands in the large frame
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

    nav.querySelectorAll('.pcarrow').forEach(b => {
      b.addEventListener('click', () => { stop(); goTo(k + +b.dataset.step); });
    });

    goTo(0);

    // it turns on its own until the visitor takes over
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    if (!reduced) {
      timer = setInterval(() => {
        // a hidden tab freezes the cross-fade, and an off-screen cascade needs no work
        if (document.hidden) return;
        const r = cascade.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        goTo(k + 1);
      }, 6400);
    }
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
  Object.entries({ health: 'health.png', frontier: 'frontier.png', sustain: 'sustain.png' })
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
