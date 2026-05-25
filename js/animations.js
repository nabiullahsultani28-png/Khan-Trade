/* The Khan Trading — animations.js
   GSAP + ScrollTrigger timelines: hero entrance, section reveals,
   chart parallax, module timeline stagger. Disabled on reduced motion. */

(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof gsap === 'undefined') return;

  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  // --- Hero entrance
  const heroH1 = document.querySelector('.hero h1');
  const heroLead = document.querySelector('.hero .lead');
  const heroCta = document.querySelector('.hero .tg-cta-pair');
  const heroMeta = document.querySelector('.hero-meta');
  if (heroH1) {
    gsap.from(heroH1, { y: 36, opacity: 0, duration: 1.2, ease: 'expo.out', delay: 0.1 });
  }
  if (heroLead) {
    gsap.from(heroLead, { y: 24, opacity: 0, duration: 1.1, ease: 'expo.out', delay: 0.35 });
  }
  if (heroCta) {
    gsap.from(heroCta.children, { y: 20, opacity: 0, duration: 0.9, ease: 'expo.out', delay: 0.55, stagger: 0.08 });
  }
  if (heroMeta) {
    gsap.from(heroMeta.children, { y: 14, opacity: 0, duration: 0.8, ease: 'expo.out', delay: 0.85, stagger: 0.08 });
  }

  // --- Generic section header reveal
  if (window.ScrollTrigger) {
    gsap.utils.toArray('.section-header').forEach(el => {
      gsap.from(el.children, {
        scrollTrigger: { trigger: el, start: 'top 80%' },
        y: 28, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08
      });
    });

    // --- Cards stagger
    gsap.utils.toArray('.stagger-group').forEach(group => {
      const items = group.children;
      gsap.from(items, {
        scrollTrigger: { trigger: group, start: 'top 82%' },
        y: 28, opacity: 0, duration: 0.85, ease: 'expo.out', stagger: 0.09
      });
    });

    // --- Module timeline cards
    gsap.utils.toArray('.module').forEach((mod, i) => {
      const dir = i % 2 === 0 ? -40 : 40;
      gsap.from(mod, {
        scrollTrigger: { trigger: mod, start: 'top 85%' },
        x: dir, opacity: 0, duration: 1, ease: 'expo.out'
      });
    });

    // --- Parallax on chart visuals
    gsap.utils.toArray('[data-parallax]').forEach(el => {
      gsap.fromTo(el, { y: 40 }, {
        y: -40,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    // --- Plan cards
    gsap.utils.toArray('.plans .plan').forEach((p, i) => {
      gsap.from(p, {
        scrollTrigger: { trigger: '.plans', start: 'top 75%' },
        y: 40, opacity: 0, duration: 1, ease: 'expo.out', delay: i * 0.12
      });
    });
  }

  // --- Module-card 3D tilt on hover
  document.querySelectorAll('[data-tilt]').forEach(card => {
    const max = 6;
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${px * max}deg) rotateX(${-py * max}deg) translateY(-3px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();
