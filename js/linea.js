// Maretich · Landing de línea (a medida) — GSAP + ScrollTrigger + ScrollSmoother + SplitText
(function () {
const { gsap, ScrollTrigger, ScrollSmoother, SplitText, CustomEase } = window;
gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, CustomEase);
CustomEase.create('casa', 'M0,0 C0.8,0 0,1 1,1');

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const EASE_OUT = 'expo.out';

async function inlineSvgs() {
  const cache = {};
  await Promise.all($$('[data-svg]').map(async (el) => {
    const url = el.dataset.svg;
    cache[url] = cache[url] || fetch(url).then((r) => r.text());
    el.innerHTML = await cache[url];
  }));
}

// ---------- Scroll suave y anclas internas ----------
let smoother = null;
const goTo = (t) => (smoother ? smoother.scrollTo(t, true, 'top 90px') : t.scrollIntoView({ behavior: 'smooth' }));
function initSmooth() {
  if (!reduce) smoother = ScrollSmoother.create({ wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: 1.1, smoothTouch: 0.1, effects: false });
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const t = document.querySelector(id);
    if (!t) return;
    e.preventDefault();
    $('.nav').classList.remove('is-open');
    goTo(t);
  }));
  // los catálogos completos de cada categoría son el próximo paso: por ahora no navegan
  $$('[data-catalog]').forEach((a) => a.addEventListener('click', (e) => { if (a.getAttribute('href') === '#') e.preventDefault(); }));
}

// ---------- Encabezado ----------
function initHero() {
  if (reduce) return;
  if (document.body.classList.contains('has-intro')) {
    gsap.from(['.lm-hero__lead', '.lm-index li'], { autoAlpha: 0, y: 16, duration: 1.1, stagger: 0.06, ease: EASE_OUT, scrollTrigger: { trigger: '.lm-hero', start: 'top 70%' } });
    return;
  }
  const title = new SplitText('.lm-hero__title', { type: 'words,chars', mask: 'chars' });
  const tl = gsap.timeline({ delay: 0.15 });
  tl.from(title.chars, { yPercent: 105, duration: 1.4, stagger: 0.025, ease: 'casa' })
    .from('.lm-hero__crumb', { autoAlpha: 0, y: 10, duration: 1, ease: EASE_OUT }, 0.3)
    .from(['.lm-hero__lead', '.lm-index li'], { autoAlpha: 0, y: 18, duration: 1.1, stagger: 0.06, ease: EASE_OUT }, 0.6);
}

// ---------- Filas: entrada, deriva horizontal con el scroll, arrastre y cursor ----------
function initCats() {
  $$('.cat').forEach((cat) => {
    const track = $('.cat__track', cat);
    const imgs = $$('.cat__img', cat);
    if (!reduce) {
      const t = new SplitText($('.cat__title a', cat), { type: 'lines', mask: 'lines' });
      gsap.timeline({ scrollTrigger: { trigger: cat, start: 'top 82%' } })
        .from(t.lines, { yPercent: 110, duration: 1.3, ease: EASE_OUT })
        .from([$('.cat__n', cat), $('.cat__desc', cat), $('.cat__link', cat)], { autoAlpha: 0, y: 14, duration: 1, stagger: 0.06, ease: EASE_OUT }, 0.1)
        .fromTo(imgs, { clipPath: 'inset(100% 0% 0% 0%)', y: 60 }, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.3, stagger: 0.07, ease: 'casa', clearProps: 'clipPath' }, 0.15);
      // la tira entra desde la derecha mientras la fila cruza la pantalla
      gsap.fromTo(track, { x: () => window.innerWidth * 0.12 }, { x: 0, ease: 'none', scrollTrigger: { trigger: cat, start: 'top bottom', end: 'center center', scrub: 0.8, invalidateOnRefresh: true } });
    }
    initDrag($('.cat__strip', cat));
  });
}

