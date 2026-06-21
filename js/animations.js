/* The Khan Trading - animations.js
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
  const heroH1Spans = document.querySelectorAll('.hero-h1 span');
  if (heroH1Spans.length) {
    gsap.from(heroH1Spans, { y: 36, opacity: 0, duration: 1.2, ease: 'expo.out', delay: 0.1, stagger: 0.1 });
  } else if (heroH1) {
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
  const heroPanel = document.querySelector('.hero-chart-panel, .hero-market-card');
  if (heroPanel) {
    gsap.from(heroPanel, { y: 40, opacity: 0, scale: 0.97, duration: 1.2, ease: 'expo.out', delay: 0.4 });
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
      // Checkmarks stagger
      gsap.from(p.querySelectorAll('ul li'), {
        scrollTrigger: { trigger: p, start: 'top 80%' },
        x: -10, opacity: 0, duration: 0.6, stagger: 0.1, delay: i * 0.12 + 0.3
      });
    });

    // --- Unicorn steps and layout reveal
    if (document.querySelector('.unicorn .grid-2')) {
      if (document.querySelector('.unicorn .unicorn-visual')) {
        gsap.from('.unicorn .unicorn-visual', {
          scrollTrigger: { trigger: '.unicorn', start: 'top 75%' },
          y: 40, opacity: 0, duration: 1, ease: 'expo.out'
        });
      }
      gsap.from('.unicorn .eyebrow, .unicorn h2, .unicorn p', {
        scrollTrigger: { trigger: '.unicorn', start: 'top 75%' },
        y: 20, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'expo.out'
      });
      if (document.querySelector('.unicorn .step')) {
        gsap.from('.unicorn .step', {
          scrollTrigger: { trigger: '.unicorn .grid-2', start: 'top 60%' },
          y: 20, opacity: 0, duration: 0.8, stagger: 0.15
        });
      }
    }

    // --- Testimonial cards
    if (document.querySelector('.quote-card')) {
      gsap.from('.quote-card', {
        scrollTrigger: { trigger: '.quote-card', start: 'top 85%' },
        y: 30, scale: 0.96, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.1
      });
    }

    // --- Testimonial SVG quote-mark draw-in + slow float
    gsap.utils.toArray('.qmark-svg .qmark-path').forEach(path => {
      path.style.strokeDasharray = 200;
      gsap.fromTo(path, { strokeDashoffset: 200 }, {
        strokeDashoffset: 0,
        duration: 1.4,
        ease: 'expo.out',
        scrollTrigger: { trigger: path.closest('.quote-card'), start: 'top 85%' }
      });
    });
    gsap.utils.toArray('.quote-card').forEach(card => {
      ScrollTrigger.create({
        trigger: card,
        start: 'top 85%',
        once: true,
        onEnter: () => card.classList.add('floating')
      });
    });

    // --- Unicorn vertical connecting line - draws as section scrolls
    const uLine = document.querySelector('.unicorn-line-path');
    if (uLine) {
      gsap.fromTo(uLine, { strokeDashoffset: 100 }, {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '.unicorn-steps',
          start: 'top 75%',
          end: 'bottom 70%',
          scrub: 0.6
        }
      });
    }
    // Traveling glow node rides down the unicorn line as it draws
    const uNode = document.querySelector('.unicorn-line-node');
    const uSteps = document.querySelector('.unicorn-steps');
    if (uNode && uSteps) {
      const travel = uSteps.offsetHeight - 60;
      gsap.fromTo(uNode, { y: 0, opacity: 0 }, {
        y: travel,
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.unicorn-steps',
          start: 'top 75%',
          end: 'bottom 70%',
          scrub: 0.6
        }
      });
    }

    // --- CRT / ICT anatomy diagrams - each builds itself as it scrolls into view.
    // SVG-safe: only opacity + translate tweens (scale/transformOrigin on
    // <g>/<line> is unreliable across browsers), plus a stroke-dash arrow draw.
    gsap.utils.toArray('.crt-diagram svg').forEach((crtDiagram) => {
      const arrow = crtDiagram.querySelector('.crt-arrow-path');
      const tl = gsap.timeline({
        defaults: { ease: 'expo.out' },
        scrollTrigger: { trigger: crtDiagram, start: 'top 80%', once: true }
      });
      // zones + range box fade in first
      tl.from(crtDiagram.querySelectorAll('.crt-zone, .crt-rangebox'), {
        opacity: 0, duration: 0.6, stagger: 0.08
      });
      // levels slide in from the left
      tl.from(crtDiagram.querySelectorAll('.crt-level'), {
        opacity: 0, x: -16, duration: 0.6, stagger: 0.05
      }, '-=0.25');
      // candles rise in left-to-right (DOM order = chronological)
      tl.from(crtDiagram.querySelectorAll('.crt-candle'), {
        opacity: 0, y: 16, duration: 0.45, stagger: 0.07
      }, '-=0.35');
      // sweep marker + label (not every diagram has them)
      const sweepBits = crtDiagram.querySelectorAll('.crt-sweep-dot, .crt-lab-bear');
      if (sweepBits.length) {
        tl.from(sweepBits, { opacity: 0, y: -8, duration: 0.5, stagger: 0.1 }, '-=0.05');
      }
      // expansion arrow draws along its path, then the label fades in
      if (arrow) {
        const len = arrow.getTotalLength();
        tl.fromTo(arrow, { strokeDasharray: len, strokeDashoffset: len }, {
          strokeDashoffset: 0, duration: 1, ease: 'power2.out'
        }, '-=0.1');
        const bullLab = crtDiagram.querySelector('.crt-lab-bull');
        if (bullLab) tl.from(bullLab, { opacity: 0, duration: 0.5 }, '-=0.4');
      }
    });
  }

  // --- Hero drifting candle backdrop - slow infinite drift
  const heroCandlesRow = document.querySelector('.hero-candles-row');
  if (heroCandlesRow) {
    gsap.to(heroCandlesRow, {
      x: -200,
      duration: 28,
      ease: 'none',
      repeat: -1,
      yoyo: true
    });
    gsap.to('.hero-candle', {
      y: 8,
      duration: 4,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      stagger: { each: 0.25, from: 'random' }
    });
  }

  // --- Module-card 3D tilt on hover
  if (!window.matchMedia('(pointer: coarse)').matches) document.querySelectorAll('[data-tilt]').forEach(card => {
    const max = 6;
    let frame = 0;
    let nextTransform = '';
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      nextTransform = `perspective(800px) rotateY(${px * max}deg) rotateX(${-py * max}deg)`;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        card.style.transform = nextTransform;
        frame = 0;
      });
    });
    card.addEventListener('mouseleave', () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      card.style.transform = '';
    });
  });

})();

