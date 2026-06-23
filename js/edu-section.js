(function () {
  var root = document.getElementById('ict');
  if (!root) return;

  var _raf = null, _tick = null, _onScroll = null, _onResize = null;
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
    var progS = 0;
    var N = 175;

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
    }
    _onResize = resize;
    window.addEventListener('resize', resize, { passive: true });
    resize();

    function yOf(p) {
      return chartCY + (0.5 - (p - minP) / (maxP - minP)) * bandH;
    }

    function frame() {
      var rect = secEl.getBoundingClientRect();
      var vh = window.innerHeight || h;
      var prog = clamp((vh - rect.top) / (vh + rect.height), 0, 1);
      progS += (prog - progS) * 0.10;

      if (rect.bottom < -80 || rect.top > vh + 80) {
        if (!reduce) _raf = requestAnimationFrame(frame);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      var panMax = Math.max(0, chartW - w);
      var panX = progS * panMax;
      chartCY = clamp(vh / 2 - rect.top, bandH / 2 + 20, h - bandH / 2 - 20);

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.035)';
      var gh = bandH / 5;
      for (var gy = chartCY - bandH / 2; gy <= chartCY + bandH / 2 + 0.5; gy += gh) {
        ctx.beginPath(); ctx.moveTo(0, Math.round(gy) + 0.5); ctx.lineTo(w, Math.round(gy) + 0.5); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.02)';
      var gstep = step * 5;
      for (var gx = -(panX % gstep); gx < w; gx += gstep) {
        ctx.beginPath(); ctx.moveTo(Math.round(gx) + 0.5, 0); ctx.lineTo(Math.round(gx) + 0.5, h); ctx.stroke();
      }

      var i0 = Math.max(0, Math.floor(panX / step) - 1);
      var i1 = Math.min(N - 1, Math.ceil((panX + w) / step) + 1);
      for (var i = i0; i <= i1; i++) {
        var k = series[i];
        var x = i * step - panX;
        var xc = x + colW / 2;
        var yO = yOf(k.o), yC = yOf(k.c), yH = yOf(k.hi), yL = yOf(k.lo);
        var cc = k.up ? '34,197,94' : '239,68,68';
        var top = Math.min(yO, yC), bh = Math.max(2, Math.abs(yC - yO));
        ctx.strokeStyle = 'rgba(' + cc + ',0.6)';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(xc, yH); ctx.lineTo(xc, yL); ctx.stroke();
        ctx.fillStyle = 'rgba(' + cc + ',0.82)';
        var rad = Math.min(colW * 0.28, 3);
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, top, colW, bh, rad); ctx.fill(); }
        else ctx.fillRect(x, top, colW, bh);
      }

      var vg = ctx.createRadialGradient(w / 2, h * 0.5, Math.min(w, h) * 0.3, w / 2, h * 0.5, Math.max(w, h) * 0.8);
      vg.addColorStop(0, 'rgba(10,14,20,0)');
      vg.addColorStop(1, 'rgba(10,14,20,0.45)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      if (!reduce) _raf = requestAnimationFrame(frame);
    }

    frame();
    _tick = setInterval(function () {
      if (!reduce && (document.hidden || _raf == null)) frame();
    }, 1000 / 30);
  }
})();