function initDrag(strip) {
  let down = false, moved = false, startX = 0, startL = 0, lastX = 0, lastT = 0, vel = 0;
  const glide = () => {
    if (Math.abs(vel) < 0.05) { gsap.ticker.remove(glide); return; }
    strip.scrollLeft -= vel * 16;
    vel *= 0.92;
  };
  strip.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true; moved = false; startX = lastX = e.clientX; startL = strip.scrollLeft; lastT = performance.now(); vel = 0;
    gsap.ticker.remove(glide);
  });
  window.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 5) { moved = true; strip.classList.add('is-dragging'); }
    if (!moved) return;
    strip.scrollLeft = startL - dx;
    const now = performance.now();
    vel = (e.clientX - lastX) / Math.max(1, now - lastT);
    lastX = e.clientX; lastT = now;
  });
  window.addEventListener('pointerup', () => {
    if (!down) return;
    down = false;
    if (moved) {
      gsap.ticker.add(glide);
      // el clic que cierra el arrastre no tiene que abrir la foto
      strip.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); }, { capture: true, once: true });
      setTimeout(() => strip.classList.remove('is-dragging'), 0);
    }
  });
  strip.addEventListener('dragstart', (e) => e.preventDefault());
}

function initCursor() {
  const c = $('.drag-cursor');
  if (!c || !finePointer) return;
  // solo aparece sobre las fotos que se pueden arrastrar (no en toda la tira ni en el resto de la página)
  const SEL = '.cat__img, .feat:not(.is-open) .feat__media';
  const xTo = gsap.quickTo(c, 'x', { duration: 0.45, ease: 'power3' });
  const yTo = gsap.quickTo(c, 'y', { duration: 0.45, ease: 'power3' });
  let px = -999, py = -999, shown = false, pressed = false;
  const check = () => {
    const el = px < 0 ? null : document.elementFromPoint(px, py);
    const on = !!(el && el.closest(SEL));
    if (on !== shown) { shown = on; gsap.to(c, { scale: on ? (pressed ? 0.82 : 1) : 0, duration: on ? 0.5 : 0.35, ease: EASE_OUT, overwrite: 'auto' }); }
  };
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (px < 0) gsap.set(c, { x: e.clientX, y: e.clientY });
    px = e.clientX; py = e.clientY; xTo(px); yTo(py); check();
  });
  document.addEventListener('pointerleave', () => { px = -999; check(); });
  window.addEventListener('pointerdown', () => { pressed = true; if (shown) gsap.to(c, { scale: 0.82, duration: 0.3, ease: EASE_OUT }); });
  window.addEventListener('pointerup', () => { pressed = false; if (shown) gsap.to(c, { scale: 1, duration: 0.4, ease: EASE_OUT }); });
  // al scrollear, el contenido se mueve bajo el cursor quieto: hay que volver a mirar qué hay debajo
  ScrollTrigger.addEventListener('scrollEnd', check);
  gsap.ticker.add(() => { if (px >= 0) check(); });
}

// ---------- Catálogo de una categoría: entrada, destacadas, grilla y cambio de color ----------
function initIntro() {
  const intro = $('.lm-intro');
  const title = $('.has-intro .lm-hero__title');
  if (!intro || !title) return;
  if (reduce) { document.body.classList.remove('js-wait'); return; }
  // la palabra arranca grande y blanca en el centro de la foto y baja hasta su lugar de título
  const from = () => {
    const r = title.getBoundingClientRect();
    const sc = smoother ? smoother.scrollTop() : window.scrollY;
    const top = r.top + sc;                       // posición en la página, sin el scroll actual
    const scale = Math.min(3.4, (window.innerWidth * 0.6) / r.width);
    return { x: window.innerWidth / 2 - (r.width * scale) / 2 - r.left, y: window.innerHeight / 2 - (top + r.height / 2), scale };
  };
  let F = null;
  const measure = () => { gsap.set(title, { clearProps: 'transform' }); F = from(); };
  measure();
  gsap.set(title, { x: F.x, y: F.y, scale: F.scale, color: '#e6e5e0', force3D: false });
  document.body.classList.remove('js-wait');
  const tl = gsap.timeline({ scrollTrigger: { trigger: intro, start: 'top top', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true, onRefreshInit: () => { measure(); } } });
  tl.fromTo(title, { x: () => F.x, y: () => F.y, scale: () => F.scale }, { x: 0, y: 0, scale: 1, ease: 'power1.inOut', force3D: false, duration: 1 }, 0)
    .fromTo(title, { color: '#e6e5e0' }, { color: '#38261c', ease: 'none', duration: 0.3 }, 0.55)
    .fromTo('.lm-hero__crumb', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: 'none' }, 0.88)
    .fromTo($('img', intro), { yPercent: 0, scale: 1.04 }, { yPercent: 28, scale: 1.12, ease: 'none', duration: 1 }, 0);
  // entrada al cargar: la foto se abre y la palabra aparece
  gsap.from($('img', intro), { scale: 1.25, duration: 2, ease: 'expo.out' });
  gsap.from(title, { autoAlpha: 0, duration: 1.4, delay: 0.25, ease: 'power2.out' });
}

