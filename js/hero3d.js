/* ============================================================
   The Khan Trading — hero 3D background
   ------------------------------------------------------------
   A brand-adapted recreation of ALEX BENDER / FANCY's
   "Trading Landing page" 3D animation: a slowly tumbling cluster
   of fluted "ticker" slabs (forex pairs), a glowing amber cube,
   and polished chrome spheres on a near-black stage, with bloom.

   Palette is pulled from the site tokens (--gold #D4AF37). Runs
   only while the hero is on screen, freezes for reduced-motion,
   and degrades to the CSS mesh background when WebGL is absent.
   ============================================================ */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const hero = document.querySelector('.hero');
const canvas = document.getElementById('hero3d');

/* ---- guards & graceful fallback ------------------------------------ */
function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- brand palette -------------------------------------------------- */
const COL = {
  gold:  0xD4AF37,   // --gold
  amber: 0xE8A33D,   // warmer accent for the emissive cube
  key:   0xFFC061,   // warm key light
  fill:  0x2B4A6B,   // cool fill for separation
  panel: 0x0D0F13,   // slab base (near-black)
};

/* Forex / metals labels — no crypto, matching the site's positioning. */
const LABELS = ['XAUUSD', 'GOLD', 'EURUSD', 'GBPUSD', 'USDJPY', 'DXY'];

function init() {
  hero.classList.add('hero-3d-on');

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 9.2);

  /* Custom warm environment: a near-black surround with a single warm
     key highlight, so the chrome spheres read as dark polished metal with
     one molten glint (not a bright multi-window studio). */
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = makeEnvTexture();
  scene.environment = pmrem.fromEquirectangular(envTex).texture;
  envTex.dispose();
  pmrem.dispose();

  /* ---- lighting: dark stage, one warm key, dim cool rim ---- */
  scene.add(new THREE.AmbientLight(0xffffff, 0.24));
  const key = new THREE.DirectionalLight(COL.key, 3.6);
  key.position.set(4.5, 3.5, 6);
  scene.add(key);
  const warm = new THREE.DirectionalLight(0xffd9a0, 0.85);
  warm.position.set(-2.5, 1.5, 5.5);
  scene.add(warm);
  const fill = new THREE.DirectionalLight(COL.fill, 0.6);
  fill.position.set(-6, -1.5, 2.5);
  scene.add(fill);

  /* ---- shared textures ---- */
  const fluting = makeFlutingBump();

  const group = new THREE.Group();
  group.scale.setScalar(1.12);
  scene.add(group);

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x15171d, roughness: 0.55, metalness: 0.42,
    envMapIntensity: 0.9,
    bumpMap: fluting, bumpScale: 0.03,
  });

  /* ---- the fluted ticker slabs ---- */
  const slabGeo = new THREE.BoxGeometry(2.0, 3.0, 0.16);
  const slabConfigs = [
    { pos: [-2.7, 0.4, -0.6], rot: [0.05, 0.42, 0.08], scale: 1.05 },
    { pos: [-0.7, -0.6, 0.9], rot: [-0.04, 0.2, -0.06], scale: 0.92 },
    { pos: [1.2, 0.9, -0.2], rot: [0.08, -0.28, 0.05], scale: 1.0 },
    { pos: [2.9, -0.3, -1.1], rot: [-0.02, -0.5, -0.04], scale: 1.12 },
    { pos: [0.5, 1.7, -1.8], rot: [0.12, 0.1, 0.02], scale: 0.85 },
    { pos: [-1.9, -1.8, -0.1], rot: [-0.1, 0.34, 0.1], scale: 0.95 },
  ];

  slabConfigs.forEach((cfg, i) => {
    const faceMat = new THREE.MeshStandardMaterial({
      color: 0x15171d, roughness: 0.48, metalness: 0.4,
      envMapIntensity: 0.9,
      bumpMap: fluting, bumpScale: 0.03,
      emissive: new THREE.Color(COL.gold),
      emissiveMap: makeLabelTexture(LABELS[i % LABELS.length]),
      emissiveIntensity: 1.7,
    });
    // BoxGeometry material order: +x,-x,+y,-y,+z,-z. Label only on the front (+z).
    const mats = [baseMat, baseMat, baseMat, baseMat, faceMat, baseMat];
    const slab = new THREE.Mesh(slabGeo, mats);
    slab.position.set(...cfg.pos);
    slab.rotation.set(...cfg.rot);
    slab.scale.setScalar(cfg.scale);
    slab.userData = { y0: cfg.pos[1], rz0: cfg.rot[2], phase: i * 1.7 };
    group.add(slab);
  });

  /* ---- glowing amber focal cube ---- */
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 1.15, 1.15),
    new THREE.MeshStandardMaterial({
      color: 0x1a1206, roughness: 0.4, metalness: 0.2,
      emissive: new THREE.Color(COL.amber), emissiveIntensity: 3.2,
    })
  );
  cube.position.set(1.5, -1.0, 1.4);
  cube.rotation.set(0.3, 0.5, 0.1);
  cube.userData = { y0: cube.position.y, rz0: cube.rotation.z, phase: 2.2 };
  group.add(cube);

  // warm spill from the cube onto nearby slabs
  const spill = new THREE.PointLight(COL.amber, 6, 14, 2);
  spill.position.copy(cube.position);
  group.add(spill);

  /* ---- polished chrome spheres ---- */
  const sphereGeo = new THREE.SphereGeometry(0.55, 48, 48);
  const sphereMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 1.0, roughness: 0.14, envMapIntensity: 1.5 });
  [[-0.2, 1.0, 1.6, 0.9], [2.4, 1.3, 0.3, 0.6], [-2.2, -0.7, 1.2, 0.72]].forEach(([x, y, z, s], i) => {
    const sph = new THREE.Mesh(sphereGeo, sphereMat);
    sph.position.set(x, y, z);
    sph.scale.setScalar(s);
    sph.userData = { y0: y, rz0: 0, phase: i * 2.6 + 0.5 };
    group.add(sph);
  });

  /* ---- post-processing: bloom for the molten glow ---- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 1.05, 0.5, 0.78);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ---- sizing ---- */
  function resize() {
    const w = Math.max(1, hero.clientWidth);
    const h = Math.max(1, hero.clientHeight);
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(hero);
  resize();

  /* ---- pointer parallax ---- */
  let tgX = 0, tgY = 0, pX = 0, pY = 0;
  window.addEventListener('pointermove', (e) => {
    tgX = (e.clientX / window.innerWidth) - 0.5;
    tgY = (e.clientY / window.innerHeight) - 0.5;
  }, { passive: true });

  /* ---- render loop, gated to visibility ---- */
  const clock = new THREE.Clock();
  let raf = 0;
  let visible = true;

  function renderFrame() {
    const t = clock.getElapsedTime();
    pX += (tgX - pX) * 0.05;
    pY += (tgY - pY) * 0.05;

    group.rotation.y = t * 0.11 + pX * 0.45;
    group.rotation.x = Math.sin(t * 0.22) * 0.05 - pY * 0.28;

    group.children.forEach((m) => {
      const u = m.userData;
      if (!u || u.y0 === undefined) return;            // skip the spill light
      m.position.y = u.y0 + Math.sin(t * 0.6 + u.phase) * 0.12;
      m.rotation.z = u.rz0 + Math.sin(t * 0.3 + u.phase) * 0.04;
    });

    composer.render();
  }

  function loop() {
    if (!visible) { raf = 0; return; }
    renderFrame();
    raf = requestAnimationFrame(loop);
  }

  const io = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && !reduceMotion && !raf) loop();
  }, { threshold: 0 });
  io.observe(hero);

  if (reduceMotion) {
    renderFrame();          // single static frame, no animation
  } else {
    loop();
  }
}

