/* The Khan Trading — charts.js
   Self-contained SVG candlestick chart engine.
   Renders 7 distinct module animations into [data-chart] containers.
   Each animation replays on scroll re-entry. Respects prefers-reduced-motion. */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof gsap !== 'undefined';
  const hasST = hasGsap && !!window.ScrollTrigger;
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  const W = 400;
  const H = 300;

  // ---------- Primitives ----------

  function el(tag, attrs, children) {
    const n = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) {
      if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    }
    if (children) children.forEach(c => n.appendChild(c));
    return n;
  }

  function createSvg() {
    return el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      preserveAspectRatio: 'xMidYMid meet',
      width: '100%',
      height: '100%'
    });
  }

  // Candle: x is center; openY/highY/lowY/closeY are y coords (smaller y = higher price)
  function candle(x, openY, highY, lowY, closeY, opts) {
    opts = opts || {};
    const bodyW = opts.width || 10;
    const g = el('g', { class: 'candle' });
    const isBull = closeY < openY;
    const cls = opts.tone === 'gold' ? 'c-premium'
              : (isBull ? 'c-bull' : 'c-bear');
    const wickCls = 'c-wick' + (opts.dim ? ' c-dim' : '');
    const bodyCls = cls + (opts.dim ? ' c-dim' : '');

    g.appendChild(el('line', {
      class: wickCls,
      x1: x, x2: x, y1: highY, y2: lowY
    }));
    const bodyTop = Math.min(openY, closeY);
    const bodyH = Math.max(2, Math.abs(closeY - openY));
    g.appendChild(el('rect', {
      class: bodyCls,
      x: x - bodyW / 2,
      y: bodyTop,
      width: bodyW,
      height: bodyH,
      rx: 1
    }));
    return g;
  }

  // Price-axis label chip (right side)
  function priceLabel(x, y, text, tone) {
    const palette = {
      green: { bg: '#22C55E', stroke: '#22C55E', fg: '#07120B' },
      red:   { bg: '#EF4444', stroke: '#EF4444', fg: '#FFFFFF' },
      gold:  { bg: '#D4AF37', stroke: '#D4AF37', fg: '#1B1503' },
      grey:  { bg: '#161D29', stroke: '#2A3445', fg: '#F4F5F7' }
    };
    const p = palette[tone] || palette.grey;
    const g = el('g', { class: 'price-chip' });
    g.appendChild(el('rect', {
      x: x, y: y - 8, width: 56, height: 16, rx: 2,
      fill: p.bg, stroke: p.stroke, 'stroke-width': 0.5
    }));
    const t = el('text', {
      x: x + 28, y: y + 3.5,
      'text-anchor': 'middle',
      fill: p.fg,
      'font-family': 'JetBrains Mono, monospace',
      'font-size': 9,
      'font-weight': 600
    });
    t.appendChild(document.createTextNode(text));
    g.appendChild(t);
    return g;
  }

  // Small text callout
  function textLabel(x, y, text, opts) {
    opts = opts || {};
    const t = el('text', {
      x: x, y: y,
      'text-anchor': opts.anchor || 'start',
      fill: opts.color || '#8A93A6',
      'font-family': opts.font || 'JetBrains Mono, monospace',
      'font-size': opts.size || 9,
      'font-weight': opts.weight || 500,
      'letter-spacing': opts.letterSpacing != null ? opts.letterSpacing : 0.5
    });
    t.appendChild(document.createTextNode(text));
    return t;
  }

  // Horizontal dashed level
  function level(x1, x2, y, tone) {
    return el('line', {
      class: 'c-level l-' + (tone || 'grey'),
      x1: x1, x2: x2, y1: y, y2: y
    });
  }

  // Translucent zone
  function zone(x, y, w, h, kind) {
    return el('rect', {
      class: 'c-zone-' + (kind || 'crt'),
      x: x, y: y, width: w, height: h, rx: 2
    });
  }

  // Arrow head + line
  function arrow(x1, y1, x2, y2, tone) {
    const colors = { green: '#22C55E', red: '#EF4444', gold: '#D4AF37' };
    const c = colors[tone] || colors.green;
    const g = el('g', { class: 'arrow' });
    g.appendChild(el('line', {
      x1: x1, y1: y1, x2: x2, y2: y2,
      stroke: c, 'stroke-width': 1.5, 'stroke-linecap': 'round'
    }));
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len, uy = dy / len;
    const px = -uy, py = ux;
    const size = 6;
    const ax = x2 - ux * size, ay = y2 - uy * size;
    g.appendChild(el('polygon', {
      points: x2 + ',' + y2 + ' ' +
              (ax + px * size * 0.6) + ',' + (ay + py * size * 0.6) + ' ' +
              (ax - px * size * 0.6) + ',' + (ay - py * size * 0.6),
      fill: c
    }));
    return g;
  }

  // ---------- Animation helpers ----------

  function hide(elem) { elem.style.opacity = 0; return elem; }

  function tl(container) {
    if (!hasST) return null;
    return gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top 85%',
        toggleActions: 'restart pause resume reset'
      }
    });
  }

  function showAll(svg) {
    svg.querySelectorAll('*').forEach(n => { n.style.opacity = ''; });
  }

  // ============================================================
  //  SCENE 01 — FOUNDATIONS & NARRATIVE
  //  Base candles draw in, CRT range zone fades, purging candle
  //  wicks above the range and a confirmation bear closes lower.
  //  Price labels slide in from right — matches reference screenshot.
  // ============================================================

  function buildFoundations(svg, container) {
    const data = [
      { x: 30,  o: 215, h: 205, l: 225, c: 210 },
      { x: 52,  o: 210, h: 195, l: 215, c: 200 },
      { x: 74,  o: 200, h: 185, l: 205, c: 188 },
      { x: 96,  o: 188, h: 180, l: 195, c: 192 },
      { x: 118, o: 192, h: 175, l: 198, c: 178 },
      { x: 140, o: 178, h: 160, l: 182, c: 164 },
      { x: 162, o: 164, h: 152, l: 170, c: 158 },
      { x: 184, o: 158, h: 145, l: 165, c: 150 },
      { x: 206, o: 150, h: 138, l: 158, c: 142 },
      { x: 228, o: 142, h: 130, l: 150, c: 135 },
      { x: 250, o: 135, h: 125, l: 145, c: 140 }
    ];

    const rangeHighY = 122;
    const rangeLowY  = 168;

    // CRT zone
    const zoneEl = zone(20, rangeHighY, 285, rangeLowY - rangeHighY, 'crt');
    hide(zoneEl);
    svg.appendChild(zoneEl);

    // Liquidity line at range high
    const liqEl = level(20, 305, rangeHighY, 'red');
    hide(liqEl);
    svg.appendChild(liqEl);

    // Base candles
    const candleEls = data.map(d => {
      const g = candle(d.x, d.o, d.h, d.l, d.c);
      hide(g);
      svg.appendChild(g);
      return g;
    });

    // Purging candle — wicks above rangeHigh, closes back below it
    const purgeEl = candle(282, 138, 80, 148, 152, { width: 12 });
    hide(purgeEl);
    svg.appendChild(purgeEl);

    // Confirmation bear
    const confEl = candle(304, 150, 145, 200, 195, { width: 12 });
    hide(confEl);
    svg.appendChild(confEl);

    // Price labels
    const lblHigh = priceLabel(330, 80,         '4,720', 'grey');
    const lblZ1   = priceLabel(330, rangeHighY, '4,706', 'green');
    const lblMid  = priceLabel(330, 150,        '4,683', 'grey');
    const lblZ2   = priceLabel(330, rangeLowY,  '4,666', 'grey');
    [lblHigh, lblZ1, lblMid, lblZ2].forEach(l => { hide(l); svg.appendChild(l); });

    // Callout
    const callout = textLabel(30, 50, 'CRT RANGE FORMED', {
      color: '#D4AF37', size: 9, letterSpacing: 1.5, weight: 700
    });
    hide(callout);
    svg.appendChild(callout);

    if (reduce || !hasST) { showAll(svg); return; }

    const t = tl(container);
    t.to(candleEls, { opacity: 1, duration: 0.35, stagger: 0.06, ease: 'power2.out' });
    t.to(zoneEl, { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.4');
    t.to([lblZ1, lblMid, lblZ2], { opacity: 1, duration: 0.35, stagger: 0.08 }, '-=0.2');
    t.to(callout, { opacity: 1, duration: 0.4 }, '-=0.2');
    t.to(liqEl, { opacity: 1, duration: 0.4 }, '+=0.1');
    t.to(purgeEl, { opacity: 1, duration: 0.45, ease: 'power3.out' }, '+=0.05');
    t.to(lblHigh, { opacity: 1, duration: 0.3 }, '-=0.2');
    t.to(confEl, { opacity: 1, duration: 0.45, ease: 'power3.out' }, '+=0.1');
  }

  // ============================================================
  //  SCENE 02 — TIMING & SESSION ALIGNMENT
  //  Gold session window slides across candles. In-session
  //  candles brighten; out-of-session candles stay dim.
  // ============================================================

  function buildSessions(svg, container) {
    // Deterministic candle data (no Math.random — would flicker on each render)
    const heights = [180, 168, 175, 188, 195, 182, 170, 158, 165, 178, 172, 160, 152, 145, 158, 168, 175, 182];
    const data = heights.map((y, i) => {
      const next = heights[i + 1] != null ? heights[i + 1] : y - 8;
      const o = y;
      const c = next;
      const h = Math.min(o, c) - 7;
      const l = Math.max(o, c) + 7;
      return { x: 25 + i * 18, o: o, h: h, l: l, c: c };
    });

    // Session window — gold band, slides
    const sessionEl = el('rect', {
      x: 25, y: 30, width: 95, height: 220, rx: 2,
      fill: '#D4AF37', 'fill-opacity': 0.07,
      stroke: '#D4AF37', 'stroke-opacity': 0.45,
      'stroke-dasharray': 3, 'stroke-width': 1
    });
    hide(sessionEl);
    svg.appendChild(sessionEl);

    // Render all candles dim first
    const candleEls = data.map(d => {
      const g = candle(d.x, d.o, d.h, d.l, d.c, { dim: true });
      hide(g);
      svg.appendChild(g);
      return g;
    });

    // Session labels
    const lab1 = textLabel(50, 50, '10–11 AM NY', {
      color: '#D4AF37', size: 10, letterSpacing: 1.5, weight: 700
    });
    const lab2 = textLabel(230, 50, '2–3 PM NY', {
      color: '#D4AF37', size: 10, letterSpacing: 1.5, weight: 700
    });
    hide(lab1); hide(lab2);
    svg.appendChild(lab1); svg.appendChild(lab2);

    // Bottom time axis
    ['09:00', '11:00', '13:00', '15:00'].forEach((t, i) => {
      svg.appendChild(textLabel(40 + i * 90, 285, t, {
        color: '#5B6473', size: 8, letterSpacing: 0.8
      }));
    });

    if (reduce || !hasST) {
      showAll(svg);
      candleEls.forEach(c => undimCandle(c));
      return;
    }

    function undimCandle(g) {
      g.querySelectorAll('.c-dim').forEach(n => n.classList.remove('c-dim'));
    }

    const t = tl(container);
    t.to(candleEls, { opacity: 1, duration: 0.25, stagger: 0.03 });
    t.to(sessionEl, { opacity: 1, duration: 0.4 }, '-=0.2');
    t.to(lab1, { opacity: 1, duration: 0.3 }, '<');

    // Window 1: candles 2-7 brighten
    t.call(() => candleEls.slice(2, 7).forEach(undimCandle), null, '+=0.1');

    // Slide window to PM zone
    t.to(sessionEl, { attr: { x: 205 }, duration: 0.9, ease: 'power2.inOut' }, '+=0.6');
    t.to(lab1, { opacity: 0.25, duration: 0.3 }, '<');
    t.to(lab2, { opacity: 1, duration: 0.4 }, '<');

    // Re-dim window 1 candles, brighten window 2
    t.call(() => {
      candleEls.slice(2, 7).forEach(g => {
        g.querySelector('.c-wick').classList.add('c-dim');
        g.querySelector('rect').classList.add('c-dim');
      });
      candleEls.slice(11, 16).forEach(undimCandle);
    }, null, '<0.4');
  }

  // ============================================================
  //  SCENE 03 — PURGING CANDLE DELIVERY
  //  Zoomed-in single candle. Liquidity line, wick rockets above,
  //  body closes back below. Anatomy labels appear.
  // ============================================================

  function buildPurge(svg, container) {
    // Context candles (dim, sides)
    const ctx = [
      { x: 50,  o: 200, h: 190, l: 210, c: 195 },
      { x: 75,  o: 195, h: 180, l: 200, c: 184 },
      { x: 100, o: 184, h: 170, l: 190, c: 175 },
      { x: 305, o: 195, h: 185, l: 215, c: 210 },
      { x: 330, o: 210, h: 200, l: 235, c: 230 },
      { x: 355, o: 230, h: 215, l: 250, c: 220 }
    ];
    ctx.forEach(d => {
      svg.appendChild(candle(d.x, d.o, d.h, d.l, d.c, { dim: true, width: 8 }));
    });

    const liqY = 120;
    const liqEl = level(30, 370, liqY, 'red');
    hide(liqEl);
    svg.appendChild(liqEl);

    const liqLab = textLabel(40, liqY - 8, 'LIQUIDITY', {
      color: '#EF4444', size: 9, letterSpacing: 1.5, weight: 700
    });
    hide(liqLab);
    svg.appendChild(liqLab);

    // Hero candle dimensions
    const heroX = 200;
    const bodyW = 36;
    const heroOpen = 170;
    const heroClose = 215;
    const wickHigh = 80;
    const wickLow = 230;

    // Body (animates from small to final)
    const heroBody = el('rect', {
      class: 'c-bear',
      x: heroX - bodyW / 2,
      y: heroOpen - 2,
      width: bodyW,
      height: 4,
      rx: 2
    });
    hide(heroBody);
    svg.appendChild(heroBody);

    // Wicks
    const upperWick = el('line', {
      class: 'c-wick',
      x1: heroX, y1: heroOpen,
      x2: heroX, y2: heroOpen,
      'stroke-width': 2
    });
    svg.appendChild(upperWick);
    const lowerWick = el('line', {
      class: 'c-wick',
      x1: heroX, y1: heroOpen,
      x2: heroX, y2: heroOpen,
      'stroke-width': 2
    });
    svg.appendChild(lowerWick);

    // Anatomy labels
    const labWick = textLabel(heroX + 24, 95, '← WICK / PURGE', {
      color: '#D4AF37', size: 9, letterSpacing: 1, weight: 600
    });
    const labBody = textLabel(heroX + 24, 198, '← BODY / CLOSE', {
      color: '#8A93A6', size: 9, letterSpacing: 1, weight: 600
    });
    const grab = textLabel(heroX + 24, 75, 'LIQUIDITY GRAB', {
      color: '#EF4444', size: 10, weight: 700, letterSpacing: 1.5
    });
    [labWick, labBody, grab].forEach(l => { hide(l); svg.appendChild(l); });

    if (reduce || !hasST) {
      upperWick.setAttribute('y2', wickHigh);
      lowerWick.setAttribute('y2', wickLow);
      heroBody.setAttribute('y', heroOpen);
      heroBody.setAttribute('height', heroClose - heroOpen);
      heroBody.setAttribute('rx', 1);
      showAll(svg);
      return;
    }

    const t = tl(container);
    t.to(liqEl,  { opacity: 1, duration: 0.5 });
    t.to(liqLab, { opacity: 1, duration: 0.3 }, '<0.15');
    t.to(heroBody, { opacity: 1, duration: 0.2 }, '+=0.1');
    t.to(upperWick, {
      attr: { y2: wickHigh },
      duration: 0.55, ease: 'power3.out'
    }, '+=0.05');
    t.to(grab,    { opacity: 1, duration: 0.3 }, '-=0.2');
    t.to(labWick, { opacity: 1, duration: 0.3 }, '<0.1');
    t.to(heroBody, {
      attr: { y: heroOpen, height: heroClose - heroOpen },
      duration: 0.5, ease: 'power2.inOut'
    }, '+=0.2');
    t.to(lowerWick, {
      attr: { y2: wickLow },
      duration: 0.35, ease: 'power2.out'
    }, '-=0.15');
    t.to(labBody, { opacity: 1, duration: 0.3 }, '-=0.1');
  }

  // ============================================================
  //  SCENE 04 — CRT MODELS & CONFIRMATIONS
  //  2×2 grid: each cell shows a mini setup. Gold check chip
  //  drops over each as it "confirms".
  // ============================================================

  function buildModels(svg, container) {
    const cellW = 200, cellH = 150;
    const variants = [
      { x: 0,   y: 0,   name: 'STANDARD',  shape: 'bull' },
      { x: 200, y: 0,   name: 'REVERSE',   shape: 'bear' },
      { x: 0,   y: 150, name: 'NESTED',    shape: 'bull' },
      { x: 200, y: 150, name: 'EXTENDED',  shape: 'bear' }
    ];
    const cells = [];

    variants.forEach(v => {
      const g = el('g', { transform: 'translate(' + v.x + ',' + v.y + ')' });
      hide(g);

      g.appendChild(el('rect', {
        x: 12, y: 12, width: cellW - 24, height: cellH - 24, rx: 4,
        fill: 'none', stroke: '#1E2632', 'stroke-width': 1
      }));

      const baseY = cellH / 2;
      const isBull = v.shape === 'bull';
      const closes = isBull ? [-18, -6, -28] : [18, 6, 28];

      [0, 1, 2].forEach(k => {
        const cx = 55 + k * 40;
        const o = baseY;
        const c = baseY + closes[k];
        const h = Math.min(o, c) - 8;
        const l = Math.max(o, c) + 8;
        g.appendChild(candle(cx, o, h, l, c, { width: 12 }));
      });

      const zoneY = isBull ? baseY + 6 : baseY - 30;
      g.appendChild(el('rect', {
        x: 30, y: zoneY, width: 140, height: 26, rx: 2,
        fill: '#D4AF37', 'fill-opacity': 0.08
      }));

      g.appendChild(textLabel(cellW / 2, cellH - 18, v.name, {
        color: '#8A93A6', size: 10, anchor: 'middle', letterSpacing: 2, weight: 700
      }));

      // Gold check chip (initially hidden)
      const chip = el('g', { transform: 'translate(' + (cellW - 32) + ',26)', opacity: 0 });
      chip.appendChild(el('circle', { cx: 0, cy: 0, r: 10, fill: '#D4AF37' }));
      chip.appendChild(el('path', {
        d: 'M -4 0 L -1 3 L 4 -3',
        stroke: '#1B1503', 'stroke-width': 2,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        fill: 'none'
      }));
      g.appendChild(chip);

      svg.appendChild(g);
      cells.push({ g: g, chip: chip });
    });

    if (reduce || !hasST) {
      cells.forEach(c => { c.g.style.opacity = 1; c.chip.setAttribute('opacity', 1); });
      return;
    }

    const t = tl(container);
    cells.forEach((c, i) => {
      t.to(c.g, { opacity: 1, duration: 0.4, ease: 'power2.out' }, i * 0.18);
      t.to(c.chip, {
        attr: { opacity: 1 },
        scale: 1,
        transformOrigin: '50% 50%',
        duration: 0.35,
        ease: 'back.out(2)'
      }, i * 0.18 + 0.25);
    });
  }

  // ============================================================
  //  SCENE 05 — LIQUIDITY & MARKET BEHAVIOR
  //  Buyside / sellside lines appear. Sweep arrow up through
  //  buyside, then down through sellside. Caption fades in.
  // ============================================================

  function buildLiquidity(svg, container) {
    const data = [
      { x: 30,  o: 155, h: 145, l: 165, c: 150 },
      { x: 52,  o: 150, h: 138, l: 158, c: 142 },
      { x: 74,  o: 142, h: 130, l: 148, c: 134 },
      { x: 96,  o: 134, h: 128, l: 142, c: 138 },
      { x: 118, o: 138, h: 125, l: 145, c: 130 },
      { x: 140, o: 130, h: 122, l: 140, c: 125 },
      { x: 162, o: 125, h: 95,  l: 132, c: 128 },  // sweeps buyside
      { x: 184, o: 128, h: 122, l: 140, c: 138 },
      { x: 206, o: 138, h: 132, l: 158, c: 152 },
      { x: 228, o: 152, h: 148, l: 175, c: 170 },
      { x: 250, o: 170, h: 165, l: 195, c: 192 },
      { x: 272, o: 192, h: 188, l: 220, c: 215 }   // sweeps sellside
    ];

    const buyY = 100;
    const sellY = 210;

    const buyLine = level(20, 305, buyY, 'green');
    hide(buyLine);
    svg.appendChild(buyLine);
    const buyChip = priceLabel(312, buyY, 'BUYSIDE', 'green');
    hide(buyChip);
    svg.appendChild(buyChip);

    const sellLine = level(20, 305, sellY, 'red');
    hide(sellLine);
    svg.appendChild(sellLine);
    const sellChip = priceLabel(312, sellY, 'SELLSIDE', 'red');
    hide(sellChip);
    svg.appendChild(sellChip);

    const candleEls = data.map(d => {
      const g = candle(d.x, d.o, d.h, d.l, d.c);
      hide(g);
      svg.appendChild(g);
      return g;
    });

    const arrowUp = arrow(140, 130, 162, 100, 'green');
    const arrowDown = arrow(250, 180, 272, 215, 'red');
    hide(arrowUp); hide(arrowDown);
    svg.appendChild(arrowUp); svg.appendChild(arrowDown);

    const caption = textLabel(W / 2, 278, 'HUNT  →  REVERSE  →  HUNT', {
      color: '#D4AF37', size: 10, anchor: 'middle', letterSpacing: 3, weight: 700
    });
    hide(caption);
    svg.appendChild(caption);

    if (reduce || !hasST) { showAll(svg); return; }

    const t = tl(container);
    t.to(candleEls.slice(0, 6), { opacity: 1, duration: 0.3, stagger: 0.05 });
    t.to([buyLine, sellLine], { opacity: 1, duration: 0.4 }, '-=0.15');
    t.to([buyChip, sellChip], { opacity: 1, duration: 0.35, stagger: 0.1 }, '-=0.25');

    t.to(arrowUp, { opacity: 1, duration: 0.3 }, '+=0.15');
    t.to(candleEls[6], { opacity: 1, duration: 0.35, ease: 'power2.out' }, '<0.1');
    t.to(candleEls.slice(7, 11), { opacity: 1, duration: 0.3, stagger: 0.06 });

    t.to(candleEls[11], { opacity: 1, duration: 0.35 }, '+=0.05');
    t.to(arrowDown, { opacity: 1, duration: 0.3 }, '<0.05');

    t.to(caption, { opacity: 1, duration: 0.4 }, '+=0.15');
  }

  // ============================================================
  //  SCENE 06 — ADVANCED CRT EXECUTION
  //  Entry / Stop / Target levels with labels. Price walks
  //  toward target while R-multiple counter ticks up.
  // ============================================================

  function buildExecution(svg, container) {
    const entryY = 180;
    const stopY = 215;
    const targetY = 90;

    const setupData = [
      { x: 30,  o: 200, h: 192, l: 208, c: 195 },
      { x: 52,  o: 195, h: 188, l: 202, c: 190 },
      { x: 74,  o: 190, h: 178, l: 196, c: 182 },
      { x: 96,  o: 182, h: 170, l: 195, c: 178 },
      { x: 118, o: 178, h: 168, l: 210, c: 195 },
      { x: 140, o: 195, h: 175, l: 200, c: 180 }
    ];

    const movingData = [
      { x: 162, o: 180, h: 168, l: 185, c: 172 },
      { x: 184, o: 172, h: 158, l: 178, c: 162 },
      { x: 206, o: 162, h: 145, l: 168, c: 150 },
      { x: 228, o: 150, h: 132, l: 158, c: 138 },
      { x: 250, o: 138, h: 118, l: 145, c: 122 },
      { x: 272, o: 122, h: 95,  l: 130, c: 100 }
    ];

    const entryLine = level(20, 305, entryY, 'gold');
    const stopLine = level(20, 305, stopY, 'red');
    const targetLine = level(20, 305, targetY, 'green');
    [entryLine, stopLine, targetLine].forEach(l => { hide(l); svg.appendChild(l); });

    const entryChip = priceLabel(312, entryY, 'ENTRY', 'gold');
    const stopChip = priceLabel(312, stopY, 'STOP', 'red');
    const targetChip = priceLabel(312, targetY, 'TARGET', 'green');
    [entryChip, stopChip, targetChip].forEach(c => { hide(c); svg.appendChild(c); });

    const setupEls = setupData.map(d => {
      const g = candle(d.x, d.o, d.h, d.l, d.c);
      hide(g);
      svg.appendChild(g);
      return g;
    });
    const movingEls = movingData.map(d => {
      const g = candle(d.x, d.o, d.h, d.l, d.c);
      hide(g);
      svg.appendChild(g);
      return g;
    });

    // R-multiple counter (top-right)
    const counterBg = el('rect', {
      x: 285, y: 18, width: 90, height: 38, rx: 4,
      fill: '#0A0E14', stroke: '#D4AF37', 'stroke-width': 1
    });
    hide(counterBg);
    svg.appendChild(counterBg);
    const counterLabel = textLabel(330, 30, 'R MULTIPLE', {
      color: '#8A93A6', size: 6, anchor: 'middle', letterSpacing: 1.5
    });
    hide(counterLabel);
    svg.appendChild(counterLabel);
    const counterText = el('text', {
      x: 330, y: 49,
      'text-anchor': 'middle',
      fill: '#D4AF37',
      'font-family': 'Space Grotesk, sans-serif',
      'font-size': 14, 'font-weight': 700
    });
    counterText.appendChild(document.createTextNode('0.0R'));
    hide(counterText);
    svg.appendChild(counterText);

    if (reduce || !hasST) {
      showAll(svg);
      counterText.firstChild.nodeValue = '3.6R';
      return;
    }

    const t = tl(container);
    t.to(setupEls, { opacity: 1, duration: 0.3, stagger: 0.05 });
    t.to([entryLine, stopLine, targetLine], {
      opacity: 1, duration: 0.5, stagger: 0.12
    }, '+=0.1');
    t.to([entryChip, stopChip, targetChip], {
      opacity: 1, duration: 0.3, stagger: 0.12
    }, '-=0.45');

    t.to([counterBg, counterLabel, counterText], {
      opacity: 1, duration: 0.3
    }, '-=0.1');

    const rValue = { v: 0 };
    movingEls.forEach((g, i) => {
      t.to(g, { opacity: 1, duration: 0.28, ease: 'power2.out' }, '+=0.04');
      t.to(rValue, {
        v: (i + 1) * 0.6,
        duration: 0.28,
        onUpdate: function () {
          counterText.firstChild.nodeValue = rValue.v.toFixed(1) + 'R';
        }
      }, '<');
    });
  }

  // ============================================================
  //  SCENE 07 — PREMIUM SECRET (LOCKED)
  //  Gold radial backdrop, gold-tinted candles, redact bar with
  //  big "?" over the secret zone, lock icon, gold shimmer sweep.
  // ============================================================

  function buildPremium(svg, container) {
    const defs = el('defs');
    const gradId = 'premium-grad-' + Math.random().toString(36).slice(2, 8);
    const grad = el('radialGradient', { id: gradId, cx: '50%', cy: '50%', r: '60%' });
    grad.appendChild(el('stop', { offset: '0%',  'stop-color': '#D4AF37', 'stop-opacity': 0.22 }));
    grad.appendChild(el('stop', { offset: '100%', 'stop-color': '#D4AF37', 'stop-opacity': 0 }));
    defs.appendChild(grad);

    const shimmerId = 'shimmer-grad-' + Math.random().toString(36).slice(2, 8);
    const shimmerGrad = el('linearGradient', { id: shimmerId, x1: '0%', y1: '0%', x2: '100%', y2: '0%' });
    shimmerGrad.appendChild(el('stop', { offset: '0%',  'stop-color': '#D4AF37', 'stop-opacity': 0 }));
    shimmerGrad.appendChild(el('stop', { offset: '50%', 'stop-color': '#D4AF37', 'stop-opacity': 0.45 }));
    shimmerGrad.appendChild(el('stop', { offset: '100%', 'stop-color': '#D4AF37', 'stop-opacity': 0 }));
    defs.appendChild(shimmerGrad);

    svg.appendChild(defs);

    // Gold backdrop glow
    svg.appendChild(el('rect', {
      x: 0, y: 0, width: W, height: H, fill: 'url(#' + gradId + ')'
    }));

    // Gold-tinted candles (visible at reduced opacity)
    const data = [
      { x: 30,  o: 200, h: 185, l: 210, c: 188 },
      { x: 55,  o: 188, h: 170, l: 195, c: 175 },
      { x: 80,  o: 175, h: 160, l: 182, c: 165 },
      { x: 105, o: 165, h: 150, l: 175, c: 158 },
      { x: 130, o: 158, h: 145, l: 168, c: 148 },
      { x: 155, o: 148, h: 135, l: 160, c: 140 },
      { x: 245, o: 140, h: 128, l: 152, c: 132 },
      { x: 270, o: 132, h: 120, l: 142, c: 124 },
      { x: 295, o: 124, h: 110, l: 135, c: 115 },
      { x: 320, o: 115, h: 100, l: 125, c: 105 },
      { x: 345, o: 105, h: 90,  l: 118, c: 95  }
    ];
    data.forEach(d => {
      const g = candle(d.x, d.o, d.h, d.l, d.c, { tone: 'gold' });
      g.style.opacity = 0.55;
      svg.appendChild(g);
    });

    // Redact bar
    const redactBar = el('rect', {
      x: 170, y: 70, width: 70, height: 180, rx: 2,
      fill: '#0A0E14',
      stroke: '#D4AF37', 'stroke-width': 1,
      'stroke-dasharray': 4
    });
    svg.appendChild(redactBar);

    // Big "?" in the redacted zone
    const qmark = el('text', {
      x: 205, y: 178,
      'text-anchor': 'middle',
      fill: '#D4AF37',
      'font-family': 'Space Grotesk, sans-serif',
      'font-size': 64,
      'font-weight': 700,
      opacity: 0.55
    });
    qmark.appendChild(document.createTextNode('?'));
    svg.appendChild(qmark);

    // Lock icon (top-left)
    const lockG = el('g', { transform: 'translate(20, 22)' });
    lockG.appendChild(el('rect', {
      x: 0, y: 8, width: 18, height: 14, rx: 2, fill: '#D4AF37'
    }));
    lockG.appendChild(el('path', {
      d: 'M 3 8 L 3 5 A 6 6 0 0 1 15 5 L 15 8',
      fill: 'none', stroke: '#D4AF37', 'stroke-width': 2
    }));
    svg.appendChild(lockG);

    svg.appendChild(textLabel(46, 35, 'PREMIUM ONLY', {
      color: '#D4AF37', size: 10, weight: 700, letterSpacing: 2
    }));

    // Shimmer
    const shimmer = el('rect', {
      x: -120, y: 0, width: 120, height: H,
      fill: 'url(#' + shimmerId + ')'
    });
    svg.appendChild(shimmer);

    if (reduce || !hasGsap) return;

    // Pause continuous animations when off-screen for perf
    const loops = [];
    loops.push(gsap.to(shimmer, {
      attr: { x: W }, duration: 3.2, repeat: -1, repeatDelay: 1.8, ease: 'power2.inOut', paused: true
    }));
    loops.push(gsap.to(qmark, {
      attr: { opacity: 0.9 }, duration: 1.4, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true
    }));
    loops.push(gsap.to(redactBar, {
      attr: { 'stroke-dashoffset': -40 }, duration: 4, repeat: -1, ease: 'none', paused: true
    }));

    if (hasST) {
      ScrollTrigger.create({
        trigger: container,
        start: 'top bottom',
        end: 'bottom top',
        onEnter:    () => loops.forEach(t => t.play()),
        onEnterBack:() => loops.forEach(t => t.play()),
        onLeave:    () => loops.forEach(t => t.pause()),
        onLeaveBack:() => loops.forEach(t => t.pause())
      });
    } else {
      loops.forEach(t => t.play());
    }
  }

  // ---------- Init ----------

  const builders = {
    foundations: buildFoundations,
    sessions:    buildSessions,
    purge:       buildPurge,
    models:      buildModels,
    liquidity:   buildLiquidity,
    execution:   buildExecution,
    premium:     buildPremium
  };

  function init() {
    document.querySelectorAll('[data-chart]').forEach(container => {
      const type = container.dataset.chart;
      const builder = builders[type];
      if (!builder) return;
      if (container.querySelector('svg')) return; // avoid double-render
      const svg = createSvg();
      container.appendChild(svg);
      try { builder(svg, container); }
      catch (err) { /* fail soft so one bad chart doesn't break others */ }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