function initFeatured() {
  // las posiciones de los disparadores se recalculan cuando terminó de cambiar el tamaño de la tarjeta
  let dc = null;
  const later = () => { if (dc) dc.kill(); dc = gsap.delayedCall(1.05, () => ScrollTrigger.refresh()); };
  $$('.feat').forEach((card) => {
    const strip = card.closest('.feat-strip');
    const media = $('.feat__media', card);
    const fd = $('.fd', card);
    const main = $('.fd__main', fd);
    const count = $('.fd__count b', fd);
    const thumbs = $$('.fd__thumb', fd);
    const show = (i) => {
      thumbs.forEach((t, j) => t.classList.toggle('is-on', j === i));
      count.textContent = i + 1;
      const src = $('img', thumbs[i]).getAttribute('src');
      gsap.to(main, { autoAlpha: 0, duration: 0.25, onComplete: () => { main.src = src; gsap.to(main, { autoAlpha: 1, duration: 0.5 }); } });
    };
    thumbs.forEach((t, i) => t.addEventListener('click', () => show(i)));
    main.addEventListener('click', () => show((thumbs.findIndex((t) => t.classList.contains('is-on')) + 1) % thumbs.length));
    const close = () => {
      card.classList.remove('is-open'); fd.setAttribute('aria-hidden', 'true'); media.setAttribute('aria-expanded', 'false');
      later();
    };
    const open = () => {
      $$('.feat.is-open').forEach((o) => o !== card && o.querySelector('.fd__close').click());
      card.classList.add('is-open'); fd.setAttribute('aria-hidden', 'false'); media.setAttribute('aria-expanded', 'true');
      gsap.fromTo([$('.fd__stage', fd), ...$$('.fd__info > *', fd)], { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.04, ease: EASE_OUT, delay: 0.15 });
      // la tira se corre para que la puerta abierta quede entera a la vista
      const pad = parseFloat(getComputedStyle(strip).paddingLeft) || 0;
      gsap.to(strip, { scrollLeft: card.offsetLeft - pad, duration: 1, ease: 'expo.inOut' });
      if (smoother) smoother.scrollTo(strip.closest('.mat__block'), true, 'top 80px');
      later();
    };
    media.addEventListener('click', open);
    $('.fd__close', fd).addEventListener('click', close);
  });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.feat.is-open .fd__close').forEach((b) => b.click()); });
}

