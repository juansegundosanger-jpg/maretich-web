// Maretich · Home — animaciones (GSAP + ScrollTrigger + ScrollSmoother + SplitText)
(function () {
const { gsap, ScrollTrigger, ScrollSmoother, SplitText } = window;
gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktop = () => window.matchMedia('(min-width: 901px)').matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const EASE_OUT = 'expo.out';

// ---------- SVG de marca en línea (para colorearlos con currentColor) ----------
async function inlineSvgs() {
  const cache = {};
  await Promise.all($$('[data-svg]').map(async (el) => {
    const url = el.dataset.svg;
    cache[url] = cache[url] || fetch(url).then((r) => r.text());
    el.innerHTML = await cache[url];
  }));
}

// ---------- Scroll suave ----------
let smoother = null;
function initSmooth() {
  if (!reduce) smoother = ScrollSmoother.create({ wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: 1.1, smoothTouch: 0.1, effects: false });
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    $('.nav').classList.remove('is-open');
    smoother ? smoother.scrollTo(t, true, 'top top') : t.scrollIntoView({ behavior: 'smooth' });
  }));
}

// ---------- 01 Intro + Hero ----------
// Como Casa Momo: el isologo (en lugar de "CASA") y el logotipo (en lugar de "MOMO") aparecen juntos al centro;
// se separan, el video se abre desde el medio y cada uno viaja a su esquina agrandándose.
function playIntro() {
  const done = () => { document.body.classList.remove('is-loading'); $('.wa-float').classList.add('is-in'); };
  const iso = $('.hero__iso'), logo = $('.hero__logo');
  const copy = new SplitText('.hero__title', { type: 'lines', mask: 'lines' });
  if (reduce) { done(); return; }

  // FLIP: dónde tienen que arrancar (juntos y chicos al centro) respecto de su lugar final
  const vw = window.innerWidth, vh = window.innerHeight;
  const ri = iso.getBoundingClientRect(), rl = logo.getBoundingClientRect();
  const targetLogoW = Math.min(vw * 0.3, 420);
  const sL = targetLogoW / rl.width;
  const sI = (rl.height * sL * 1.05) / ri.height;            // el isologo a la altura del logotipo
  const gap = vw * 0.012;
  const totalW = ri.width * sI + gap + rl.width * sL;
  const startX = (vw - totalW) / 2;
  const cy = vh / 2;
  const isoFrom = { x: startX - ri.left, y: cy - (ri.top + ri.height * sI / 2), scale: sI };
  const logoFrom = { x: startX + ri.width * sI + gap - rl.left, y: cy - (rl.top + rl.height * sL / 2), scale: sL };

  gsap.set([iso, logo], { transformOrigin: '0 0' });
  gsap.set(iso, isoFrom);
  gsap.set(logo, logoFrom);
  gsap.set('.hero__media', { clipPath: 'inset(50% 50% 50% 50%)' });
  gsap.set('.nav', { autoAlpha: 0, y: -10 });

  const tl = gsap.timeline({ onComplete: done });
  // 1. aparecen al centro, subiendo dentro de su caja
  tl.fromTo([iso, logo], { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, stagger: 0.12, ease: 'power3.out' }, 0.2)
    .fromTo([iso.firstElementChild, logo.firstElementChild], { yPercent: 40 }, { yPercent: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out' }, 0.2)
    // 2. se separan: el video se abre desde el centro y cada uno viaja a su esquina
    .to('.hero__media', { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.9, ease: 'expo.inOut' }, 1.55)
    .to([iso, logo], { x: 0, y: 0, scale: 1, duration: 1.9, ease: 'expo.inOut' }, 1.55)
    .fromTo('.hero__video', { scale: 1.25 }, { scale: 1, duration: 2.6, ease: 'power2.out' }, 1.55)
    // 3. entran la frase, la navegación y WhatsApp
    .from(copy.lines, { yPercent: 110, duration: 1.1, stagger: 0.08, ease: EASE_OUT }, 3.2)
    .from('.hero__sub', { autoAlpha: 0, y: 10, duration: 1, ease: EASE_OUT }, 3.4)
    .to('.nav', { autoAlpha: 1, y: 0, duration: 1, ease: EASE_OUT }, 3.3);
}

function initHero() {
  // el hero queda fijo y "Diseñamos" sube por encima
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', pin: true, pinSpacing: false });
  gsap.to('.hero__media', { scale: 1.06, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // mezcla de videos que se funden entre sí
  const vids = $$('.hero__video');
  let i = 0, timer = null;
  const SHOW = 5200;
  const playOne = (v) => { try { v.currentTime = 0; } catch (_) {} const p = v.play(); if (p) p.catch(() => {}); };
  const warm = (v) => { if (v.preload !== 'auto') { v.preload = 'auto'; v.load(); } };
  const next = () => {
    const cur = vids[i]; i = (i + 1) % vids.length; const nxt = vids[i];
    warm(nxt); playOne(nxt); nxt.classList.add('is-active');
    setTimeout(() => cur.classList.remove('is-active'), 60);
    setTimeout(() => cur.pause(), 1800);
    warm(vids[(i + 1) % vids.length]);
  };
  playOne(vids[0]); warm(vids[1]);
  const start = () => { if (!timer && !reduce) timer = setInterval(next, SHOW); };
  const stop = () => { clearInterval(timer); timer = null; };
  start();
  ScrollTrigger.create({ trigger: '.hero', start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? (playOne(vids[i]), start()) : (stop(), vids.forEach((v) => v.pause()))) });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
}

// ---------- 02 Diseñamos y fabricamos (Bulletproof) ----------
function initDisenamos() {
  const sec = $('.dis');
  const lines = $$('.dis__line > span', sec);
  const desc = $$('.dis__dl > span', sec);
  const media = $('.dis__media', sec);
  const imgs = $$('img', media);

  gsap.set(lines, { yPercent: 120 });
  gsap.set(desc, { yPercent: 120 });
  gsap.set(media, { clipPath: 'inset(50% 50% 50% 50%)' });
  gsap.set(imgs.slice(1), { autoAlpha: 0 });

  gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 70%' } })
    .to(lines, { yPercent: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out' })
    .to(media, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' }, 0.35)
    .to(desc, { yPercent: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out' }, 0.9)
    .from('.dis__btn', { autoAlpha: 0, y: 12, duration: 0.9, ease: EASE_OUT }, 1.2);

  // las fotos pasan dentro del recuadro, una tras otra
  let i = 0, timer = null;
  const next = () => {
    const cur = imgs[i]; i = (i + 1) % imgs.length; const nxt = imgs[i];
    gsap.set(nxt, { zIndex: 2, autoAlpha: 1, clipPath: 'inset(100% 0% 0% 0%)', scale: 1.12 });
    gsap.set(cur, { zIndex: 1 });
    gsap.timeline()
      .to(nxt, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'power3.inOut' }, 0)
      .to(nxt, { scale: 1, duration: 1.4, ease: 'power2.out' }, 0)
      .set(cur, { autoAlpha: 0, zIndex: 0 });
  };
  ScrollTrigger.create({ trigger: media, start: 'top bottom', end: 'bottom top', onToggle: (s) => { clearInterval(timer); timer = null; if (s.isActive && !reduce) timer = setInterval(next, 1500); } });
}

// ---------- 03 Cada obra tiene su puerta (túnel) ----------
// Las puertas recortadas vienen desde el fondo hacia la cámara mientras se scrollea, como en "Feel at home".
function initTunel() {
  const sec = $('.tunel');
  const doors = $$('.tunel__door', sec);
  // posición en pantalla (vw, vh) por la que pasa cada puerta, alrededor del texto
  const spots = [[-30, -16], [29, 18], [-24, 24], [33, -22], [-38, 3], [38, 4], [-14, -30], [16, 30], [-32, 26], [30, -6]];
  const tilt = [-4, 3, 2, -3, 4, -2, 3, -4, -2, 3];

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + window.innerHeight * 4, pin: '.tunel__stage', scrub: 0.8, invalidateOnRefresh: true },
  });
  doors.forEach((d, k) => {
    const [x, y] = spots[k % spots.length];
    const at = k * 0.42;
    tl.fromTo(d,
      { x: () => (x * window.innerWidth) / 100, y: () => (y * window.innerHeight) / 100, z: -4200, rotate: tilt[k], autoAlpha: 0 },
      { z: 950, rotate: tilt[k] * 0.3, duration: 3.2 }, at)
      .to(d, { autoAlpha: 1, duration: 0.6 }, at);
  });
  // el texto respira un poco y el dibujo de fondo se acerca
  tl.fromTo('.tunel__art', { scale: 0.85 }, { scale: 1.35, duration: tl.duration() }, 0)
    .fromTo('.tunel__title', { scale: 0.96 }, { scale: 1.04, duration: tl.duration() }, 0);

  const t = new SplitText('.tunel__title', { type: 'lines', mask: 'lines' });
  gsap.from(t.lines, { yPercent: 110, duration: 1.3, stagger: 0.12, ease: EASE_OUT, scrollTrigger: { trigger: sec, start: 'top 60%' } });
}

// ---------- 04 Tu obra (Still/Form) ----------
// La foto arranca al ~50%, se abre a pantalla completa con una frase, y después se achica a la izquierda con la info al costado.
// La miniatura de abajo a la derecha pasa a ser la principal en cada paso.
function initObras() {
  const stage = $('.obras__stage');
  const figs = $$('.ob__img', stage);
  const inners = figs.map((f) => f.querySelector('img'));
  const texts = $$('.ob__text', stage);
  const heroPieces = $$('.ob__hp', stage);
  const col = $('.ob__col', stage);

  // recortes (clip-path) de cada estado y la caja que ocupan, en fracciones de la pantalla
  const BOX = () => (isDesktop()
    ? { panel: [0.026, 0.10, 0.71, 0.90], thumb: [0.74, 0.786, 0.826, 0.966] }
    : { panel: [0.06, 0.10, 0.94, 0.54], thumb: [0.66, 0.42, 0.94, 0.54] });
  const clip = (b, r) => `inset(${b[1] * 100}% ${(1 - b[2]) * 100}% ${(1 - b[3]) * 100}% ${b[0] * 100}% round ${r}px)`;
  const C = () => ({
    start: isDesktop() ? 'inset(24% 32% 24% 32% round 18px)' : 'inset(30% 18% 30% 18% round 14px)',
    full: 'inset(0% 0% 0% 0% round 0px)',
    panel: clip(BOX().panel, 18),
    thumb: clip(BOX().thumb, 14),
  });
  // la foto se escala y se mueve para que entre completa dentro de su caja (como si el elemento fuera de ese tamaño)
  const fit = (name) => {
    const b = BOX()[name], vw = stage.clientWidth, vh = stage.clientHeight;
    const w = (b[2] - b[0]) * vw, h = (b[3] - b[1]) * vh;
    return { scale: Math.max(w / vw, h / vh), x: ((b[0] + b[2]) / 2 - 0.5) * vw, y: ((b[1] + b[3]) / 2 - 0.5) * vh };
  };

  gsap.set(figs[0], { clipPath: () => C().start, zIndex: 3 });
  gsap.set(inners[0], { scale: 1.3 });
  gsap.set(figs.slice(1), { clipPath: () => C().thumb, autoAlpha: 0, zIndex: 4 });
  gsap.set(inners.slice(1), { x: () => fit('thumb').x, y: () => fit('thumb').y, scale: () => fit('thumb').scale });
  gsap.set(heroPieces, { yPercent: 110, autoAlpha: 0 });
  texts.forEach((t) => gsap.set($$('.ob__p', t), { yPercent: 110, autoAlpha: 0 }));

  const showText = (i, at) => {
    tl.call(() => texts.forEach((t, k) => t.classList.toggle('is-on', k === i)), null, at)
      .to($$('.ob__p', texts[i]), { yPercent: 0, autoAlpha: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out' }, at);
  };
  const hideText = (i, at) => tl.to($$('.ob__p', texts[i]), { yPercent: -110, autoAlpha: 0, duration: 0.45, stagger: 0.03, ease: 'power3.in' }, at);

  const tl = gsap.timeline({
    defaults: { ease: 'power3.inOut' },
    scrollTrigger: { trigger: '.obras', start: 'top top', end: () => '+=' + window.innerHeight * 5.5, pin: stage, scrub: 1, invalidateOnRefresh: true },
  });

  // a. de ~50% a pantalla completa + frase nueva
  tl.to(figs[0], { clipPath: () => C().full, duration: 1.2 }, 0)
    .to(inners[0], { scale: 1, duration: 1.2 }, 0)
    .to(heroPieces, { yPercent: 0, autoAlpha: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out' }, 0.9)
  // b. se achica a la izquierda y aparece la info al costado + la miniatura de la siguiente
    .to(heroPieces, { yPercent: -110, autoAlpha: 0, duration: 0.5, stagger: 0.04, ease: 'power3.in' }, 2.1)
    .to(figs[0], { clipPath: () => C().panel, duration: 1.1 }, 2.4)
    .to(inners[0], { x: () => fit('panel').x, y: () => fit('panel').y, scale: () => fit('panel').scale, duration: 1.1 }, 2.4)
    .to('.ob__count', { opacity: 1, duration: 0.4 }, 3.0)
    .to(figs[1], { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, 3.1);
  showText(0, 3.0);

  // c. pasos siguientes
  [1, 2].forEach((i, k) => {
    const at = 4.3 + k * 1.9;
    hideText(i - 1, at);
    tl.to(figs[i], { clipPath: () => C().panel, duration: 1.1 }, at)
      .to(inners[i], { x: () => fit('panel').x, y: () => fit('panel').y, scale: () => fit('panel').scale, duration: 1.1 }, at)
      .to(col, { yPercent: -(100 / 3) * i, duration: 0.6 }, at + 0.3)
      .set(figs[i - 1], { autoAlpha: 0 }, at + 1.1);
    showText(i, at + 0.7);
    if (figs[i + 1]) tl.to(figs[i + 1], { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, at + 1.0);
  });
  tl.to({}, { duration: 0.8 });
}

// ---------- 05 Líneas: un video en cada una ----------
function initLineas() {
  const sections = $$('.linea');
  ScrollTrigger.create({ trigger: sections[0], start: 'top top', end: 'bottom top', pin: true, pinSpacing: false });
  sections.forEach((sec, k) => {
    const v = $('.linea__video', sec);
    ScrollTrigger.create({
      trigger: sec, start: 'top bottom', end: 'bottom top',
      onToggle: (s) => { if (s.isActive) { if (v.preload !== 'auto') { v.preload = 'auto'; } const p = v.play(); if (p) p.catch(() => {}); } else v.pause(); },
    });
    gsap.fromTo(v, { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top top', scrub: true } });
    const t = new SplitText($('.linea__title', sec), { type: 'lines', mask: 'lines' });
    gsap.timeline({ scrollTrigger: { trigger: sec, start: k ? 'top 55%' : 'top 70%' } })
      .from($('.linea__label', sec), { autoAlpha: 0, x: -20, duration: 0.9, ease: EASE_OUT })
      .from(t.lines, { yPercent: 110, duration: 1.2, stagger: 0.1, ease: EASE_OUT }, 0.1)
      .from([$('.linea__body', sec), $('.linea__links', sec), $('.pill', sec)], { autoAlpha: 0, y: 16, duration: 1, stagger: 0.08, ease: EASE_OUT }, 0.35);
  });
}

// ---------- 06 Proyectos ----------
function initProyectos() {
  $$('.proy').forEach((p) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: p, start: 'top 88%' } });
    tl.from(p.querySelector('figure'), { clipPath: 'inset(100% 0% 0% 0% round 18px)', duration: 1.5, ease: 'power4.out' })
      .from(p.querySelector('img'), { scale: 1.3, duration: 2, ease: 'power3.out' }, 0)
      .from([p.querySelector('.proy__name'), p.querySelector('.proy__meta')], { autoAlpha: 0, y: 14, duration: 1, stagger: 0.08, ease: EASE_OUT }, 0.35);
  });
  gsap.from('.proyectos__more .pill', { autoAlpha: 0, y: 16, duration: 1, ease: EASE_OUT, scrollTrigger: { trigger: '.proyectos__more', start: 'top 92%' } });
}

// ---------- 07 Empresa: contadores suaves ----------
function initEmpresa() {
  gsap.from('.empresa__rule', { scaleX: 0, duration: 1.4, ease: 'power3.inOut', scrollTrigger: { trigger: '.empresa__rule', start: 'top 85%' } });
  const counts = $$('.count');
  counts.forEach((el, k) => {
    const to = +el.dataset.to, o = { v: 0 };
    el.textContent = '0';
    gsap.to(o, { v: to, duration: 3.2, delay: k * 0.15, ease: 'sine.inOut', onUpdate: () => (el.textContent = Math.round(o.v)), scrollTrigger: { trigger: '.stats', start: 'top 80%' } });
  });
  gsap.from('.stat', { y: 40, autoAlpha: 0, duration: 1.2, stagger: 0.12, ease: EASE_OUT, scrollTrigger: { trigger: '.stats', start: 'top 80%' } });
  const words = new SplitText('.stat__words', { type: 'lines', mask: 'lines' });
  gsap.from(words.lines, { yPercent: 110, duration: 1.2, stagger: 0.12, delay: 0.5, ease: EASE_OUT, scrollTrigger: { trigger: '.stats', start: 'top 80%' } });
}

// ---------- 08 Tira: ABERTURAS · DE MADERA, de izquierda a derecha sin fin ----------
function initTira() {
  const track = $('.tira__track');
  track.innerHTML += track.innerHTML;
  if (reduce) return;
  const loop = gsap.fromTo(track, { xPercent: -50 }, { xPercent: 0, duration: 38, ease: 'none', repeat: -1 });
  ScrollTrigger.create({
    trigger: '.tira', start: 'top bottom', end: 'bottom top',
    onUpdate: (s) => { const v = Math.min(Math.abs(s.getVelocity()) / 350, 6); gsap.to(loop, { timeScale: 1 + v, duration: 0.25, overwrite: true }); gsap.to(loop, { timeScale: 1, duration: 1.4, delay: 0.25 }); },
  });
}

// ---------- Títulos y textos ----------
function initTexts() {
  $$('[data-lines]').forEach((el) => {
    const s = new SplitText(el, { type: 'lines', mask: 'lines' });
    gsap.from(s.lines, { yPercent: 110, duration: 1.3, stagger: 0.1, ease: EASE_OUT, scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
  $$('[data-reveal]').forEach((el) => gsap.from(el, { autoAlpha: 0, y: 14, duration: 1, ease: EASE_OUT, scrollTrigger: { trigger: el, start: 'top 90%' } }));
  gsap.from('.footer__logo', { yPercent: 30, autoAlpha: 0, duration: 1.6, ease: EASE_OUT, scrollTrigger: { trigger: '.footer__logo', start: 'top 95%' } });
}

// ---------- Navegación: transparente; se esconde al bajar y aparece al subir ----------
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
  // el logo de la navegación aparece recién al salir del hero (en el hero están el isologo y el logotipo grandes)
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom 80px', onToggle: (s) => nav.classList.toggle('in-hero', s.isActive) });
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

// ---------- Arranque ----------
(async function boot() {
  await inlineSvgs();
  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]); } catch (_) {}
  initSmooth();
  initHero();
  initDisenamos();
  initTunel();
  initObras();
  initLineas();
  initProyectos();
  initEmpresa();
  initTira();
  initTexts();
  initNav();
  ScrollTrigger.refresh();
  playIntro();
})();
})();
