

const NEAR = [250, 248, 240];
const FAR  = [255, 248, 104];
const hex2 = n => n.toString(16).padStart(2, '0');
const toneAt = t => {
  const u = Math.min(Math.max(t, 0), 1);
  const k = u * u * (3 - 2 * u);
  return '#' + NEAR.map((a, i) => hex2(Math.round(a + (FAR[i] - a) * k))).join('');
};
const OVER = 9;

function makeWall(hosts, opts) {
  const main = hosts[0].el;
  let bars = [], nodes = [], last = 0;

  const build = () => {
    const holes = (opts.holes ? opts.holes() : []).filter(Boolean);
    let seed = opts.seed || 20260903;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const SPAN = opts.span || 100;

    const G = opts.grain || 1;
    const PW = main.clientWidth || 1728;
    const PH = main.clientHeight || 1000;
    bars = [];

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
      const cw = ((24 + rnd() * 48) * G / PW) * 100;
      let y = -OVER;
      while (y < SPAN + OVER) {
        const h = Math.min(((90 + rnd() * 240) / PH) * 100, SPAN + OVER - y);
        const near = Math.min(away(x + cw / 2, y + h / 2) * 1.55, 1);
        const foot = opts.fadeFoot ? Math.min((SPAN - (y + h)) / 22, 1) : 1;
        const room = Math.min(near, foot);
        const t = (room * 0.38 + rnd() * 0.62 * Math.min(room * 2.2, 1)) * (opts.rest ?? 1);
        bars.push({ x, w: cw, top: y, h, tone: toneAt(t) });
        y += h;
      }
      x += cw;
    }

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

  const REACH = opts.reach || 26;
  let lit = [], litHost = -1;
  const light = (mxPx, myU, host) => {
    const list = nodes[host];
    for (let j = 0; j < lit.length; j++) nodes[litHost][lit[j]].style.setProperty('--k', '0');
    lit = []; litHost = host;
    const W = hosts[host].el.clientWidth || 1728;
    const H = hosts[host].el.clientHeight || 1000;
    const reach = (REACH / 100) * W;
    const spanY = H / 100;
    for (let i = 0; i < bars.length; i++) {
      const b = bars[i];
      const dy = ((b.top + b.h / 2) - myU) * spanY;
      if (dy > reach || dy < -reach) continue;
      const dx = ((b.x + b.w / 2) / 100) * W - mxPx;
      const d = Math.sqrt(dx * dx + dy * dy) / reach;
      if (d >= 1) continue;
      list[i].style.setProperty('--k', ((1 - d) * (1 - d)).toFixed(3));
      lit.push(i);
    }
  };
  const clear = () => {
    if (litHost >= 0) for (let j = 0; j < lit.length; j++) nodes[litHost][lit[j]].style.setProperty('--k', '0');
    lit = [];
  };
  const follow = e => {
    const now = performance.now();
    if (now - last < 16) return;
    last = now;
    for (let hi = 0; hi < hosts.length; hi++) {
      const r = hosts[hi].el.getBoundingClientRect();
      if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
      if (e.clientY < r.top || e.clientY > r.bottom) continue;
      light(e.clientX - r.left,
            ((e.clientY - r.top) / r.height) * 100 + (hosts[hi].offset || 0), hi);
      return;
    }
  };
  addEventListener('pointermove', follow, { passive: true });
  addEventListener('mousemove', follow, { passive: true });
  addEventListener('mouseleave', clear, { passive: true });
  return { build };
}

if (!document.getElementById('heroWall')) {
  document.querySelectorAll('.ground-wall').forEach((el, i) => {
    makeWall([{ el, offset: 0 }], { seed: 61807 + i * 7919, span: 100, rest: 0.22, reach: 24, grain: 3.6 });
  });
}