// cambia el color de todas las puertas de la materialidad: laca lisa o textura de madera, conservando sombras y molduras
function initTint() {
  const cache = new WeakMap();
  const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const texCache = {};
  const prep = async (img) => {
    if (cache.has(img)) return cache.get(img);
    if (!img.complete || !img.naturalWidth) await new Promise((r) => img.addEventListener('load', r, { once: true }));
    const w = img.naturalWidth, h = img.naturalHeight;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const x = cv.getContext('2d', { willReadFrequently: true });
    x.filter = 'blur(0.8px)'; x.drawImage(img, 0, 0); x.filter = 'none';
    const soft = x.getImageData(0, 0, w, h).data;
    x.clearRect(0, 0, w, h); x.drawImage(img, 0, 0);
    const src = x.getImageData(0, 0, w, h);
    // luminancia de referencia: la mediana de la hoja de la puerta
    const L = new Float32Array(w * h); const sample = [];
    for (let i = 0, p = 0; i < soft.length; i += 4, p++) {
      const l = (0.299 * soft[i] + 0.587 * soft[i + 1] + 0.114 * soft[i + 2]) / 255; L[p] = l;
      if (src.data[i + 3] > 200 && (p % 7 === 0)) sample.push(l);
    }
    sample.sort((a, b) => a - b);
    const ref = sample[Math.floor(sample.length * 0.6)] || 1;
    const out = document.createElement('canvas'); out.width = w; out.height = h;
    img.parentNode.appendChild(out);
    const d = { w, h, L, ref, alpha: src.data, out };
    cache.set(img, d);
    return d;
  };
  const texPixels = async (url, w, h) => {
    const key = url + w + 'x' + h;
    if (texCache[key]) return texCache[key];
    const t = await loadImg(url);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const x = cv.getContext('2d');
    // veta vertical: la muestra se gira y se estira a lo alto de la puerta
    x.translate(w / 2, h / 2); x.rotate(Math.PI / 2);
    const s = Math.max(h / t.width, w / t.height);
    x.drawImage(t, (-t.width * s) / 2, (-t.height * s) / 2, t.width * s, t.height * s);
    return (texCache[key] = x.getImageData(0, 0, w, h).data);
  };
  const hex = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const paint = async (img, opt) => {
    const d = await prep(img);
    const { w, h, L, ref, alpha, out } = d;
    const x = out.getContext('2d');
    const o = x.createImageData(w, h); const od = o.data;
    const tex = opt.tex ? await texPixels(opt.tex, w, h) : null;
    const col = opt.color ? hex(opt.color) : null;
    let lum = 0.5;
    if (col) lum = (0.299 * col[0] + 0.587 * col[1] + 0.114 * col[2]) / 255;
    // en colores oscuros se marcan más las molduras para que no se pierdan
    const gain = lum < 0.35 ? 2.4 : 1.15;
    for (let i = 0, p = 0; i < od.length; i += 4, p++) {
      const a = alpha[i + 3]; if (!a) continue;
      const sh = L[p] / ref;
      let f = 1 + (sh - 1) * gain; if (f < 0.05) f = 0.05;
      const hi = sh > 1 ? (sh - 1) * 60 : 0;
      const r = col ? col[0] : tex[i], g = col ? col[1] : tex[i + 1], b = col ? col[2] : tex[i + 2];
      od[i] = r * f + hi; od[i + 1] = g * f + hi; od[i + 2] = b * f + hi; od[i + 3] = a;
    }
    x.putImageData(o, 0, 0);
    img.parentNode.classList.add('is-tinted');
  };
  $$('.mat').forEach((mat) => {
    const btns = $$('.sw__btn', mat);
    const imgs = $$('.door__img img', mat);
    btns.forEach((btn) => btn.addEventListener('click', async () => {
      const on = btn.getAttribute('aria-pressed') === 'true';
      btns.forEach((b) => b.setAttribute('aria-pressed', 'false'));
      if (on) { imgs.forEach((i) => i.parentNode.classList.remove('is-tinted')); return; }
      btn.setAttribute('aria-pressed', 'true');
      const opt = { color: btn.dataset.color, tex: btn.dataset.tex };
      // de a tandas para que la página no se trabe
      for (let k = 0; k < imgs.length; k += 6) {
        if (btn.getAttribute('aria-pressed') !== 'true') return;
        await Promise.all(imgs.slice(k, k + 6).map((i) => paint(i, opt)));
        await new Promise((r) => requestAnimationFrame(r));
      }
    }));
  });
}

