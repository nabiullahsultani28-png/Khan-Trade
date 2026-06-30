/* Hero background: animated constellation (replaces the old MP4).
   Reuses the shared engine in js/constellation-bg.js. The engine listens on the
   window for pointermove, so the canvas stays pointer-events:none and never
   blocks the hero CTA. Mobile budget + reduced-motion are handled in the engine. */
(function () {
  if (typeof window.KhanConstellation !== 'function') return;

  var heroOptions = {
    density: 1.12,
    intensity: 1.06,
    depthLayers: true,
    cursorLinks: true,
    shootingStars: true
  };

  var hero = document.querySelector('.hero');
  var heroCanvas = hero && hero.querySelector('[data-khan-hero-bg]');
  if (heroCanvas) window.KhanConstellation(hero, heroCanvas, heroOptions);

  var faq = document.querySelector('.faq-join-backdrop');
  var faqCanvas = faq && faq.querySelector('[data-khan-faq-bg]');
  if (faqCanvas) window.KhanConstellation(faq, faqCanvas, heroOptions);
})();
