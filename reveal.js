/* SISTAFUND — scroll reveal engine for the dedicated pages
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
