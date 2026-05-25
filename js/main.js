/* The Khan Trading — main.js
   Nav tint, mobile menu, FAQ accordion, lazy video autoplay,
   stat count-ups, scroll-reveal fallback. */

(function () {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Nav tint on scroll
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 60) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---- Mobile menu
  const toggle = document.querySelector('.nav-mobile-toggle');
  const menu = document.querySelector('.mobile-menu');
  const closeBtn = document.querySelector('.mobile-menu-close');
  const openMenu = () => { menu?.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const closeMenu = () => { menu?.classList.remove('open'); document.body.style.overflow = ''; };
  toggle?.addEventListener('click', openMenu);
  closeBtn?.addEventListener('click', closeMenu);
  menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  // ---- Ticker pause-on-hover
  const tickerTrack = document.querySelector('.ticker-track');
  if (tickerTrack) {
    tickerTrack.parentElement.addEventListener('mouseenter', () => tickerTrack.style.animationPlayState = 'paused');
    tickerTrack.parentElement.addEventListener('mouseleave', () => tickerTrack.style.animationPlayState = 'running');
  }

  // ---- FAQ accordion (smooth height via measured inline max-height)
  const setFaqHeight = (item, open) => {
    const a = item.querySelector('.faq-a');
    if (!a) return;
    if (open) {
      const inner = a.querySelector('.faq-a-inner');
      const h = inner ? inner.scrollHeight + 2 : a.scrollHeight;
      a.style.maxHeight = h + 'px';
    } else {
      a.style.maxHeight = '0px';
    }
  };
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q');
    btn?.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      item.parentElement?.querySelectorAll('.faq-item.open').forEach(o => {
        o.classList.remove('open');
        setFaqHeight(o, false);
      });
      if (!wasOpen) {
        item.classList.add('open');
        setFaqHeight(item, true);
      }
    });
  });
  // Recompute open item heights on viewport resize (line-wrap can change height)
  window.addEventListener('resize', () => {
    document.querySelectorAll('.faq-item.open').forEach(o => setFaqHeight(o, true));
  });

  // ---- Scroll reveal (IntersectionObserver fallback if GSAP not loaded)
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // ---- Lazy autoplay videos when in view, pause when out
  const videos = document.querySelectorAll('video[data-lazy]');
  if (videos.length) {
    const vio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const v = e.target;
        if (e.isIntersecting) {
          if (v.paused) v.play().catch(() => {});
        } else {
          if (!v.paused) v.pause();
        }
      });
    }, { threshold: 0.4 });
    videos.forEach(v => vio.observe(v));
  }

  // ---- Stat count-ups
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const animateNumber = (el) => {
    const target = parseFloat(el.dataset.count);

    // Sparkline animation if present
    const sparkline = el.parentElement.querySelector('.sparkline');
    if (sparkline && typeof gsap !== 'undefined') {
      const path = sparkline.querySelector('path');
      const length = path.getTotalLength();
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;
      gsap.to(sparkline, { opacity: 0.6, duration: 0.2 });
      gsap.to(path, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.out', delay: 0.2 });
    }
    const decimals = (el.dataset.decimals != null) ? parseInt(el.dataset.decimals, 10) : 0;
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const val = target * easeOut(t);
      el.textContent = val.toFixed(decimals);
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target.toFixed(decimals);
        const statNum = el.closest('.stat-num');
        if (statNum) {
          statNum.classList.remove('popped');
          void statNum.offsetWidth; // restart animation
          statNum.classList.add('popped');
        }
      }
    };
    requestAnimationFrame(tick);
  };
  const nums = document.querySelectorAll('[data-count]');
  if (nums.length && !reduce) {
    const nio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateNumber(e.target);
          nio.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    nums.forEach(n => nio.observe(n));
  } else {
    nums.forEach(n => {
      const dec = (n.dataset.decimals != null) ? parseInt(n.dataset.decimals, 10) : 0;
      n.textContent = parseFloat(n.dataset.count).toFixed(dec);
    });
  }

  // ---- Year stamp
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
})();