function initCatalog() {
  const mats = $$('.mat');
  if (!mats.length) return;
  $$('[data-drag]').forEach(initDrag);
  initFeatured();
  initTint();
  if (reduce) return;
  mats.forEach((m) => {
    const t = new SplitText($('.mat__title', m), { type: 'lines', mask: 'lines' });
    gsap.timeline({ scrollTrigger: { trigger: m, start: 'top 82%' } })
      .from(t.lines, { yPercent: 110, duration: 1.3, ease: EASE_OUT })
      .from([$('.mat__n', m), $('.mat__desc', m), $('.mat__count', m)], { autoAlpha: 0, y: 14, duration: 1, stagger: 0.06, ease: EASE_OUT }, 0.1);
    const feats = $$('.feat', m);
    gsap.fromTo($$('.feat__media', m), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, stagger: 0.08, ease: 'casa', clearProps: 'clipPath', scrollTrigger: { trigger: $('.feat-strip', m), start: 'top 85%' } });
    gsap.from(feats.map((f) => [$('.feat__name', f), $('.feat__txt', f), $('.feat__cta', f)]).flat(), { autoAlpha: 0, y: 14, duration: 1, stagger: 0.03, ease: EASE_OUT, scrollTrigger: { trigger: $('.feat-strip', m), start: 'top 75%' } });
  });
  // la grilla entra de a filas a medida que aparece
  gsap.set('.door', { autoAlpha: 0, y: 40 });
  ScrollTrigger.batch('.door', { start: 'top 92%', once: true, onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.05, ease: EASE_OUT, clearProps: 'transform' }) });
  gsap.set('.sw', { autoAlpha: 0, y: 20 });
  ScrollTrigger.batch('.sw', { start: 'top 94%', once: true, onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.035, ease: EASE_OUT, clearProps: 'transform' }) });
}

// ---------- Textos y footer (iguales a la home) ----------
function initTexts() {
  if (!reduce) $$('[data-lines]').forEach((el) => {
    const s = new SplitText(el, { type: 'lines', mask: 'lines' });
    gsap.from(s.lines, { yPercent: 110, duration: 1.3, stagger: 0.1, ease: EASE_OUT, scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
}

function initFooter() {
  const f = $('.footer');
  if (!f) return;
  if (!reduce) {
    gsap.fromTo('.footer__inner', { yPercent: -28 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom bottom', scrub: true } });
    gsap.from('.footer__col', { y: 30, autoAlpha: 0, duration: 1, stagger: 0.07, ease: EASE_OUT, scrollTrigger: { trigger: '.footer__cols', start: 'top 85%' } });
    gsap.fromTo('.footer__logo', { clipPath: 'inset(0% 0% 100% 0%)', yPercent: 12 }, { clipPath: 'inset(0% 0% 0% 0%)', yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer__brand', start: 'top 98%', end: 'bottom 92%', scrub: 0.6 } });
  }
  const up = $('.footer__up');
  if (up) up.addEventListener('click', () => (smoother ? smoother.scrollTo(0, true) : window.scrollTo({ top: 0, behavior: 'smooth' })));
}

// ---------- Navegación: se esconde al bajar, aparece al subir, cambia de color según el fondo ----------
function initNav() {
  const nav = $('.nav');
  let last = 0, ticking = false;
  const theme = () => {
    ticking = false;
    const y = nav.offsetHeight / 2;
    for (const el of document.elementsFromPoint(window.innerWidth / 2, y)) {
      if (nav.contains(el)) continue;
      const sec = el.closest('[data-nav]');
      if (sec) { nav.dataset.theme = sec.dataset.nav; return; }
    }
  };
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (s) => {
      const y = s.scroll();
      if (!nav.classList.contains('is-open') && Math.abs(y - last) > 3) nav.classList.toggle('is-hidden', y > last && y > 60);
      last = y;
      if (!ticking) { ticking = true; requestAnimationFrame(theme); }
    },
  });
  theme();
  const burger = $('.nav__burger');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
}

(async function boot() {
  await inlineSvgs();
  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]); } catch (_) {}
  initSmooth();
  initHero();
  initCats();
  initIntro();
  initCatalog();
  initCursor();
  initTexts();
  initFooter();
  initNav();
  ScrollTrigger.refresh();
  // si se llega con #interior, #exterior, etc., ir directo a esa fila
  const t = location.hash && document.querySelector(location.hash);
  if (t) requestAnimationFrame(() => goTo(t));
})();
})();
