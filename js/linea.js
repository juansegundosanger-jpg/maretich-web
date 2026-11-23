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
const goTo = (t) => (smoother ? smoother.scrollTo(t, true, $('.mat-bar') ? 'top 70px' : 'top 90px') : t.scrollIntoView({ behavior: 'smooth' }));
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
  const xTo = gsap.quickTo(c, 'x', { duration: 0.45, ease: 'power3' });
  const yTo = gsap.quickTo(c, 'y', { duration: 0.45, ease: 'power3' });
  window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); });
  $$('.cat__strip, [data-drag]').forEach((s) => {
    s.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse') return; gsap.set(c, { x: e.clientX, y: e.clientY }); xTo(e.clientX); yTo(e.clientY); gsap.to(c, { scale: 1, duration: 0.5, ease: EASE_OUT }); });
    s.addEventListener('pointerleave', () => gsap.to(c, { scale: 0, duration: 0.4, ease: EASE_OUT }));
    s.addEventListener('pointerdown', () => gsap.to(c, { scale: 0.82, duration: 0.3, ease: EASE_OUT }));
    s.addEventListener('pointerup', () => gsap.to(c, { scale: 1, duration: 0.4, ease: EASE_OUT }));
  });
}

// ---------- Catálogo de una categoría: barra de materialidades, entradas y grilla ----------
function initCatalog() {
  const bar = $('.mat-bar');
  const mats = $$('.mat');
  if (!mats.length) return;
  $$('[data-drag]').forEach(initDrag);
  if (bar) {
    const setNavH = () => document.documentElement.style.setProperty('--navh', $('.nav').offsetHeight + 'px');
    setNavH(); window.addEventListener('resize', setNavH);
    ScrollTrigger.create({ trigger: mats[0], start: 'top 30%', endTrigger: '.lm-cta', end: 'top 60%', toggleClass: { targets: bar, className: 'is-in' } });
    const links = $$('ol a', bar);
    mats.forEach((m, i) => ScrollTrigger.create({ trigger: m, start: 'top 45%', end: 'bottom 45%', onToggle: (st) => { if (st.isActive) links.forEach((l, j) => l.classList.toggle('is-on', j === i)); } }));
    links.forEach((a) => a.addEventListener('click', (e) => { const t = $(a.getAttribute('href')); if (t) { e.preventDefault(); goTo(t); } }));
  }
  if (reduce) return;
  mats.forEach((m) => {
    const t = new SplitText($('.mat__title', m), { type: 'lines', mask: 'lines' });
    gsap.timeline({ scrollTrigger: { trigger: m, start: 'top 82%' } })
      .from(t.lines, { yPercent: 110, duration: 1.3, ease: EASE_OUT })
      .from([$('.mat__n', m), $('.mat__desc', m), $('.mat__count', m)], { autoAlpha: 0, y: 14, duration: 1, stagger: 0.06, ease: EASE_OUT }, 0.1);
    const feats = $$('.feat', m);
    gsap.fromTo($$('.feat__media', m), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, stagger: 0.08, ease: 'casa', clearProps: 'clipPath', scrollTrigger: { trigger: $('.feat-strip', m), start: 'top 85%' } });
    gsap.from(feats.map((f) => [$('.feat__name', f), $('.feat__txt', f), $('.feat__cta', f)]).flat(), { autoAlpha: 0, y: 14, duration: 1, stagger: 0.03, ease: EASE_OUT, scrollTrigger: { trigger: $('.feat-strip', m), start: 'top 75%' } });
    gsap.fromTo($('.feat-track', m), { x: () => window.innerWidth * 0.1 }, { x: 0, ease: 'none', scrollTrigger: { trigger: $('.feat-strip', m), start: 'top bottom', end: 'center center', scrub: 0.8, invalidateOnRefresh: true } });
  });
  // la grilla entra de a filas a medida que aparece
  gsap.set('.door', { autoAlpha: 0, y: 40 });
  ScrollTrigger.batch('.door', { start: 'top 92%', once: true, onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.05, ease: EASE_OUT }) });
  gsap.set('.sw', { autoAlpha: 0, y: 20 });
  ScrollTrigger.batch('.sw', { start: 'top 94%', once: true, onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.035, ease: EASE_OUT }) });
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
