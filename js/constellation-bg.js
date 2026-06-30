/* The Khan Trading - constellation-bg.js
   Shared animated constellation background engine.

   Drifting gold/green particles laid out on a jittered grid (no dead zones),
   depth layers (a near/far star-field), proximity links drawn as gold↔green
   gradients, floating aurora orbs, cursor pull + a cursor "constellation", and
   occasional shooting-star streaks. Used by the hero (js/hero-bg.js) and the
   Honest Filter section (js/why-section.js) so both share one design.

     window.KhanConstellation(rootEl, canvasEl, opts) -> { destroy() }

   opts (all optional):
     density       particle-count multiplier (default 1)
     intensity     global glow/alpha multiplier (default 1)
     speed         time multiplier (default 1)
     palette       array of "r,g,b" node hues (default gold + green)
     orbs          aurora-orb config array (default 4 brand orbs)
     baseWash      paint the dark navy base gradient (default true)
     depthLayers   spread particles across depth bands (default true)
     shootingStars enable streaks (default false; off on coarse/reduced-motion)
     cursorLinks   link nearby nodes to the mouse (default true on fine pointers)
*/
(function () {
  'use strict';

  var GOLD = '212,175,55';
  var GREEN = '52,211,120';
  var CORE = '255,250,235'; // warm-white bright core for sharper "stars"

  function KhanConstellation(root, canvas, opts) {
    if (!root || !canvas) return null;
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;
    opts = opts || {};

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var coarse = window.matchMedia('(pointer: coarse)').matches;

    var intensity = opts.intensity != null ? opts.intensity : 1;
    var speed = opts.speed != null ? opts.speed : 1;
    var density = opts.density != null ? opts.density : 1;
    var baseWash = opts.baseWash !== false;
    var depthLayers = opts.depthLayers !== false;
    var palette = opts.palette || [GOLD, GREEN];
    var wantStars = !!opts.shootingStars && !reduce && !coarse;
    var wantCursorLinks = opts.cursorLinks !== false && !coarse && !reduce;

    // ---- sizing (mobile uses a lower DPR + particle budget) ----
    var mqMobile = window.matchMedia('(max-width: 760px)');
    var isMobile = mqMobile.matches;
    var dprCap = function () { return isMobile ? 1.5 : 2; };
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, dprCap());

    function resize() {
      var r = root.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      isMobile = mqMobile.matches;
      dpr = Math.min(window.devicePixelRatio || 1, dprCap());
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    // ---- particle constellation, placed on a jittered grid ----
    // Stratified sampling guarantees even coverage (no empty patches); each
    // cell holds one jittered node. depth ∈ [0,1]: far = small/dim/slow,
    // near = larger/brighter/faster, giving a layered star-field.
    var particles = [];
    function makeParticles() {
      var area = W * H;
      var baseCount = isMobile
        ? Math.max(18, Math.min(42, Math.round(area / 24000)))
        : Math.max(54, Math.min(140, Math.round(area / 13000)));
      var count = Math.max(8, Math.round(baseCount * density));
      var aspect = W / Math.max(1, H);
      var rows = Math.max(2, Math.round(Math.sqrt(count / aspect)));
      var cols = Math.max(2, Math.ceil(count / rows));
      var cw = W / cols, ch = H / rows;
      particles = [];
      for (var gy = 0; gy < rows; gy++) {
        for (var gx = 0; gx < cols; gx++) {
          if (particles.length >= count) break;
          var depth = depthLayers ? Math.random() : 0.6 + Math.random() * 0.4;
          var hue = palette[(Math.random() * palette.length) | 0];
          var sp = 0.12 + depth * 0.34;
          var bvx = (Math.random() - 0.5) * sp;
          var bvy = -(0.05 + Math.random() * sp);
          particles.push({
            x: gx * cw + Math.random() * cw,
            y: gy * ch + Math.random() * ch,
            vx: bvx, vy: bvy, bvx: bvx, bvy: bvy, ex: 0,
            depth: depth,
            r: 0.6 + depth * 1.8,
            hue: hue,
            tw: Math.random() * Math.PI * 2,
            ts: 0.6 + Math.random() * 1.6
          });
        }
      }
    }
    makeParticles();

    // ---- aurora orbs (additive radial washes) ----
    var orbs = opts.orbs || [
      { hue: GOLD,        cx: 0.26, cy: 0.18, r: 0.46, ax: 0.05, ay: 0.04, sx: 0.11, sy: 0.07, ph: 0.0, a: 0.34 },
      { hue: GREEN,       cx: 0.78, cy: 0.30, r: 0.40, ax: 0.06, ay: 0.05, sx: 0.09, sy: 0.13, ph: 1.7, a: 0.26 },
      { hue: GOLD,        cx: 0.62, cy: 0.82, r: 0.42, ax: 0.07, ay: 0.04, sx: 0.07, sy: 0.10, ph: 3.1, a: 0.20 },
      { hue: '239,68,68', cx: 0.14, cy: 0.74, r: 0.34, ax: 0.05, ay: 0.05, sx: 0.13, sy: 0.08, ph: 4.4, a: 0.14 }
    ];

    // ---- shooting stars ----
    var stars = [];
    var starTimer = 2 + Math.random() * 4;
    function spawnStar() {
      var fromLeft = Math.random() < 0.5;
      var y0 = Math.random() * H * 0.55;
      var x0 = fromLeft ? -40 : W + 40;
      var dirX = fromLeft ? 1 : -1;
      var len = W * (0.45 + Math.random() * 0.4);
      stars.push({
        x0: x0, y0: y0,
        x1: x0 + dirX * len,
        y1: y0 + (0.18 + Math.random() * 0.4) * len,
        life: 0, dur: 0.7 + Math.random() * 0.6,
        hue: Math.random() < 0.5 ? GOLD : GREEN
      });
    }

    // ---- cursor (mouse only; touch/pen leave no matching "leave" event) ----
    var mouse = { x: -9999, y: -9999, active: false };
    function onMove(e) {
      if (e.pointerType && e.pointerType !== 'mouse') { mouse.active = false; return; }
      var r = root.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.active = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    }
    function onLeave() { mouse.active = false; }

    var t = 0, raf = 0, visible = true;

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // base wash
      if (baseWash) {
        var base = ctx.createLinearGradient(0, 0, 0, H);
        base.addColorStop(0, '#0A0E14');
        base.addColorStop(1, '#080B11');
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, W, H);
      }

      // aurora orbs - only the first 2 on mobile (each is a full-canvas fill)
      var orbCount = isMobile ? Math.min(2, orbs.length) : orbs.length;
      ctx.globalCompositeOperation = 'lighter';
      for (var k = 0; k < orbCount; k++) {
        var o = orbs[k];
        var ox = (o.cx + Math.sin(t * o.sx + o.ph) * o.ax) * W;
        var oy = (o.cy + Math.cos(t * o.sy + o.ph) * o.ay) * H;
        var orad = o.r * Math.max(W, H);
        var og = ctx.createRadialGradient(ox, oy, 0, ox, oy, orad);
        var oa = o.a * intensity;
        og.addColorStop(0, 'rgba(' + o.hue + ',' + oa + ')');
        og.addColorStop(0.5, 'rgba(' + o.hue + ',' + (oa * 0.35) + ')');
        og.addColorStop(1, 'rgba(' + o.hue + ',0)');
        ctx.fillStyle = og;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.globalCompositeOperation = 'source-over';

      // advance particles (+ cursor pull)
      var dt = reduce ? 0 : 1;
      var linkDist = Math.min(158, Math.max(100, W * 0.10));
      var pullR = Math.min(210, Math.max(140, W * 0.15));
      var i, p, j;
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        p.vx = p.vx * 0.9 + p.bvx * 0.1;
        p.vy = p.vy * 0.9 + p.bvy * 0.1;
        var near = 0;
        if (mouse.active && !reduce) {
          var dx = mouse.x - p.x, dy = mouse.y - p.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < pullR * pullR) {
            var d = Math.sqrt(d2) || 1;
            near = 1 - d / pullR;
            var f = near * 0.85 * (0.5 + p.depth);
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        }
        p.ex += (near - p.ex) * 0.12;
        var spd = Math.hypot(p.vx, p.vy), max = 3.4;
        if (spd > max) { p.vx = p.vx / spd * max; p.vy = p.vy / spd * max; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.y < -12) { p.y = H + 12; p.x = Math.random() * W; }
        else if (p.y > H + 12) { p.y = -12; p.x = Math.random() * W; }
        if (p.x < -12) p.x = W + 12; else if (p.x > W + 12) p.x = -12;
      }

      // proximity links - gold↔green gradient on desktop, flat on mobile
      ctx.lineWidth = 1;
      for (i = 0; i < particles.length; i++) {
        var pa = particles[i];
        for (j = i + 1; j < particles.length; j++) {
          var pb = particles[j];
          var lx = pa.x - pb.x, ly = pa.y - pb.y;
          var ld2 = lx * lx + ly * ly;
          if (ld2 < linkDist * linkDist) {
            var ld = Math.sqrt(ld2);
            var al = (1 - ld / linkDist) * 0.18 * intensity;
            if (isMobile || pa.hue === pb.hue) {
              ctx.strokeStyle = 'rgba(' + pa.hue + ',' + al + ')';
            } else {
              var lg = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y);
              lg.addColorStop(0, 'rgba(' + pa.hue + ',' + al + ')');
              lg.addColorStop(1, 'rgba(' + pb.hue + ',' + al + ')');
              ctx.strokeStyle = lg;
            }
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          }
        }
      }

      // cursor constellation - bright gold links from nearby nodes to the cursor
      if (wantCursorLinks && mouse.active) {
        var cR = pullR * 1.15;
        ctx.lineWidth = 1.1;
        for (i = 0; i < particles.length; i++) {
          p = particles[i];
          var mdx = mouse.x - p.x, mdy = mouse.y - p.y;
          var md2 = mdx * mdx + mdy * mdy;
          if (md2 < cR * cR) {
            var ca = (1 - Math.sqrt(md2) / cR) * 0.5 * intensity;
            ctx.strokeStyle = 'rgba(' + GOLD + ',' + ca + ')';
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
        }
        ctx.globalCompositeOperation = 'lighter';
        var cg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 28);
        cg.addColorStop(0, 'rgba(' + GOLD + ',' + (0.5 * intensity) + ')');
        cg.addColorStop(1, 'rgba(' + GOLD + ',0)');
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 28, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }

      // nodes - additive glow + a warm-white core on the near layer
      ctx.globalCompositeOperation = 'lighter';
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        var tw = 0.55 + 0.45 * Math.sin(t * p.ts + p.tw);
        var na = (tw * 0.85 + p.ex * 0.6) * intensity;
        var nrad = p.r * 4 * (1 + p.ex * 0.9);
        var ng = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, nrad);
        ng.addColorStop(0, 'rgba(' + p.hue + ',' + na + ')');
        ng.addColorStop(1, 'rgba(' + p.hue + ',0)');
        ctx.fillStyle = ng;
        ctx.beginPath();
        ctx.arc(p.x, p.y, nrad, 0, Math.PI * 2);
        ctx.fill();
        if (p.depth > 0.45) {
          var coreA = Math.min(1, (0.35 + tw * 0.5 + p.ex) * intensity) * 0.9;
          ctx.fillStyle = 'rgba(' + CORE + ',' + coreA + ')';
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.5, p.r * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // shooting stars - streak with a fading tail + bright head
      if (wantStars) {
        for (i = stars.length - 1; i >= 0; i--) {
          var s = stars[i];
          s.life += 0.016 * speed;
          var prog = s.life / s.dur;
          if (prog >= 1) { stars.splice(i, 1); continue; }
          var hx = s.x0 + (s.x1 - s.x0) * prog;
          var hy = s.y0 + (s.y1 - s.y0) * prog;
          var tp = Math.max(0, prog - 0.10);
          var tx = s.x0 + (s.x1 - s.x0) * tp;
          var ty = s.y0 + (s.y1 - s.y0) * tp;
          var fade = Math.sin(prog * Math.PI);
          var sg = ctx.createLinearGradient(tx, ty, hx, hy);
          sg.addColorStop(0, 'rgba(' + s.hue + ',0)');
          sg.addColorStop(1, 'rgba(' + s.hue + ',' + (0.9 * fade * intensity) + ')');
          ctx.strokeStyle = sg;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(tx, ty); ctx.lineTo(hx, hy);
          ctx.stroke();
          ctx.fillStyle = 'rgba(' + CORE + ',' + (0.95 * fade) + ')';
          ctx.beginPath(); ctx.arc(hx, hy, 1.7, 0, Math.PI * 2); ctx.fill();
        }
      }

      ctx.globalCompositeOperation = 'source-over';
    }

    // Self-stopping RAF: runs only while visible and the tab is foregrounded.
    function frame() {
      raf = 0;
      if (reduce || !visible || document.hidden) return;
      t += 0.016 * speed;
      if (wantStars) {
        starTimer -= 0.016 * speed;
        if (starTimer <= 0 && stars.length < 2) {
          spawnStar();
          starTimer = 4 + Math.random() * 6;
        }
      }
      draw();
      raf = requestAnimationFrame(frame);
    }
    function kick() {
      if (reduce || !visible || document.hidden) return;
      if (!raf) raf = requestAnimationFrame(frame);
    }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

    // ---- observers / listeners ----
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('blur', onLeave);
    var onVis = function () { if (!document.hidden) kick(); };
    document.addEventListener('visibilitychange', onVis);

    var ro = null, io = null, onResize = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () { resize(); makeParticles(); kick(); });
      ro.observe(root);
    } else {
      onResize = function () { resize(); makeParticles(); kick(); };
      window.addEventListener('resize', onResize, { passive: true });
    }
    if (window.IntersectionObserver) {
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { visible = e.isIntersecting; });
        if (visible) kick();
      }, { threshold: 0 });
      io.observe(root);
    }

    // First paint. Reduced motion renders a single composed frame, no loop.
    if (reduce) { t = 2.2; draw(); }
    else { draw(); kick(); }

    return {
      destroy: function () {
        stop();
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('blur', onLeave);
        document.removeEventListener('visibilitychange', onVis);
        if (ro) ro.disconnect();
        if (io) io.disconnect();
        if (onResize) window.removeEventListener('resize', onResize);
      }
    };
  }

  window.KhanConstellation = KhanConstellation;
})();
