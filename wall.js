/* SISTAFUND — the field of clouds
   Shared by every page: the home builds the hero's ground and the thesis field from it, the
   dedicated pages build the one field their cream carries. It lives in its own file so the
   load order of script.js and reveal.js does not have to change. */

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
    /* The patch is sized in PIXELS and converted, not in per cent of the field: a field
       three thousand pixels tall turned segments of "9 to 33 units" into columns a
       thousand pixels deep, and the light read as a band down the page instead of a
       patch. Held in pixels, every field has the hero's grain whatever its size.
       `grain` only widens the columns, to keep the panel count where the pointer can
       afford it — it never stretches them vertically. */
    const G = opts.grain || 1;
    const PW = main.clientWidth || 1728;
    const PH = main.clientHeight || 1000;
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
      const cw = ((24 + rnd() * 48) * G / PW) * 100;   // 24-72px of column, widened by grain
      let y = -OVER;
      while (y < SPAN + OVER) {                 // the column is filled top to bottom
        const h = Math.min(((90 + rnd() * 240) / PH) * 100, SPAN + OVER - y);
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

  /* The falloff is a CIRCLE measured in PIXELS. It used to be an ellipse flattened in the
     field's own per cent space, which on a field three thousand pixels tall came out
     830 px wide and 2 070 tall — a band down the page, not a patch. Round and in pixels,
     the light is the same patch on every field, whatever its height.
     Only the panels the light can reach are touched, and the ones lit on the pass before
     are put out by name — a field of five hundred panels would cost twenty milliseconds
     to walk from end to end on every move. */
  const REACH = opts.reach || 26;
  let lit = [], litHost = -1;
  const light = (mxPx, myU, host) => {
    const list = nodes[host];
    for (let j = 0; j < lit.length; j++) nodes[litHost][lit[j]].style.setProperty('--k', '0');
    lit = []; litHost = host;
    const W = hosts[host].el.clientWidth || 1728;
    const H = hosts[host].el.clientHeight || 1000;
    const reach = (REACH / 100) * W;            // the ellipse's half-width, in pixels
    // a bar's `top` is a per cent of its host's height, whatever the span: one unit is one
    // hundredth of a host, in every field
    const spanY = H / 100;
    for (let i = 0; i < bars.length; i++) {
      const b = bars[i];
      const dy = ((b.top + b.h / 2) - myU) * spanY;
      if (dy > reach || dy < -reach) continue;  // out of the light: nothing to write
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
    if (now - last < 16) return;                // one pass per frame's worth of time,
    last = now;                                 // without depending on the frame loop
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

/* The dedicated pages have no home script, and their cream was left bare: the faint column
   guides were the only thing on it, which read as a grid rather than as a ground. They carry
   the same field as the home — one per stretch of cream, generated from a fixed seed, lighting
   under the pointer. The grain is coarse, as on the home's grounds: on a field three thousand
   pixels tall the hero's fine columns would read as stripes. */
if (!document.getElementById('heroWall')) {
  document.querySelectorAll('.ground-wall').forEach((el, i) => {
    makeWall([{ el, offset: 0 }], { seed: 61807 + i * 7919, span: 100, rest: 0.22, reach: 24, grain: 3.6 });
  });
}
