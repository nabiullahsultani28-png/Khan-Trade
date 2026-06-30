/* Why Different / Honest Filter - scroll-reveal + animated canvas background.
   The constellation now comes from the shared engine in js/constellation-bg.js
   (same design as the hero), tuned a touch calmer for a content section. */
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

    // Marking [data-js] activates the hidden/offset CSS - content is never stuck
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

  /* ---------- animated background canvas (shared engine) ---------- */
  function setupBackground(root) {
    var canvas = root.querySelector('[data-khan-why-bg]');
    if (!canvas || typeof window.KhanConstellation !== 'function') return;
    window.KhanConstellation(root, canvas, {
      density: 0.95,
      intensity: 1.0,
      depthLayers: true,
      cursorLinks: true,
      shootingStars: true
    });
  }
})();
