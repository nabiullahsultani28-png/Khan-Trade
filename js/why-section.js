/* Why Different / Honest Filter — scroll-reveal + animated canvas background
   (design: WhyDifferent.dc.html + AnimatedBackground.jsx, grid & price-line off). */
(function () {
  var root = document.getElementById('khan-why');
  if (!root) return;

  // Accent that drives the feature-card hover glow (gold by default).
  root.style.setProperty('--ka', '212,175,55');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  setupReveal(root);
  setupBackground(root);

  /* ---------- scroll-reveal ---------- */
  function setupReveal(root) {
    var els = Array.from(root.querySelectorAll('[data-reveal]'));

    // Marking [data-js] activates the hidden/offset CSS — content is never stuck
    // hidden if scripting never runs.
    root.setAttribute('data-js', '');

    if (reduce) { els.forEach(function (el) { el.setAttribute('data-in', ''); }); return; }

    var onScroll = null;
    function show(el) {
      el.setAttribute('data-in', '');
      // Pin the visible resting state after the entrance has had time to play,
      // so a frozen/never-composited transition can't leave content hidden.
      setTimeout(function () { el.setAttribute('data-shown', ''); }, 1300);
    }
    function reveal() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var remaining = false;
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (el.hasAttribute('data-in')) continue;
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.88 && r.bottom > 0) show(el);
        else remaining = true;
      }
      if (!remaining && onScroll) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        onScroll = null;
      }
    }
    onScroll = reveal;
    window.addEventListener('scroll', reveal, { passive: true });
    window.addEventListener('resize', reveal, { passive: true });

    // Commit the hidden base state to a paint BEFORE adding data-in so the
    // entrance transition actually fires for above-the-fold elements.
    void root.offsetHeight;
    setTimeout(reveal, 50);
  }

  /* ---------- animated background canvas ---------- */
  function setupBackground(root) {
    var canvas = root.querySelector('[data-khan-why-bg]');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var intensity = 1, speed = 1;

    // Mobile scaling: lower DPR, fewer particles, fewer aurora orbs. Re-evaluated
    // on resize so a rotation / breakpoint change picks the right budget.
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
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { resize(); makeParticles(); });
      ro.observe(root);
    } else {
      window.addEventListener('resize', function () { resize(); makeParticles(); }, { passive: true });
    }

    // ---- particle constellation ----
    var particles = [];
    function makeParticles() {
      // Desktop: 46–120 scaled to area. Mobile: hard-capped low to keep the
      // O(n²) link pass and per-particle gradient allocation cheap.
      var count = isMobile
        ? Math.max(16, Math.min(30, Math.round((W * H) / 26000)))
        : Math.max(46, Math.min(120, Math.round((W * H) / 15000)));
      particles = [];
      for (var i = 0; i < count; i++) {
        var gold = Math.random() < 0.5;
        var bvx = (Math.random() - 0.5) * 0.34;
        var bvy = -0.12 - Math.random() * 0.34;
        particles.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: bvx, vy: bvy, bvx: bvx, bvy: bvy, ex: 0,
          r: 0.8 + Math.random() * 1.8,
          hue: gold ? '212,175,55' : '52,211,120',
          tw: Math.random() * Math.PI * 2,
          ts: 0.6 + Math.random() * 1.6
        });
      }
    }
    makeParticles();

    // ---- aurora orbs ----
    var orbs = [
      { hue: '212,175,55', cx: 0.26, cy: 0.18, r: 0.46, ax: 0.05, ay: 0.04, sx: 0.11, sy: 0.07, ph: 0.0, a: 0.30 },
      { hue: '34,197,94', cx: 0.78, cy: 0.30, r: 0.40, ax: 0.06, ay: 0.05, sx: 0.09, sy: 0.13, ph: 1.7, a: 0.24 },
      { hue: '212,175,55', cx: 0.62, cy: 0.82, r: 0.42, ax: 0.07, ay: 0.04, sx: 0.07, sy: 0.10, ph: 3.1, a: 0.18 },
      { hue: '239,68,68', cx: 0.14, cy: 0.74, r: 0.34, ax: 0.05, ay: 0.05, sx: 0.13, sy: 0.08, ph: 4.4, a: 0.13 }
    ];

    var t = 0, raf = 0, visible = true;

    // ---- cursor tracking (mouse only) ----
    // Touch/pen are ignored: a tap fires a single pointermove with no matching
    // "leave", which would leave a particle stuck/glowing at the tap point on
    // mobile. Hover-pull stays enabled for real mice on desktop/hybrid devices.
    var mouse = { x: -9999, y: -9999, active: false };
    function onMove(e) {
      if (e.pointerType && e.pointerType !== 'mouse') { mouse.active = false; return; }
      var r = root.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.active = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    }
    function onLeave() { mouse.active = false; }
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('blur', onLeave);
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { visible = e.isIntersecting; });
      }, { threshold: 0 });
      io.observe(root);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // base wash
      var base = ctx.createLinearGradient(0, 0, 0, H);
      base.addColorStop(0, '#0A0E14');
      base.addColorStop(1, '#080B11');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, W, H);

      // aurora orbs (additive glow) — only the first 2 (gold + green) on mobile,
      // since each is a full-canvas radial-gradient fill (fill-rate heavy).
      var orbCount = isMobile ? 2 : orbs.length;
      ctx.globalCompositeOperation = 'lighter';
      for (var k = 0; k < orbCount; k++) {
        var o = orbs[k];
        var x = (o.cx + Math.sin(t * o.sx + o.ph) * o.ax) * W;
        var y = (o.cy + Math.cos(t * o.sy + o.ph) * o.ay) * H;
        var rad = o.r * Math.max(W, H);
        var g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        var a = o.a * intensity;
        g.addColorStop(0, 'rgba(' + o.hue + ',' + a + ')');
        g.addColorStop(0.5, 'rgba(' + o.hue + ',' + (a * 0.35) + ')');
        g.addColorStop(1, 'rgba(' + o.hue + ',0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.globalCompositeOperation = 'source-over';

      // particle constellation — drifting nodes + proximity links + cursor pull
      var dt = reduce ? 0 : 1;
      var linkDist = Math.min(150, Math.max(96, W * 0.10));
      var pullR = Math.min(200, Math.max(130, W * 0.15));
      var i, p;
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
            var f = near * 0.85;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        }
        p.ex += (near - p.ex) * 0.12;
        var sp = Math.hypot(p.vx, p.vy), max = 3.2;
        if (sp > max) { p.vx = p.vx / sp * max; p.vy = p.vy / sp * max; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        else if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
      }
      // links
      ctx.lineWidth = 1;
      for (i = 0; i < particles.length; i++) {
        var pa = particles[i];
        for (var j = i + 1; j < particles.length; j++) {
          var pb = particles[j];
          var lx = pa.x - pb.x, ly = pa.y - pb.y;
          var ld2 = lx * lx + ly * ly;
          if (ld2 < linkDist * linkDist) {
            var ld = Math.sqrt(ld2);
            var al = (1 - ld / linkDist) * 0.16 * intensity;
            ctx.strokeStyle = 'rgba(160,180,210,' + al + ')';
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          }
        }
      }
      // nodes (additive glow)
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
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    function loop() {
      if (visible) { t += 0.016 * speed; draw(); }
      raf = requestAnimationFrame(loop);
    }

    if (reduce) { t = 2.2; draw(); }
    else { draw(); raf = requestAnimationFrame(loop); }
  }
})();
