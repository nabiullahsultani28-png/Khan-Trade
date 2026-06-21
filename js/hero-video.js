/* Hero background video: load + play on desktop only.
   On mobile the <video> shows its poster (no 8MB download, no decode/battery cost).
   Re-checks on breakpoint change so a desktop resize still gets the video. */
(function () {
  var v = document.querySelector('.hero-video');
  if (!v || !v.dataset.src) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mqDesktop = window.matchMedia('(min-width: 761px)');
  var loaded = false;

  function load() {
    if (loaded || reduce) return;
    loaded = true;
    v.src = v.dataset.src;
    v.load();
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked — poster stays */ });
  }

  if (mqDesktop.matches) load();

  // If the viewport grows to desktop later, load then (one-way; never unloads).
  var onChange = function (e) { if (e.matches) load(); };
  if (mqDesktop.addEventListener) mqDesktop.addEventListener('change', onChange);
  else if (mqDesktop.addListener) mqDesktop.addListener(onChange);
})();
