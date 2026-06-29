/* The Khan Trading - main.js
   Nav tint, mobile menu, FAQ accordion, lazy video autoplay,
   stat count-ups, scroll-reveal fallback. */

(function () {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Telegram links - single source of truth.
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
  const focusableSel = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let lastFocused = null;
  const openMenu = () => {
    if (!menu) return;
    lastFocused = document.activeElement;
    menu.classList.add('open');
    document.body.style.overflow = 'hidden';
    toggle?.setAttribute('aria-expanded', 'true');
    toggle?.setAttribute('aria-label', 'Close menu');
    requestAnimationFrame(() => menu.querySelector(focusableSel)?.focus());
  };
  const closeMenu = () => {
    if (!menu) return;
    menu.classList.remove('open');
    document.body.style.overflow = '';
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', 'Open menu');
    learnSection?.classList.remove('open');
    learnToggle?.setAttribute('aria-expanded', 'false');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  };
  toggle?.addEventListener('click', openMenu);
  closeBtn?.addEventListener('click', closeMenu);
  menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  menu?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
      return;
    }
    if (e.key !== 'Tab' || !menu.classList.contains('open')) return;
    const focusables = [...menu.querySelectorAll(focusableSel)].filter(el => el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu?.classList.contains('open')) {
      e.preventDefault();
      closeMenu();
    }
  });

  // ---- Desktop Learn dropdown
  document.querySelectorAll('.nav-dropdown-group').forEach(group => {
    const trigger = group.querySelector('.nav-dropdown-trigger');
    const setOpen = (open) => {
      group.classList.toggle('open', open);
      trigger?.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    trigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(!group.classList.contains('open'));
    });
    group.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        trigger?.focus();
      }
    });
    document.addEventListener('click', (e) => {
      if (!group.contains(e.target)) setOpen(false);
    });
  });

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

  // ---- Theme switcher - Apple-style segmented pill (Light / System / Dark)
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

  // Flag the nav when it overlaps a dark hero for light-theme legibility.
  if (document.querySelector('.hero')) nav?.classList.add('over-hero');

  // ---- FAQ accordion
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q');
    btn?.setAttribute('aria-expanded', item.classList.contains('open') ? 'true' : 'false');
    btn?.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      item.parentElement?.querySelectorAll('.faq-item.open').forEach(o => {
        o.classList.remove('open');
        o.querySelector('.faq-q')?.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
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

  // ---- Pricing cards: pointer spotlight
  const pricingCards = document.querySelectorAll('[data-pricing-card]');
  if (pricingCards.length) {
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const resetCard = (card) => {
      card.style.setProperty('--mx', '50%');
      card.style.setProperty('--my', '24%');
      card.classList.remove('is-spotlit');
    };

    pricingCards.forEach((card) => {
      if (reduce || !finePointer) {
        resetCard(card);
        return;
      }

      let raf = 0;
      let lastX = 0;
      let lastY = 0;

      const render = () => {
        raf = 0;
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = Math.max(0, Math.min(1, (lastX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (lastY - rect.top) / rect.height));
        card.style.setProperty('--mx', (x * 100).toFixed(2) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(2) + '%');
      };

      card.addEventListener('pointerenter', (event) => {
        card.classList.add('is-spotlit');
        lastX = event.clientX;
        lastY = event.clientY;
        if (!raf) raf = requestAnimationFrame(render);
      });

      card.addEventListener('pointermove', (event) => {
        card.classList.add('is-spotlit');
        lastX = event.clientX;
        lastY = event.clientY;
        if (!raf) raf = requestAnimationFrame(render);
      });

      card.addEventListener('pointerleave', () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        resetCard(card);
      });

      card.addEventListener('focusin', () => {
        card.classList.add('is-spotlit');
      });

      card.addEventListener('focusout', () => {
        resetCard(card);
      });
    });
  }

  // ---- Pricing + Unicorn animated backdrop: aurora + curved liquidity field
  document.querySelectorAll('.pricing-bg-canvas, .unicorn-bg-canvas').forEach((canvas) => {
    const host = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    if (!host || !ctx) return;

    const isPricingBackdrop = canvas.classList.contains('pricing-bg-canvas');
    const isLightTheme = () => document.documentElement.getAttribute('data-theme') === 'light';
    const getBackdropTone = () => {
      const lightPricing = isPricingBackdrop && isLightTheme();
      return {
        orb: lightPricing ? 0.32 : 1,
        ribbon: lightPricing ? 0.34 : 1,
        particle: lightPricing ? 0.42 : 1,
        links: lightPricing ? 0.28 : 1,
        ripple: lightPricing ? 0.36 : 1,
        particleCount: lightPricing ? 0.56 : 1,
        ribbonCount: lightPricing ? 0.62 : 1,
        glow: lightPricing ? 0.24 : 1
      };
    };

    // Mobile / low-power path: fewer pixels, fewer elements, 30fps, cheaper draws
    const lowPower = window.matchMedia('(pointer: coarse)').matches
      || window.matchMedia('(max-width: 768px)').matches;
    const dprCap = lowPower ? 1.25 : 2;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    let orbCanvas = null;
    let particles = [];
    let ribbons = [];
    let raf = 0;
    let tick = 0;
    let step = 1;
    let lastT = 0;
    let acc = 0;
    let visible = true;
    const pointer = { x: -9999, y: -9999, active: false };
    const ripples = [];
    const abort = new AbortController();
    const orbs = [
      { hue: '212,175,55', cx: 0.16, cy: 0.14, r: 0.48, ax: 0.05, ay: 0.04, sx: 0.10, sy: 0.07, ph: 0.0, a: 0.24 },
      { hue: '34,197,94', cx: 0.82, cy: 0.30, r: 0.42, ax: 0.06, ay: 0.05, sx: 0.08, sy: 0.12, ph: 1.7, a: 0.16 },
      { hue: '212,175,55', cx: 0.55, cy: 0.86, r: 0.46, ax: 0.07, ay: 0.04, sx: 0.06, sy: 0.10, ph: 3.1, a: 0.13 }
    ];

    const seeded = (seed) => {
      const value = Math.sin(seed * 91.271 + 17.431) * 43758.5453123;
      return value - Math.floor(value);
    };

    const makeField = () => {
      const tone = getBackdropTone();
      const baseParticleCount = lowPower
        ? Math.min(70, Math.max(40, Math.round((width * height) / 34000)))
        : Math.min(150, Math.max(74, Math.round((width * height) / 19000)));
      const particleCount = Math.max(28, Math.round(baseParticleCount * tone.particleCount));
      particles = Array.from({ length: particleCount }, (_, index) => {
        const baseX = (-0.08 + seeded(index + 3) * 1.16) * width;
        const baseY = (0.08 + seeded(index + 17) * 0.86) * height;
        const toneSeed = seeded(index + 71);
        return {
          baseX,
          baseY,
          x: baseX,
          y: baseY,
          prox: 0,
          phase: seeded(index + 31) * Math.PI * 2,
          speed: 0.22 + seeded(index + 43) * 0.34,
          driftX: 12 + seeded(index + 53) * 34,
          driftY: 8 + seeded(index + 61) * 24,
          size: 0.75 + seeded(index + 89) * 1.35,
          tone: toneSeed > 0.84 ? 'green' : (toneSeed > 0.58 ? 'gold' : 'silver')
        };
      });

      const baseRibbonCount = lowPower ? Math.max(3, Math.min(4, Math.round(width / 320))) : Math.max(4, Math.min(7, Math.round(width / 280)));
      const ribbonCount = Math.max(2, Math.round(baseRibbonCount * tone.ribbonCount));
      ribbons = Array.from({ length: ribbonCount }, (_, index) => {
        const lane = (index + 0.5) / ribbonCount;
        return {
          baseY: height * (0.16 + lane * 0.72) + (seeded(index + 101) - 0.5) * height * 0.1,
          amp: height * (0.024 + seeded(index + 109) * 0.04),
          phase: seeded(index + 127) * Math.PI * 2,
          speed: 0.20 + seeded(index + 137) * 0.14,
          hue: index % 3 === 1 ? '34,197,94' : '212,175,55',
          alpha: index % 3 === 1 ? 0.052 : 0.07,
          width: 1 + seeded(index + 149) * 1.4
        };
      });
    };

    // On mobile, bake the (static) orb glow into an offscreen layer once per
    // resize so the loop can blit it instead of rebuilding 3 radial gradients
    // + 3 full-canvas fills every frame.
    const buildOrbLayer = () => {
      const tone = getBackdropTone();
      orbCanvas = document.createElement('canvas');
      orbCanvas.width = Math.max(1, Math.round(width));
      orbCanvas.height = Math.max(1, Math.round(height));
      const octx = orbCanvas.getContext('2d');
      if (!octx) { orbCanvas = null; return; }
      octx.globalCompositeOperation = 'lighter';
      orbs.forEach((orb) => {
        const ox = orb.cx * width;
        const oy = orb.cy * height;
        const radius = orb.r * Math.max(width, height);
        const gradient = octx.createRadialGradient(ox, oy, 0, ox, oy, radius);
        gradient.addColorStop(0, 'rgba(' + orb.hue + ',' + (orb.a * tone.orb) + ')');
        gradient.addColorStop(0.5, 'rgba(' + orb.hue + ',' + (orb.a * 0.35 * tone.orb) + ')');
        gradient.addColorStop(1, 'rgba(' + orb.hue + ',0)');
        octx.fillStyle = gradient;
        octx.fillRect(0, 0, width, height);
      });
    };

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeField();
      if (lowPower) buildOrbLayer();
    };

    const ribbonY = (ribbon, x) =>
      ribbon.baseY +
      Math.sin(x * 0.0052 + tick * ribbon.speed + ribbon.phase) * ribbon.amp +
      Math.sin(x * 0.014 + tick * (ribbon.speed * 0.72) + ribbon.phase * 0.7) * ribbon.amp * 0.42;

    const drawRibbon = (ribbon, lineWidth, alphaScale) => {
      const tone = getBackdropTone();
      ctx.beginPath();
      for (let x = -90; x <= width + 90; x += 28) {
        const y = ribbonY(ribbon, x);
        if (x === -90) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(' + ribbon.hue + ',' + (ribbon.alpha * alphaScale * tone.ribbon) + ')';
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    };

    const updateField = () => {
      const pointerRadius = Math.min(210, Math.max(132, width * 0.16));
      const pointerRadiusSquared = pointerRadius * pointerRadius;
      const rippleLimit = Math.max(width, height) * 1.18;
      const motionStep = reduce ? 0 : 1;

      for (let index = ripples.length - 1; index >= 0; index -= 1) {
        const ripple = ripples[index];
        ripple.r += 9 * motionStep * step;
        if (ripple.r > rippleLimit) ripples.splice(index, 1);
      }

      particles.forEach((particle) => {
        let targetX = particle.baseX +
          Math.sin(tick * particle.speed + particle.phase) * particle.driftX +
          Math.cos(tick * 0.18 + particle.phase * 0.7) * particle.driftX * 0.36;
        let targetY = particle.baseY +
          Math.cos(tick * (particle.speed * 0.8) + particle.phase) * particle.driftY +
          Math.sin(tick * 0.15 + particle.phase * 1.3) * particle.driftY * 0.42;
        let proximity = 0;

        if (pointer.active && !reduce) {
          const dx = targetX - pointer.x;
          const dy = targetY - pointer.y;
          const distSquared = dx * dx + dy * dy;
          if (distSquared < pointerRadiusSquared) {
            const dist = Math.sqrt(distSquared) || 1;
            const falloff = 1 - dist / pointerRadius;
            proximity = falloff;
            const push = falloff * falloff * 44;
            targetX += (dx / dist) * push;
            targetY += (dy / dist) * push;
          }
        }

        ripples.forEach((ripple) => {
          const rx = targetX - ripple.x;
          const ry = targetY - ripple.y;
          const rippleDist = Math.sqrt(rx * rx + ry * ry) || 1;
          const band = Math.abs(rippleDist - ripple.r);
          if (band < 42) {
            const force = (1 - band / 42) * (1 - ripple.r / rippleLimit);
            targetX += (rx / rippleDist) * force * 26;
            targetY += (ry / rippleDist) * force * 26;
            proximity = Math.max(proximity, force * 0.55);
          }
        });

        const ease = reduce ? 1 : Math.min(1, 0.055 * step);
        particle.x += (targetX - particle.x) * ease;
        particle.y += (targetY - particle.y) * ease;
        particle.prox = proximity;
      });
    };

    const draw = () => {
      const tone = getBackdropTone();
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      if (lowPower && orbCanvas) {
        ctx.drawImage(orbCanvas, 0, 0, width, height);
      } else {
        orbs.forEach((orb) => {
          const ox = (orb.cx + Math.sin(tick * orb.sx + orb.ph) * orb.ax) * width;
          const oy = (orb.cy + Math.cos(tick * orb.sy + orb.ph) * orb.ay) * height;
          const radius = orb.r * Math.max(width, height);
          const gradient = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius);
          gradient.addColorStop(0, 'rgba(' + orb.hue + ',' + (orb.a * tone.orb) + ')');
          gradient.addColorStop(0.5, 'rgba(' + orb.hue + ',' + (orb.a * 0.35 * tone.orb) + ')');
          gradient.addColorStop(1, 'rgba(' + orb.hue + ',0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        });
      }

      updateField();

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ribbons.forEach((ribbon) => {
        // Wide low-alpha stroke for the glow (cheaper than canvas shadowBlur),
        // skipped entirely on low-power devices.
        if (!lowPower) drawRibbon(ribbon, ribbon.width + 8, 0.5);
        drawRibbon(ribbon, ribbon.width, 1);
      });
      ctx.restore();

      // Particle-link lines: skip on low-power devices.
      if (!lowPower) {
        particles.forEach((particle, index) => {
          for (let n = 1; n <= 2; n += 1) {
            const neighbor = particles[(index + n * 17) % particles.length];
            const dx = particle.x - neighbor.x;
            const dy = particle.y - neighbor.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 128) continue;
            const energy = Math.max(particle.prox, neighbor.prox, 0.05) * (1 - dist / 128);
            if (energy < 0.018) continue;
            ctx.strokeStyle = 'rgba(212,175,55,' + (energy * 0.16 * tone.links) + ')';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(neighbor.x, neighbor.y);
            ctx.stroke();
          }
        });
      }

      particles.forEach((particle) => {
        const wave = 0.5 + 0.5 * Math.sin(tick * 0.9 + particle.phase);
        const alpha = (0.08 + wave * 0.1 + particle.prox * 0.56) * tone.particle;
        const particleRadius = particle.size + wave * 0.4 + particle.prox * 1.35;
        const hue = particle.prox > 0.04 ? '212,175,55' : (particle.tone === 'green' ? '52,211,120' : (particle.tone === 'gold' ? '212,175,55' : '150,166,190'));

        if (particle.prox > 0.18 && !lowPower) {
          const glow = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particleRadius * 4);
          glow.addColorStop(0, 'rgba(' + hue + ',' + (alpha * 0.4 * tone.glow) + ')');
          glow.addColorStop(1, 'rgba(' + hue + ',0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particleRadius * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = 'rgba(' + hue + ',' + alpha + ')';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particleRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      ripples.forEach((ripple) => {
        const fade = 1 - ripple.r / (Math.max(width, height) * 1.18);
        ctx.strokeStyle = 'rgba(212,175,55,' + (fade * 0.2 * tone.ripple) + ')';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.r, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.globalCompositeOperation = 'source-over';
    };

    const animate = (now) => {
      const t = now || performance.now();
      const dt = lastT ? t - lastT : 16.67;
      lastT = t;
      if (visible) {
        if (lowPower) {
          // Throttle to ~30fps; advance motion by elapsed time so speed holds.
          acc += dt;
          if (acc >= 32) {
            step = Math.min(3, acc / 16.67);
            tick += 0.016 * step;
            draw();
            acc = 0;
          }
        } else {
          step = Math.min(3, dt / 16.67);
          tick += 0.016 * step;
          draw();
        }
      }
      raf = requestAnimationFrame(animate);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { visible = entry.isIntersecting; });
    }, { threshold: 0 });
    io.observe(host);

    window.addEventListener('pointermove', (event) => {
      const bounds = host.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    }, { passive: true, signal: abort.signal });

    window.addEventListener('blur', () => {
      pointer.active = false;
    }, { signal: abort.signal });

    if (!reduce) {
      host.parentElement?.addEventListener('pointerdown', (event) => {
        const bounds = host.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) return;
        ripples.push({ x: event.clientX - bounds.left, y: event.clientY - bounds.top, r: 0 });
        if (ripples.length > 4) ripples.shift();
      }, { passive: true, signal: abort.signal });
      raf = requestAnimationFrame(animate);
    } else {
      tick = 1.4;
      draw();
    }

    window.addEventListener('pagehide', () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      abort.abort();
    }, { once: true });
  });

  // ---- CRT page animated backdrop: range rails + liquidity sweeps
  document.querySelectorAll('.crt-bg-canvas').forEach((canvas) => {
    const host = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    if (!host || !ctx) return;

    const lowPower = window.matchMedia('(pointer: coarse)').matches
      || window.matchMedia('(max-width: 768px)').matches;
    const dprCap = lowPower ? 1.2 : 1.8;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    let rails = [];
    let candles = [];
    let packets = [];
    let raf = 0;
    let tick = 0;
    let step = 1;
    let lastT = 0;
    let acc = 0;
    let visible = true;
    const abort = new AbortController();

    const seeded = (seed) => {
      const value = Math.sin(seed * 78.233 + 31.417) * 43758.5453123;
      return value - Math.floor(value);
    };

    const makeField = () => {
      const railCount = lowPower ? 5 : 8;
      rails = Array.from({ length: railCount }, (_, index) => {
        const lane = (index + 0.5) / railCount;
        const y = height * (0.08 + lane * 0.84);
        return {
          y,
          phase: seeded(index + 11) * Math.PI * 2,
          drift: 10 + seeded(index + 17) * 22,
          tone: index % 3 === 1 ? 'green' : 'gold',
          alpha: 0.05 + seeded(index + 23) * 0.05
        };
      });

      const candleCount = lowPower
        ? Math.min(42, Math.max(22, Math.round(width / 22)))
        : Math.min(84, Math.max(40, Math.round(width / 15)));
      candles = Array.from({ length: candleCount }, (_, index) => {
        const side = seeded(index + 41) > 0.58 ? 1 : -1;
        const baseY = height * (0.16 + seeded(index + 53) * 0.72);
        return {
          x: (-0.08 + (index / Math.max(1, candleCount - 1)) * 1.16) * width,
          baseY,
          phase: seeded(index + 61) * Math.PI * 2,
          speed: 0.18 + seeded(index + 67) * 0.22,
          body: 12 + seeded(index + 73) * 34,
          wick: 22 + seeded(index + 79) * 72,
          side,
          tone: seeded(index + 83) > 0.72 ? 'gold' : (side > 0 ? 'green' : 'red')
        };
      });

      const packetCount = lowPower ? 10 : 22;
      packets = Array.from({ length: packetCount }, (_, index) => ({
        rail: Math.floor(seeded(index + 91) * rails.length) % Math.max(1, rails.length),
        x: seeded(index + 101) * width,
        speed: 0.42 + seeded(index + 107) * 1.08,
        phase: seeded(index + 113) * Math.PI * 2,
        tone: seeded(index + 127) > 0.62 ? 'green' : 'gold'
      }));
    };

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeField();
    };

    const railY = (rail, x) =>
      rail.y +
      Math.sin(tick * 0.55 + rail.phase + x * 0.004) * rail.drift +
      Math.cos(tick * 0.28 + rail.phase * 0.6 + x * 0.009) * rail.drift * 0.34;

    const drawRail = (rail) => {
      ctx.beginPath();
      for (let x = -80; x <= width + 80; x += 36) {
        const y = railY(rail, x);
        if (x === -80) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const hue = rail.tone === 'green' ? '34,197,94' : '212,175,55';
      ctx.strokeStyle = 'rgba(' + hue + ',' + rail.alpha + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const drawRangeBox = (rail, index) => {
      const boxHeight = Math.min(126, Math.max(72, height * (0.08 + seeded(index + 131) * 0.035)));
      const y = railY(rail, width * 0.5) - boxHeight * 0.5;
      const x = width * (0.08 + seeded(index + 137) * 0.18);
      const w = width * (0.46 + seeded(index + 139) * 0.28);
      const alpha = lowPower ? 0.035 : 0.052;

      ctx.strokeStyle = 'rgba(212,175,55,' + (alpha * 2.8) + ')';
      ctx.fillStyle = 'rgba(212,175,55,' + alpha + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(x, y, w, boxHeight);
      ctx.fill();
      ctx.stroke();

      ctx.setLineDash([4, 9]);
      ctx.strokeStyle = 'rgba(226,232,240,' + (alpha * 2.2) + ')';
      ctx.beginPath();
      ctx.moveTo(x, y + boxHeight * 0.5);
      ctx.lineTo(x + w, y + boxHeight * 0.5);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawCandle = (candle, index) => {
      const wave = Math.sin(tick * candle.speed + candle.phase);
      const x = candle.x + Math.sin(tick * 0.12 + candle.phase) * 22;
      const y = candle.baseY + wave * 18;
      const body = candle.body * (0.82 + (0.18 * Math.abs(wave)));
      const wick = candle.wick;
      const hue = candle.tone === 'green' ? '34,197,94' : (candle.tone === 'red' ? '239,68,68' : '212,175,55');
      const alpha = 0.055 + (index % 7 === 0 ? 0.04 : 0);
      const bodyTop = candle.side > 0 ? y - body : y;
      const wickTop = bodyTop - wick * 0.44;
      const wickBottom = bodyTop + body + wick * 0.56;

      ctx.strokeStyle = 'rgba(226,232,240,' + (alpha * 2.5) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, wickTop);
      ctx.lineTo(x, wickBottom);
      ctx.stroke();

      ctx.fillStyle = 'rgba(' + hue + ',' + alpha + ')';
      ctx.fillRect(x - 4, bodyTop, 8, Math.max(8, body));

      if (index % 17 === 0 && !lowPower) {
        const pulse = 0.5 + 0.5 * Math.sin(tick * 1.7 + candle.phase);
        ctx.strokeStyle = 'rgba(239,68,68,' + (0.08 + pulse * 0.12) + ')';
        ctx.beginPath();
        ctx.arc(x, wickTop, 8 + pulse * 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const drawPacket = (packet) => {
      if (!rails.length) return;
      packet.x += packet.speed * step;
      if (packet.x > width + 80) packet.x = -80;
      const rail = rails[packet.rail % rails.length];
      const y = railY(rail, packet.x) + Math.sin(tick + packet.phase) * 8;
      const hue = packet.tone === 'green' ? '34,197,94' : '212,175,55';

      ctx.fillStyle = 'rgba(' + hue + ',0.38)';
      ctx.beginPath();
      ctx.arc(packet.x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(' + hue + ',0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(packet.x - 26, y);
      ctx.lineTo(packet.x - 5, y);
      ctx.stroke();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      rails.forEach((rail, index) => {
        drawRail(rail);
        if (index % 2 === 0) drawRangeBox(rail, index);
      });
      candles.forEach(drawCandle);
      packets.forEach(drawPacket);
      ctx.restore();

      ctx.globalCompositeOperation = 'source-over';
    };

    const animate = (now) => {
      const t = now || performance.now();
      const dt = lastT ? t - lastT : 16.67;
      lastT = t;

      if (visible) {
        if (lowPower) {
          acc += dt;
          if (acc >= 34) {
            step = Math.min(3, acc / 16.67);
            tick += 0.015 * step;
            draw();
            acc = 0;
          }
        } else {
          step = Math.min(3, dt / 16.67);
          tick += 0.015 * step;
          draw();
        }
      }

      raf = requestAnimationFrame(animate);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { visible = entry.isIntersecting; });
    }, { threshold: 0 });
    io.observe(host);

    window.addEventListener('resize', resize, { passive: true, signal: abort.signal });

    if (!reduce) {
      raf = requestAnimationFrame(animate);
    } else {
      tick = 2.1;
      draw();
    }

    window.addEventListener('pagehide', () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      abort.abort();
    }, { once: true });
  });

  // ---- Contact cards: pointer tilt + spotlight (scoped to the contact page;
  // the home/module pages have their own [data-tilt] handler in animations.js)
  const tiltCards = document.querySelectorAll('.contact-page-motion [data-tilt]');
  if (tiltCards.length) {
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const MAX_TILT = 6; // degrees

    tiltCards.forEach((card) => {
      const reset = () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--mx', '50%');
        card.style.setProperty('--my', '30%');
        card.classList.remove('is-spotlit');
      };

      if (reduce || !finePointer) {
        reset();
        return;
      }

      let raf = 0;
      let lastX = 0;
      let lastY = 0;

      const render = () => {
        raf = 0;
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = Math.max(0, Math.min(1, (lastX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (lastY - rect.top) / rect.height));
        card.style.setProperty('--mx', (x * 100).toFixed(2) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(2) + '%');
        card.style.setProperty('--ry', ((x - 0.5) * MAX_TILT * 2).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - y) * MAX_TILT * 2).toFixed(2) + 'deg');
      };

      const track = (event) => {
        card.classList.add('is-spotlit');
        lastX = event.clientX;
        lastY = event.clientY;
        if (!raf) raf = requestAnimationFrame(render);
      };

      card.addEventListener('pointerenter', track);
      card.addEventListener('pointermove', track);
      card.addEventListener('pointerleave', () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        reset();
      });
      card.addEventListener('focusin', () => card.classList.add('is-spotlit'));
      card.addEventListener('focusout', reset);
    });
  }

  // ---- Contact page animated backdrop: signal-relay network
  // Nodes linked into a comms graph, with message "packets" travelling the
  // links and radar "pings" rippling out. Pointer brightens + nudges nearby
  // nodes; click emits a ping. Distinct from the pricing liquidity field.
  document.querySelectorAll('.contact-bg-canvas').forEach((canvas) => {
    const host = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    if (!host || !ctx) return;

    // Mobile / low-power path: fewer pixels, fewer elements, 30fps, cheaper draws
    const lowPower = window.matchMedia('(pointer: coarse)').matches
      || window.matchMedia('(max-width: 768px)').matches;
    const dprCap = lowPower ? 1.25 : 2;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    let orbCanvas = null;
    let nodes = [];
    let links = [];
    let packets = [];
    const pings = [];
    let raf = 0;
    let tick = 0;
    let step = 1;
    let lastT = 0;
    let acc = 0;
    let visible = true;
    let pingCooldown = 90;
    const pointer = { x: -9999, y: -9999, active: false };
    const abort = new AbortController();
    const orbs = [
      { hue: '212,175,55', cx: 0.18, cy: 0.12, r: 0.50, ax: 0.05, ay: 0.04, sx: 0.09, sy: 0.06, ph: 0.0, a: 0.22 },
      { hue: '34,197,94', cx: 0.80, cy: 0.28, r: 0.44, ax: 0.06, ay: 0.05, sx: 0.07, sy: 0.11, ph: 1.9, a: 0.15 },
      { hue: '212,175,55', cx: 0.50, cy: 0.85, r: 0.46, ax: 0.07, ay: 0.04, sx: 0.06, sy: 0.09, ph: 3.3, a: 0.12 }
    ];

    const seeded = (seed) => {
      const value = Math.sin(seed * 91.271 + 17.431) * 43758.5453123;
      return value - Math.floor(value);
    };

    const makeField = () => {
      const nodeCount = lowPower
        ? Math.min(30, Math.max(16, Math.round((width * height) / 70000)))
        : Math.min(58, Math.max(26, Math.round((width * height) / 42000)));
      nodes = Array.from({ length: nodeCount }, (_, index) => {
        const baseX = (0.04 + seeded(index + 5) * 0.92) * width;
        const baseY = (0.08 + seeded(index + 19) * 0.84) * height;
        return {
          baseX,
          baseY,
          x: baseX,
          y: baseY,
          glow: 0,
          phase: seeded(index + 29) * Math.PI * 2,
          speed: 0.16 + seeded(index + 41) * 0.26,
          driftX: 10 + seeded(index + 51) * 26,
          driftY: 8 + seeded(index + 59) * 20,
          size: 1.1 + seeded(index + 83) * 1.6,
          tone: seeded(index + 67) > 0.7 ? 'green' : 'gold'
        };
      });

      // Connect each node to its two nearest neighbours (deduplicated)
      links = [];
      const seen = new Set();
      nodes.forEach((node, i) => {
        const dists = [];
        nodes.forEach((other, j) => {
          if (i === j) return;
          const dx = node.baseX - other.baseX;
          const dy = node.baseY - other.baseY;
          dists.push({ j, d: dx * dx + dy * dy });
        });
        dists.sort((a, b) => a.d - b.d);
        for (let k = 0; k < Math.min(2, dists.length); k += 1) {
          const j = dists[k].j;
          const key = i < j ? i + '-' + j : j + '-' + i;
          if (seen.has(key)) continue;
          seen.add(key);
          links.push({ a: i, b: j });
        }
      });

      const packetCount = links.length ? Math.min(lowPower ? 10 : 18, Math.max(8, Math.round(links.length * 0.35))) : 0;
      packets = Array.from({ length: packetCount }, (_, index) => ({
        link: Math.floor(seeded(index + 7) * links.length) % Math.max(1, links.length),
        t: seeded(index + 13),
        speed: 0.003 + seeded(index + 23) * 0.005,
        hue: seeded(index + 37) > 0.72 ? '34,197,94' : '212,175,55'
      }));
    };

    // On mobile, bake the (static) orb glow into an offscreen layer once per
    // resize so the loop can blit it instead of rebuilding 3 radial gradients
    // + 3 full-canvas fills every frame.
    const buildOrbLayer = () => {
      orbCanvas = document.createElement('canvas');
      orbCanvas.width = Math.max(1, Math.round(width));
      orbCanvas.height = Math.max(1, Math.round(height));
      const octx = orbCanvas.getContext('2d');
      if (!octx) { orbCanvas = null; return; }
      octx.globalCompositeOperation = 'lighter';
      orbs.forEach((orb) => {
        const ox = orb.cx * width;
        const oy = orb.cy * height;
        const radius = orb.r * Math.max(width, height);
        const g = octx.createRadialGradient(ox, oy, 0, ox, oy, radius);
        g.addColorStop(0, 'rgba(' + orb.hue + ',' + orb.a + ')');
        g.addColorStop(0.5, 'rgba(' + orb.hue + ',' + (orb.a * 0.34) + ')');
        g.addColorStop(1, 'rgba(' + orb.hue + ',0)');
        octx.fillStyle = g;
        octx.fillRect(0, 0, width, height);
      });
    };

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeField();
      if (lowPower) buildOrbLayer();
    };

    const update = () => {
      const pointerRadius = Math.min(220, Math.max(140, width * 0.16));
      const prSq = pointerRadius * pointerRadius;
      const motion = reduce ? 0 : 1;
      const pingLimit = Math.max(width, height) * 1.1;

      for (let i = pings.length - 1; i >= 0; i -= 1) {
        pings[i].r += 3.2 * motion * step;
        if (pings[i].r > pings[i].max) pings.splice(i, 1);
      }

      if (!reduce && nodes.length) {
        pingCooldown -= 1;
        if (pingCooldown <= 0) {
          const n = nodes[Math.floor(Math.random() * nodes.length)];
          pings.push({ x: n.x, y: n.y, r: 0, max: pingLimit * 0.5 });
          pingCooldown = 150 + Math.floor(Math.random() * 120);
        }
      }

      nodes.forEach((node) => {
        let x = node.baseX +
          Math.sin(tick * node.speed + node.phase) * node.driftX +
          Math.cos(tick * 0.14 + node.phase * 0.7) * node.driftX * 0.3;
        let y = node.baseY +
          Math.cos(tick * (node.speed * 0.85) + node.phase) * node.driftY +
          Math.sin(tick * 0.12 + node.phase * 1.2) * node.driftY * 0.34;
        let glow = 0;

        if (pointer.active && !reduce) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < prSq) {
            const dist = Math.sqrt(dSq) || 1;
            const falloff = 1 - dist / pointerRadius;
            glow = Math.max(glow, falloff);
            const pull = falloff * falloff * 26;
            x -= (dx / dist) * pull;
            y -= (dy / dist) * pull;
          }
        }

        pings.forEach((ping) => {
          const rx = x - ping.x;
          const ry = y - ping.y;
          const rd = Math.sqrt(rx * rx + ry * ry) || 1;
          const band = Math.abs(rd - ping.r);
          if (band < 34) {
            glow = Math.max(glow, (1 - band / 34) * (1 - ping.r / ping.max) * 0.9);
          }
        });

        node.x = x;
        node.y = y;
        node.glow += (glow - node.glow) * (reduce ? 1 : 0.12);
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      if (lowPower && orbCanvas) {
        ctx.drawImage(orbCanvas, 0, 0, width, height);
      } else {
        orbs.forEach((orb) => {
          const ox = (orb.cx + Math.sin(tick * orb.sx + orb.ph) * orb.ax) * width;
          const oy = (orb.cy + Math.cos(tick * orb.sy + orb.ph) * orb.ay) * height;
          const radius = orb.r * Math.max(width, height);
          const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius);
          g.addColorStop(0, 'rgba(' + orb.hue + ',' + orb.a + ')');
          g.addColorStop(0.5, 'rgba(' + orb.hue + ',' + (orb.a * 0.34) + ')');
          g.addColorStop(1, 'rgba(' + orb.hue + ',0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, width, height);
        });
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      links.forEach((link) => {
        const a = nodes[link.a];
        const b = nodes[link.b];
        if (!a || !b) return;
        const energy = Math.max(a.glow, b.glow);
        ctx.strokeStyle = 'rgba(212,175,55,' + (0.05 + energy * 0.25) + ')';
        ctx.lineWidth = 0.7 + energy * 0.9;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });

      packets.forEach((p) => {
        if (!links.length) return;
        const link = links[p.link % links.length];
        if (!link) return;
        const a = nodes[link.a];
        const b = nodes[link.b];
        if (!a || !b) return;
        p.t += p.speed * (reduce ? 0 : step);
        if (p.t >= 1) {
          p.t = 0;
          p.link = Math.floor(Math.random() * links.length);
        }
        const px = a.x + (b.x - a.x) * p.t;
        const py = a.y + (b.y - a.y) * p.t;
        const back = Math.max(0, p.t - 0.085);
        const tx = a.x + (b.x - a.x) * back;
        const ty = a.y + (b.y - a.y) * back;
        if (lowPower) {
          ctx.strokeStyle = 'rgba(' + p.hue + ',0.6)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(px, py);
          ctx.stroke();
          ctx.fillStyle = 'rgba(' + p.hue + ',0.9)';
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const trail = ctx.createLinearGradient(tx, ty, px, py);
          trail.addColorStop(0, 'rgba(' + p.hue + ',0)');
          trail.addColorStop(1, 'rgba(' + p.hue + ',0.85)');
          ctx.strokeStyle = trail;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(px, py);
          ctx.stroke();
          const head = ctx.createRadialGradient(px, py, 0, px, py, 7);
          head.addColorStop(0, 'rgba(' + p.hue + ',0.9)');
          head.addColorStop(1, 'rgba(' + p.hue + ',0)');
          ctx.fillStyle = head;
          ctx.beginPath();
          ctx.arc(px, py, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      nodes.forEach((node) => {
        const wave = 0.5 + 0.5 * Math.sin(tick * 0.8 + node.phase);
        const alpha = 0.16 + wave * 0.12 + node.glow * 0.6;
        const r = node.size + wave * 0.3 + node.glow * 1.8;
        const hue = node.glow > 0.05 ? '212,175,55' : (node.tone === 'green' ? '52,211,120' : '212,175,55');
        if (node.glow > 0.12 && !lowPower) {
          const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 4.5);
          glow.addColorStop(0, 'rgba(' + hue + ',' + (alpha * 0.45) + ')');
          glow.addColorStop(1, 'rgba(' + hue + ',0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(' + hue + ',' + alpha + ')';
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fill();
      });

      pings.forEach((ping) => {
        const fade = 1 - ping.r / ping.max;
        ctx.strokeStyle = 'rgba(212,175,55,' + (fade * 0.22) + ')';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(ping.x, ping.y, ping.r, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.globalCompositeOperation = 'source-over';
    };

    const animate = (now) => {
      const t = now || performance.now();
      const dt = lastT ? t - lastT : 16.67;
      lastT = t;
      if (visible) {
        if (lowPower) {
          // Throttle to ~30fps; advance motion by elapsed time so speed holds.
          acc += dt;
          if (acc >= 32) {
            step = Math.min(3, acc / 16.67);
            tick += 0.016 * step;
            update();
            draw();
            acc = 0;
          }
        } else {
          step = Math.min(3, dt / 16.67);
          tick += 0.016 * step;
          update();
          draw();
        }
      }
      raf = requestAnimationFrame(animate);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { visible = entry.isIntersecting; });
    }, { threshold: 0 });
    io.observe(host);

    window.addEventListener('pointermove', (event) => {
      const bounds = host.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    }, { passive: true, signal: abort.signal });

    window.addEventListener('blur', () => { pointer.active = false; }, { signal: abort.signal });

    if (!reduce) {
      host.parentElement?.addEventListener('pointerdown', (event) => {
        const bounds = host.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) return;
        pings.push({ x: event.clientX - bounds.left, y: event.clientY - bounds.top, r: 0, max: Math.max(width, height) * 1.1 });
        if (pings.length > 6) pings.shift();
      }, { passive: true, signal: abort.signal });
      raf = requestAnimationFrame(animate);
    } else {
      tick = 1.4;
      update();
      draw();
    }

    window.addEventListener('pagehide', () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      abort.abort();
    }, { once: true });
  });

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

  // ---- Static-site form guard
  document.querySelectorAll('form[data-static-form]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const status = form.querySelector('.form-status');
      if (!status) return;
      status.textContent = form.dataset.staticMessage || 'This form is not connected yet.';
      status.classList.add('visible');
      status.focus?.();
    });
  });

  // ---- Year stamp
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
})();
