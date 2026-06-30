(function () {
  var root = document.getElementById('ict');
  if (!root) return;

  var _raf = null, _onScroll = null, _onResize = null;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  setupReveal(root);
  setupCanvas(root);

  function setupReveal(root) {
    root.setAttribute('data-js', '');
    var els = Array.from(root.querySelectorAll('[data-reveal]'));
    function show(el) { el.setAttribute('data-in', ''); }
    if (reduce) { els.forEach(show); return; }

    function reveal() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var remaining = false;
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (el.hasAttribute('data-in')) continue;
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.9) show(el);
        else remaining = true;
      }
      if (!remaining && _onScroll) {
        window.removeEventListener('scroll', _onScroll);
        window.removeEventListener('resize', _onScroll);
        _onScroll = null;
      }
    }
    _onScroll = reveal;
    window.addEventListener('scroll', reveal, { passive: true });
    window.addEventListener('resize', reveal, { passive: true });
    reveal();
  }

  function setupCanvas(root) {
    var cv = root.querySelector('[data-khan-bg]');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var secEl = root;

    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function hash(n) { var s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); }

    var w = 0, h = 0, dpr = 1, small = false;
    var step = 22, colW = 12, bandH = 0;
    var series = [], minP = 0, maxP = 1, chartW = 0, chartCY = 0;
    var progS = 0, progT = 0;
    var N = 175;
    var onScreen = true;

    // Pre-rendered chart strip (built once per resize) + cached vignette.
    // The candle series is static, so we rasterize the whole chart once and
    // blit a window of it each frame instead of re-stroking every candle.
    var strip = null, sctx = null, cacheDpr = 1, vgrad = null;

    // Parallax tuning. PAN_SCALE keeps the horizontal travel small so the drift
    // stays subtle. EASE is high on purpose: the pan must track the scroll
    // position almost 1:1. A low EASE lags ~(1-EASE)/EASE frames behind the
    // scroll and keeps drifting after you stop, which reads as sluggish/floaty.
    var PAN_SCALE = 0.16;
    var EASE = 0.5;

    function baseAt(i) {
      var t = i / (N - 1);
      return 100 + Math.sin(t * Math.PI * 2 - Math.PI * 0.5) * 9 + Math.sin(t * Math.PI * 4.3 + 1.0) * 3.2;
    }

    function buildSeries() {
      series = [];
      var prev = baseAt(0);
      for (var i = 0; i < N; i++) {
        var o = prev;
        var bias = clamp((baseAt(i) - o) * 0.18, -0.42, 0.42);
        var up = hash(i * 7.31) < (0.5 + bias);
        var mag = 4.0 + hash(i * 2.17) * 6.5;
        var c = o + (up ? mag : -mag);
        var hi = Math.max(o, c) + 0.4 + hash(i * 4.41) * 2.2;
        var lo = Math.min(o, c) - 0.4 - hash(i * 6.63) * 2.2;
        series.push({ o: o, c: c, hi: hi, lo: lo, up: c >= o });
        prev = c;
      }
      minP = Infinity; maxP = -Infinity;
      for (var j = 0; j < series.length; j++) {
        if (series[j].lo < minP) minP = series[j].lo;
        if (series[j].hi > maxP) maxP = series[j].hi;
      }
      var pad = (maxP - minP) * 0.06;
      minP -= pad; maxP += pad;
    }

    function resize() {
      w = cv.clientWidth; h = cv.clientHeight; small = w < 640;
      dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      step = small ? 16 : 22;
      colW = Math.round(step * 0.56);
      var vph = window.innerHeight || h;
      bandH = vph * (small ? 0.78 : 0.88);
      buildSeries();
      chartW = N * step;
      buildStrip();
      buildVignette();
    }

    // Map a price to a y within the band [0, bandH]. minP→bandH, maxP→0, so the
    // full chart fits the strip exactly. The per-frame blit then offsets it by
    // (chartCY - bandH/2), reproducing the live yOf() positioning 1:1.
    function stripY(p) {
      return bandH / 2 + (0.5 - (p - minP) / (maxP - minP)) * bandH;
    }

    // Rasterize grid + every candle once into an offscreen strip the full width
    // of the chart. cacheDpr matches the screen dpr, so the blit is pixel-exact.
    function buildStrip() {
      cacheDpr = dpr;
      if (!strip) strip = document.createElement('canvas');
      strip.width = Math.max(1, Math.round(chartW * cacheDpr));
      strip.height = Math.max(1, Math.round(bandH * cacheDpr));
      sctx = strip.getContext('2d');
      sctx.setTransform(cacheDpr, 0, 0, cacheDpr, 0, 0);
      sctx.clearRect(0, 0, chartW, bandH);

      sctx.lineWidth = 1;
      sctx.strokeStyle = 'rgba(255,255,255,0.035)';
      var gh = bandH / 5;
      for (var gy = 0; gy <= bandH + 0.5; gy += gh) {
        sctx.beginPath(); sctx.moveTo(0, Math.round(gy) + 0.5); sctx.lineTo(chartW, Math.round(gy) + 0.5); sctx.stroke();
      }
      sctx.strokeStyle = 'rgba(255,255,255,0.02)';
      var gstep = step * 5;
      for (var gx = 0; gx <= chartW + 0.5; gx += gstep) {
        sctx.beginPath(); sctx.moveTo(Math.round(gx) + 0.5, 0); sctx.lineTo(Math.round(gx) + 0.5, bandH); sctx.stroke();
      }

      for (var i = 0; i < N; i++) {
        var k = series[i];
        var x = i * step;
        var xc = x + colW / 2;
        var yO = stripY(k.o), yC = stripY(k.c), yH = stripY(k.hi), yL = stripY(k.lo);
        var cc = k.up ? '34,197,94' : '239,68,68';
        var top = Math.min(yO, yC), bh = Math.max(2, Math.abs(yC - yO));
        sctx.strokeStyle = 'rgba(' + cc + ',0.6)';
        sctx.lineWidth = 1.4;
        sctx.beginPath(); sctx.moveTo(xc, yH); sctx.lineTo(xc, yL); sctx.stroke();
        sctx.fillStyle = 'rgba(' + cc + ',0.82)';
        var rad = Math.min(colW * 0.28, 3);
        if (sctx.roundRect) { sctx.beginPath(); sctx.roundRect(x, top, colW, bh, rad); sctx.fill(); }
        else sctx.fillRect(x, top, colW, bh);
      }
    }

    // Screen-fixed darkening vignette. Rebuilt only on resize, reused each frame.
    function buildVignette() {
      vgrad = ctx.createRadialGradient(w / 2, h * 0.5, Math.min(w, h) * 0.3, w / 2, h * 0.5, Math.max(w, h) * 0.8);
      vgrad.addColorStop(0, 'rgba(10,14,20,0)');
      vgrad.addColorStop(1, 'rgba(10,14,20,0.45)');
    }

    function progAt(rect, vh) {
      return clamp((vh - rect.top) / (vh + rect.height), 0, 1);
    }

    function draw(rect, vh) {
      ctx.clearRect(0, 0, w, h);
      if (!strip) return;

      var panMax = Math.max(0, chartW - w);
      var panX = progS * panMax * PAN_SCALE;
      chartCY = clamp(vh / 2 - rect.top, bandH / 2 + 20, h - bandH / 2 - 20);

      // Blit the visible window of the pre-rendered strip (one GPU copy instead
      // of re-stroking ~100 candles). Source rect is in the strip's device px.
      ctx.drawImage(
        strip,
        panX * cacheDpr, 0, w * cacheDpr, bandH * cacheDpr,
        0, chartCY - bandH / 2, w, bandH
      );

      if (vgrad) { ctx.fillStyle = vgrad; ctx.fillRect(0, 0, w, h); }
    }

    // Redraw only while the eased pan is still catching up to the scroll
    // target. Once it settles, the loop stops - idle frames cost nothing.
    function loop() {
      _raf = null;
      if (reduce || !onScreen || document.hidden) return;
      var vh = window.innerHeight || h;
      var rect = secEl.getBoundingClientRect();
      progT = progAt(rect, vh);
      progS += (progT - progS) * EASE;
      if (Math.abs(progT - progS) < 0.0006) progS = progT;
      draw(rect, vh);
      if (progS !== progT) _raf = requestAnimationFrame(loop);
    }

    function kick() {
      if (reduce || !onScreen || document.hidden) return;
      if (_raf == null) _raf = requestAnimationFrame(loop);
    }

    // Force a single repaint at the current pan (initial mount + resize),
    // independent of the easing loop.
    function paintNow() {
      var vh = window.innerHeight || h;
      var rect = secEl.getBoundingClientRect();
      draw(rect, vh);
    }

    _onResize = function () { resize(); paintNow(); };
    window.addEventListener('resize', _onResize, { passive: true });
    window.addEventListener('scroll', kick, { passive: true });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });

    resize();

    (function () {
      var vh = window.innerHeight || h;
      var rect = secEl.getBoundingClientRect();
      progS = progT = progAt(rect, vh);
    })();
    paintNow();

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        onScreen = es[0].isIntersecting;
        if (onScreen) kick();
      }, { rootMargin: '160px 0px' });
      io.observe(secEl);
    }

    if (!reduce) kick();
  }
})();