/* ============================================================
   Texture helpers
   ============================================================ */

/* Equirectangular environment — dark surround + one warm key glint. */
function makeEnvTexture() {
  const w = 1024, h = 512;
  const cvs = document.createElement('canvas');
  cvs.width = w; cvs.height = h;
  const ctx = cvs.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#1b1408');
  g.addColorStop(0.5, '#0a0a0c');
  g.addColorStop(1, '#050506');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // warm key highlight (the glint the chrome reflects)
  const r = ctx.createRadialGradient(w * 0.7, h * 0.34, 0, w * 0.7, h * 0.34, h * 0.46);
  r.addColorStop(0, 'rgba(255, 216, 150, 0.95)');
  r.addColorStop(0.4, 'rgba(232, 163, 61, 0.42)');
  r.addColorStop(1, 'rgba(232, 163, 61, 0)');
  ctx.fillStyle = r; ctx.fillRect(0, 0, w, h);
  // dim cool counter-light so spheres keep their form
  const r2 = ctx.createRadialGradient(w * 0.18, h * 0.62, 0, w * 0.18, h * 0.62, h * 0.32);
  r2.addColorStop(0, 'rgba(120, 150, 190, 0.16)');
  r2.addColorStop(1, 'rgba(120, 150, 190, 0)');
  ctx.fillStyle = r2; ctx.fillRect(0, 0, w, h);
  const tex = new THREE.CanvasTexture(cvs);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* Fine vertical ribbing for the slab surfaces (used as a bump map).
   One smooth ridge cycle, tiled many times across each panel. */
function makeFlutingBump() {
  const w = 256, h = 4;
  const cvs = document.createElement('canvas');
  cvs.width = w; cvs.height = h;
  const ctx = cvs.getContext('2d');
  const img = ctx.createImageData(w, h);
  for (let x = 0; x < w; x++) {
    // sharpen the valleys a touch so ribs read as crisp lines
    const s = 0.5 + 0.5 * Math.sin((x / w) * Math.PI * 2);
    const v = Math.round(255 * Math.pow(s, 0.7));
    for (let y = 0; y < h; y++) {
      const o = (y * w + x) * 4;
      img.data[o] = img.data[o + 1] = img.data[o + 2] = v;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(22, 1);        // ~22 ribs across a slab
  tex.anisotropy = 4;
  return tex;
}

/* White ticker text on black → drives the gold emissive map. */
function makeLabelTexture(text) {
  const size = 512;
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = size;
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let fs = 132;
  ctx.font = `700 ${fs}px "Space Grotesk", Arial, sans-serif`;
  // shrink to fit within the panel width
  while (ctx.measureText(text).width > size * 0.82 && fs > 40) {
    fs -= 6;
    ctx.font = `700 ${fs}px "Space Grotesk", Arial, sans-serif`;
  }
  ctx.fillText(text, size / 2, size / 2);
  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* ============================================================
   Boot — runs after every const/function above is initialized
   ============================================================ */
if (!hero || !canvas || !webglAvailable()) {
  // No canvas target or no WebGL → keep the CSS mesh-gradient backdrop.
  if (hero) hero.classList.add('no-3d');
} else {
  try {
    init();
  } catch (err) {
    console.error('[hero3d] init failed, falling back to CSS background:', err);
    hero.classList.add('no-3d');
  }
}
