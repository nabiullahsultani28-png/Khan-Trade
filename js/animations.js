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
  const heroPanel = document.querySelector('.hero-chart-panel');
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

    // --- Unicorn steps
    if (document.querySelector('.unicorn .step')) {
      gsap.from('.unicorn .step', {
        scrollTrigger: { trigger: '.unicorn .grid-2', start: 'top 60%' },
        y: 20, opacity: 0, duration: 0.8, stagger: 0.15
      });
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

    // --- Unicorn vertical connecting line — draws as section scrolls
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
  }

  // --- Hero drifting candle backdrop — slow infinite drift
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

  // --- Lightweight counters, FAQ toggles, and year fallback for non-GSAP flows
  (function(){
    // set footer year
    const y = document.querySelector('[data-year]');
    if(y) y.textContent = new Date().getFullYear();

    // animate numeric counters when visible
    document.querySelectorAll('[data-count]').forEach(el=>{
      const target = parseInt(el.getAttribute('data-count'),10) || 0;
      el.textContent = '0';
      const obs = new IntersectionObserver((entries, o)=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            let start = null;
            const dur = 900;
            function step(ts){
              if(!start) start = ts;
              const t = Math.min((ts - start)/dur, 1);
              el.textContent = Math.floor(t * target);
              if(t < 1) requestAnimationFrame(step);
              else el.textContent = target;
            }
            requestAnimationFrame(step);
            o.unobserve(entry.target);
          }
        });
      },{threshold:0.2});
      obs.observe(el);
    });

    // simple FAQ toggle (graceful if GSAP already handles visuals)
    document.querySelectorAll('.faq-q').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const item = btn.closest('.faq-item');
        const panel = item.querySelector('.faq-a');
        const open = item.classList.toggle('open');
        if(open) panel.style.maxHeight = panel.scrollHeight + 'px';
        else panel.style.maxHeight = null;
      });
    });
  })();
})();
