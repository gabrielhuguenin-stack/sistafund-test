

(function () {
  if (matchMedia('(pointer: coarse)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.style.scrollBehavior = 'auto';
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
    if (e.ctrlKey || e.metaKey) return;
    if (document.body.classList.contains('locked')) return;
    if (e.target.closest('.overlay.open, .mobile-menu.open')) return;
    e.preventDefault();
    const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    target = clamp(target + delta, 0, document.documentElement.scrollHeight - innerHeight);
    if (raf === null) raf = requestAnimationFrame(loop);
  }, { passive: false });
  addEventListener('scroll', () => { if (raf === null) target = current = scrollY; }, { passive: true });
})();

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

(function () {
  const set = (n, count) =>
    document.querySelectorAll(`a[href="${n}"] .nav-count`).forEach(e => { e.textContent = `(${count})`; });
  if (window.COMPANIES) set('portfolio.html', Object.keys(window.COMPANIES).length);
  if (window.TEAM) set('team.html', window.TEAM.length);
})();

(function () {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = [...document.querySelectorAll('[data-reveal]')];
  if (!targets.length || reduced) return;

  targets.forEach(el => {
    const parent = el.closest('[data-stagger]');
    if (!parent) return;
    const items = [...parent.querySelectorAll('[data-reveal]')];
    const i = items.indexOf(el);
    if (i <= 0) return;
    const cols = getComputedStyle(parent).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
    const col = i % cols, row = (i / cols) | 0;
    el.style.setProperty('--rd', (col * 70 + (row % 3) * 60) + 'ms');
  });

  if (document.visibilityState !== 'visible') return;
  root.classList.add('anim');

  const disarm = () => {
    root.classList.remove('anim');
    targets.forEach(el => el.classList.add('shown'));
  };
  addEventListener('visibilitychange', () => { if (document.hidden) disarm(); });

  const show = el => { el.classList.add('shown'); io.unobserve(el); };

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) show(e.target); });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  targets.forEach(el => io.observe(el));

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

  setTimeout(sweep, 700);
  setTimeout(() => { if (targets.some(el => !el.classList.contains('shown'))) sweep(); }, 2500);
})();

(function () {
  document.querySelectorAll('.pcascade').forEach(cascade => {
    const windows = [...cascade.querySelectorAll('.pcwindow')];
    const sets = windows.length ? windows.map(w => [...w.querySelectorAll('.pcq')])
                                : [[...cascade.querySelectorAll('.pcq')]];
    const queue = sets[0];
    const open = cascade.closest('.page-open') || cascade.parentElement;
    const marks = cascade.querySelector('.pcdots');
    const steps = queue.length;
    if (steps < 2) return;

    let k = 0;

    const dots = marks ? queue.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pcdot';
      b.setAttribute('aria-label', 'Picture ' + (i + 1) + ' of ' + steps);
      b.addEventListener('click', () => lay(i, false));
      marks.appendChild(b);
      return b;
    }) : [];

    const lay = (step, wipe) => {
      k = (step + steps) % steps;
      sets.forEach((set, w) => set.forEach((el, i) => {
        el.classList.remove('is-top', 'is-back', 'is-far', 'laying');
        el.classList.toggle('is-top', i === (k + w) % steps);
      }));
      if (wipe) {
        const top = queue[k];
        top.classList.add('laying');
        void top.offsetWidth;
        top.classList.remove('laying');
      }
      dots.forEach((d, i) => d.classList.toggle('on', i === k));
    };

    lay(0, false);
  });
})();

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
      cx = x = e.clientX; cy = y = e.clientY;
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

window.settleHeight = function (el, apply) {
  if (!el) { apply(); return; }
  if (document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) { apply(); return; }

  const from = el.getBoundingClientRect().height;
  if (el._settleStop) el._settleStop();
  el.style.transition = ''; el.style.height = ''; el.style.overflow = '';

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
  void el.offsetHeight;
  el.style.transition = 'height .52s cubic-bezier(.22, 1, .36, 1)';
  el.style.height = to + 'px';
  el.addEventListener('transitionend', onEnd);
  timer = setTimeout(release, 1000);
};

(function () {
  document.querySelectorAll('[data-video]').forEach(fig => {
    const id = (fig.dataset.video || '').trim();
    const btn = fig.querySelector('.m-play');
    if (!id || !btn) return;
    btn.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
      f.title = 'SISTAFUND';
      f.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture';
      f.allowFullscreen = true;
      fig.appendChild(f);
      fig.classList.add('is-playing');
    }, { once: true });
  });
})();