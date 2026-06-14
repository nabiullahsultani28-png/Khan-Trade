/* The Khan Trading — main.js
   Nav tint, mobile menu, FAQ accordion, lazy video autoplay,
   stat count-ups, scroll-reveal fallback. */

(function () {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Telegram links — single source of truth.
  // When the real channels go live, set the two URLs below; every t.me CTA
  // site-wide is resolved from here (premium = .btn-tg-premium or "premium" text).
  const TG_LINKS = {
    free: 'https://t.me/',
    premium: 'https://t.me/'
  };
  document.querySelectorAll('a[href^="https://t.me"]').forEach(a => {
    const premium = a.classList.contains('btn-tg-premium') || /premium/i.test(a.textContent);
    a.href = premium ? TG_LINKS.premium : TG_LINKS.free;
  });

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

  // ---- Mobile "Learn" collapsible group (tap the header to expand the sub-pages)
  const learnSection = menu?.querySelector('.mobile-learn-section');
  const learnToggle = learnSection?.querySelector('.mobile-learn-toggle');
  if (learnSection && learnToggle) {
    const setLearn = (open) => {
      learnSection.classList.toggle('open', open);
      learnToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    // Auto-expand when the current page is one of the Learn sub-pages
    const here = location.pathname.split('/').pop();
    const onLearnPage = [...learnSection.querySelectorAll('.mobile-learn-card')]
      .some(a => a.getAttribute('href') === here);
    setLearn(onLearnPage);
    learnToggle.addEventListener('click', () => setLearn(!learnSection.classList.contains('open')));
  }

  // ---- Theme switcher — Apple-style segmented pill (Light / System / Dark)
  // Stores the *preference*; resolves "system" against the OS at runtime and sets
  // data-theme (concrete) + data-theme-pref (choice) on <html>. An inline <head>
  // script applies the same on first paint to avoid a flash. The control itself is
  // built here in place of the .theme-toggle mount points, so the markup lives in
  // one place across every page.
  const SEG_W = 40; // small-size segment width (must match CSS)
  const SW_MODES = [
    { id: 'light',  label: 'Light',  icon:
      '<svg class="sw-ico" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
      '<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/>' +
      '<g class="sun-rays"><line x1="12" y1="2" x2="12" y2="4.4"/><line x1="12" y1="19.6" x2="12" y2="22"/>' +
      '<line x1="2" y1="12" x2="4.4" y2="12"/><line x1="19.6" y1="12" x2="22" y2="12"/>' +
      '<line x1="4.9" y1="4.9" x2="6.6" y2="6.6"/><line x1="17.4" y1="17.4" x2="19.1" y2="19.1"/>' +
      '<line x1="4.9" y1="19.1" x2="6.6" y2="17.4"/><line x1="17.4" y1="6.6" x2="19.1" y2="4.9"/></g></svg>' },
    { id: 'system', label: 'System', icon:
      '<svg class="sw-ico" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<circle cx="12" cy="12" r="8"/><path class="sys-fill" d="M12 4 A8 8 0 0 1 12 20 Z" fill="currentColor" stroke="none"/></svg>' },
    { id: 'dark',   label: 'Dark',   icon:
      '<svg class="sw-ico" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">' +
      '<path class="moon-core" d="M20.5 13.4A8.1 8.1 0 1 1 10.6 3.5 6.4 6.4 0 0 0 20.5 13.4Z" fill="currentColor"/></svg>' },
  ];
  const idxOf = (pref) => SW_MODES.findIndex((m) => m.id === pref);
  const mql = window.matchMedia('(prefers-color-scheme: light)');
  const getPref = () => { try { return localStorage.getItem('theme') || 'dark'; } catch (e) { return 'dark'; } };
  const resolveTheme = (pref) => pref === 'system' ? (mql.matches ? 'light' : 'dark') : pref;

  const applyTheme = (pref) => {
    const root = document.documentElement;
    root.dataset.theme = resolveTheme(pref);
    root.dataset.themePref = pref;
  };

  // Replace each placeholder mount with a real segmented switcher
  const switchers = [...document.querySelectorAll('.theme-toggle')].map((mount) => {
    const el = document.createElement('div');
    el.className = 'theme-switch' + (mount.classList.contains('nav-theme') ? ' nav-theme' : '');
    el.setAttribute('role', 'radiogroup');
    el.setAttribute('aria-label', 'Theme');
    el.innerHTML =
      '<span class="theme-switch-thumb" aria-hidden="true"></span>' +
      SW_MODES.map((m) =>
        '<button class="sw-seg" type="button" role="radio" data-mode="' + m.id + '" aria-label="' + m.label + '" title="' + m.label + '" aria-checked="false" tabindex="-1">' + m.icon + '</button>'
      ).join('');
    mount.replaceWith(el);
    return el;
  });

  const syncSwitchers = (pref) => {
    const idx = Math.max(0, idxOf(pref));
    switchers.forEach((sw) => {
      sw.querySelector('.theme-switch-thumb').style.transform = 'translateX(' + (idx * SEG_W) + 'px)';
      sw.querySelectorAll('.sw-seg').forEach((b, n) => {
        const on = b.dataset.mode === pref;
        b.classList.toggle('active', on);
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
      });
    });
  };

  let animTimer;
  const setMode = (pref, origin) => {
    try { localStorage.setItem('theme', pref); } catch (e) {}
    const run = () => { applyTheme(pref); syncSwitchers(pref); };
    // Ink-sweep: reveal the new theme in a circle radiating from the control
    if (!reduce && document.startViewTransition && origin) {
      const r = origin.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      document.startViewTransition(run).ready.then(() => {
        const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
        document.documentElement.animate(
          { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + end + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 540, easing: 'cubic-bezier(0.34,1.05,0.5,1)', pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(() => {});
      return;
    }
    // Fallback crossfade
    if (!reduce) {
      document.documentElement.classList.add('theme-anim');
      clearTimeout(animTimer);
      animTimer = setTimeout(() => document.documentElement.classList.remove('theme-anim'), 500);
    }
    run();
  };

  switchers.forEach((sw) => {
    sw.addEventListener('click', (e) => {
      const seg = e.target.closest('.sw-seg');
      if (seg) setMode(seg.dataset.mode, sw);
    });
    sw.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const cur = idxOf(getPref());
      const base = cur < 0 ? 1 : cur;
      const n = Math.max(0, Math.min(SW_MODES.length - 1, base + (e.key === 'ArrowRight' ? 1 : -1)));
      setMode(SW_MODES[n].id, sw);
      sw.querySelectorAll('.sw-seg')[n].focus();
    });
  });

  applyTheme(getPref());
  syncSwitchers(getPref());
  // Enable the thumb's slide transition only after the initial position is painted
  requestAnimationFrame(() => switchers.forEach((sw) => sw.classList.add('sw-ready')));
  mql.addEventListener('change', () => { if (getPref() === 'system') setMode('system', switchers[0]); });

  // Flag the nav when it overlaps the dark hero (home page) for light-theme legibility
  if (document.querySelector('.hero')) nav?.classList.add('over-hero');

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
    btn?.setAttribute('aria-expanded', item.classList.contains('open') ? 'true' : 'false');
    btn?.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      item.parentElement?.querySelectorAll('.faq-item.open').forEach(o => {
        o.classList.remove('open');
        o.querySelector('.faq-q')?.setAttribute('aria-expanded', 'false');
        setFaqHeight(o, false);
      });
      if (!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
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

  // ---- Lazy autoplay videos when in view, pause when out.
  // Heavy clips keep their src in data-src on the <source> and only download
  // on first intersection (poster shows until then).
  const videos = document.querySelectorAll('video[data-lazy]');
  if (videos.length) {
    const vio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const v = e.target;
        if (e.isIntersecting) {
          if (!v.dataset.loaded) {
            v.querySelectorAll('source[data-src]').forEach(s => { s.src = s.dataset.src; });
            v.dataset.loaded = '1';
            v.load();
          }
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

      // Gold dot that rides the line as it draws
      const NS = 'http://www.w3.org/2000/svg';
      const dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('r', '2.6');
      dot.setAttribute('class', 'sparkline-dot');
      sparkline.appendChild(dot);
      const proxy = { p: 0 };
      gsap.to(proxy, {
        p: 1, duration: 1.2, ease: 'power2.out', delay: 0.2,
        onStart: () => { dot.style.opacity = 1; },
        onUpdate: () => {
          const pt = path.getPointAtLength(length * proxy.p);
          dot.setAttribute('cx', pt.x);
          dot.setAttribute('cy', pt.y);
        },
        onComplete: () => { gsap.to(dot, { opacity: 0, duration: 0.5, delay: 0.3 }); }
      });
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
