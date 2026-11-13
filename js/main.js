// Maretich · Home — animaciones (GSAP + ScrollTrigger + ScrollSmoother + SplitText, three.js para la puerta)
import { createDoor } from './door.js';

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
    cache[url] ??= fetch(url).then((r) => r.text());
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
const scrollToY = (y) => (smoother ? smoother.scrollTo(y, true) : window.scrollTo({ top: y, behavior: 'smooth' }));

// ---------- Intro: isologo | logotipo se separan y abren la imagen ----------
function playIntro() {
  const done = () => { document.body.classList.remove('is-loading'); $('.wa-float').classList.add('is-in'); };
  const title = new SplitText('.hero__title', { type: 'lines', mask: 'lines' });
  if (reduce) { done(); return; }

  gsap.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: done })
    .set('.nav', { autoAlpha: 0, y: -12 })
    .set('.hero__videos', { scale: 1.28 })
    .from('.intro__mark--iso', { x: 40, autoAlpha: 0, duration: 1, ease: EASE_OUT }, 0.15)
    .from('.intro__mark--logo', { x: -40, autoAlpha: 0, duration: 1, ease: EASE_OUT }, 0.15)
    // el marco se abre al medio: isologo hacia un lado, logotipo hacia el otro
    .to('.intro__half--l', { xPercent: -100, duration: 1.6 }, 1.2)
    .to('.intro__half--r', { xPercent: 100, duration: 1.6 }, 1.2)
    .to('.hero__videos', { scale: 1, duration: 2.4, ease: 'power2.out' }, 1.2)
    .from(title.lines, { yPercent: 110, duration: 1.3, stagger: 0.1, ease: EASE_OUT }, 2.0)
    .from('.hero__sub', { autoAlpha: 0, y: 14, duration: 1, ease: EASE_OUT }, 2.35)
    .to('.nav', { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE_OUT }, 2.2);
}

// ---------- 01 Hero: mezcla de videos que se funden entre sí; queda fijo y el carrusel se le superpone ----------
function initHero() {
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', pin: true, pinSpacing: false });
  gsap.to('.hero__copy', { y: -80, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '70% top', scrub: true } });
  gsap.to('.hero__videos', { scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  const vids = $$('.hero__video');
  let i = 0, timer = null;
  const SHOW = 5200; // cada toma dura ~5 s y se funde con la siguiente
  const playOne = (v) => { v.currentTime = 0; const p = v.play(); if (p) p.catch(() => {}); };
  const next = () => {
    const cur = vids[i]; i = (i + 1) % vids.length; const nxt = vids[i];
    if (nxt.preload !== 'auto') { nxt.preload = 'auto'; nxt.load(); }
    playOne(nxt);
    nxt.classList.add('is-active');
    setTimeout(() => { cur.classList.remove('is-active'); }, 60);
    setTimeout(() => cur.pause(), 1800);
    const after = vids[(i + 1) % vids.length]; if (after.preload !== 'auto') { after.preload = 'auto'; after.load(); }
  };
  playOne(vids[0]);
  vids[1].preload = 'auto'; vids[1].load();
  const start = () => { if (!timer && !reduce) timer = setInterval(next, SHOW); };
  const stop = () => { clearInterval(timer); timer = null; };
  start();
  ScrollTrigger.create({ trigger: '.hero', start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? (playOne(vids[i]), start()) : (stop(), vids.forEach((v) => v.pause()))) });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
}

// ---------- 02 → 03: la imagen chica crece, las obras pasan como carrusel y la última puerta pasa a 3D ----------
// coordenadas de la hoja dentro de la foto final (carrusel-5.jpg, 1440 × 900)
const DOOR_IN_PHOTO = { iw: 1440, ih: 900, l: 534, t: 52, w: 376, h: 770 };

function initShowcase() {
  const section = $('.showcase');
  const stage = $('.showcase__stage');
  const frame = $('.showcase__frame');
  const imgs = $$('.showcase__img', frame);
  const arrows = $$('.showcase__arrow');
  const doorWrap = $('.door3d');
  const door = createDoor($('.door3d__canvas'));
  const last = imgs.length - 1;

  const vw = () => stage.clientWidth, vh = () => stage.clientHeight;
  const inset = (t, r, b, l, rad = 0) => `inset(${t}px ${r}px ${b}px ${l}px round ${rad}px)`;
  const small = () => {
    const w = isDesktop() ? vw() * 0.3 : vw() * 0.7, h = isDesktop() ? vh() * 0.46 : vh() * 0.4;
    return inset((vh() - h) / 2, (vw() - w) / 2, (vh() - h) / 2, (vw() - w) / 2, 18);
  };
  const full = 'inset(0px 0px 0px 0px round 0px)';
  // dónde queda la hoja de la puerta en pantalla con object-fit: cover
  const doorInPhoto = () => {
    const k = Math.max(vw() / DOOR_IN_PHOTO.iw, vh() / DOOR_IN_PHOTO.ih);
    const ox = (vw() - DOOR_IN_PHOTO.iw * k) / 2, oy = (vh() - DOOR_IN_PHOTO.ih * k) / 2;
    return { l: ox + DOOR_IN_PHOTO.l * k, t: oy + DOOR_IN_PHOTO.t * k, w: DOOR_IN_PHOTO.w * k, h: DOOR_IN_PHOTO.h * k };
  };
  const doorClip = () => { const d = doorInPhoto(); return inset(d.t, vw() - d.l - d.w, vh() - d.t - d.h, d.l); };
  // transform que lleva la hoja de la foto exactamente al lugar de la puerta 3D
  const toTarget = () => {
    const d = doorInPhoto(), r = door.getScreenRect();
    const sc = (r.bottom - r.top) / d.h;
    return { scale: sc, x: r.left - d.l * sc, y: r.top - d.t * sc };
  };

  const title = new SplitText('.showcase__title', { type: 'lines,words', mask: 'lines' });
  const reveal = { p: 0 };
  gsap.set(frame, { transformOrigin: '0 0' });
  gsap.set(imgs.slice(1), { xPercent: 100 });
  gsap.set(imgs[0], { scale: 1.3 });

  let tDoor = 0;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section, start: 'top top', end: () => '+=' + vh() * 7.5, pin: stage, scrub: 1, invalidateOnRefresh: true,
      onUpdate: (s) => {
        const live = s.progress > 0.76; doorWrap.classList.toggle('is-live', live); door.setLive(live);
        const tt = tl.time(); section.dataset.nav = tt > 1.0 && tt < tDoor + 0.4 ? 'light' : 'dark';
      },
      onToggle: (s) => door.setVisible(s.isActive),
    },
  });

  // a. crece
  tl.fromTo(frame, { clipPath: small }, { clipPath: full, duration: 1.3, ease: 'power2.inOut' }, 0)
    .to(imgs[0], { scale: 1, duration: 1.3, ease: 'power2.inOut' }, 0)
    .to(arrows, { autoAlpha: 1, duration: 0.3 }, 1.1)
    .addLabel('img0', 1.3);

  // b. carrusel horizontal: la siguiente entra desde la derecha, la actual se corre con parallax
  let t = 1.7;
  imgs.slice(1).forEach((img, i) => {
    tl.to(img, { xPercent: 0, duration: 1, ease: 'power3.inOut' }, t)
      .fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1.2, ease: 'power2.out' }, t)
      .to(imgs[i], { xPercent: -35, filter: 'brightness(0.55)', duration: 1, ease: 'power3.inOut' }, t)
      .addLabel('img' + (i + 1), t + 1);
    t += 1.25;
  });

  const current = () => {
    const st = tl.scrollTrigger, y = st.scroll();
    return imgs.reduce((best, _, i) => (Math.abs(st.labelToScroll('img' + i) - y) < Math.abs(st.labelToScroll('img' + best) - y) ? i : best), 0);
  };
  arrows[0].addEventListener('click', () => scrollToY(tl.scrollTrigger.labelToScroll('img' + Math.max(0, current() - 1))));
  arrows[1].addEventListener('click', () => scrollToY(tl.scrollTrigger.labelToScroll('img' + Math.min(last, current() + 1))));

  // c. el marco se achica hasta enmarcar sólo la hoja; después la hoja viaja a su lugar y se vuelve 3D
  tDoor = t;
  tl.to(arrows, { autoAlpha: 0, duration: 0.25 }, t)
    .to('.showcase', { backgroundColor: '#e6e5e0', duration: 0.01 }, t)
    .to(frame, { clipPath: doorClip, duration: 1.2, ease: 'power3.inOut' }, t)
    .to(frame, { x: () => toTarget().x, y: () => toTarget().y, scale: () => toTarget().scale, duration: 1.1, ease: 'power3.inOut' }, t + 1.3)
    .set(doorWrap, { autoAlpha: 1 }, t + 2.4)
    .to(frame, { autoAlpha: 0, duration: 0.3 }, t + 2.42)
    .to(reveal, { p: 1, duration: 1.4, ease: 'power2.inOut', onUpdate: () => door.setReveal(reveal.p) }, t + 2.45);

  // d. texto
  t += 2.9;
  tl.from(title.words, { yPercent: 115, rotate: 4, transformOrigin: '0% 100%', duration: 0.8, ease: 'power3.out', stagger: { each: 0.035, ease: 'power1.in' } }, t)
    .to('.showcase__rule', { scaleX: 1, duration: 0.9, ease: 'power3.inOut' }, t + 0.7)
    .fromTo('.showcase__body', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, t + 1.0)
    .to({}, { duration: 2.6 });
}

// ---------- 04 Tu obra ----------
function initObra() {
  const stage = $('.obra__stage');
  const imgs = $$('.obra__img', stage);
  const items = $$('.obra__item', stage);
  const card = $('.obra__card');
  const RATIO = 500 / 665;   // proporción de las fotos del Figma
  const TUCK = 26;           // cuánto queda la solapa metida detrás de la foto

  const L = () => {
    const vw = stage.clientWidth, vh = stage.clientHeight;
    if (isDesktop()) {
      const w = Math.min(vw * 0.347, vh * 0.74 * RATIO), h = w / RATIO;
      const main = { l: vw * 0.3965, t: (vh - h) / 2 + vh * 0.02, w, h };
      const cw = Math.min(vw * 0.284, 420) + TUCK;
      const sw = w * 0.32;
      return {
        vw, vh, main, desktop: true,
        card: { l: main.l - cw + TUCK, t: main.t, w: cw },
        center: { x: (vw - w) / 2 - main.l, y: 0 },
        small: { x: w + vw * 0.03, y: h - sw / RATIO, s: 0.32 },
        exit: { x: -main.l - w * 0.2, y: 0 },
      };
    }
    const w = vw * 0.78, h = Math.min(w / RATIO, vh * 0.5);
    const main = { l: (vw - w) / 2, t: vh * 0.1, w, h };
    return {
      vw, vh, main, desktop: false,
      card: { l: vw * 0.06, t: main.t + h - TUCK, w: vw * 0.88 },
      center: { x: 0, y: 0 },
      small: { x: w * 0.72, y: h * 0.72, s: 0.26 },
      exit: { x: -vw, y: 0 },
    };
  };
  const place = () => {
    const r = L();
    imgs.forEach((im) => Object.assign(im.style, { left: r.main.l + 'px', top: r.main.t + 'px', width: r.main.w + 'px', height: r.main.h + 'px' }));
    Object.assign(card.style, { left: r.card.l + 'px', top: r.card.t + 'px', width: r.card.w + 'px' });
    card.style.setProperty('--tuck', r.desktop ? TUCK + 'px' : '0px');
    card.style.paddingTop = r.desktop ? '0px' : TUCK + 'px';
  };
  place();
  ScrollTrigger.addEventListener('refreshInit', place);
  // escondida = detrás de la foto principal
  const hidden = () => (L().desktop ? { x: L().card.w - TUCK, y: 0 } : { x: 0, y: -80 });

  const ttl = new SplitText('.obra__title', { type: 'lines', mask: 'lines' });
  gsap.from(ttl.lines, { yPercent: 110, duration: 1.4, stagger: 0.12, ease: EASE_OUT, scrollTrigger: { trigger: '.obra', start: 'top 40%' } });

  gsap.set(imgs[0], { x: () => L().center.x, y: () => L().center.y, scale: 1, zIndex: 4 });
  gsap.set(imgs.slice(1), { x: () => L().small.x, y: () => L().small.y, scale: () => L().small.s, autoAlpha: 0, zIndex: 3 });
  gsap.set(card, { x: () => hidden().x, y: () => hidden().y, zIndex: 2, autoAlpha: 0 });
  gsap.set(items, { autoAlpha: 0 });
  gsap.set(items[0], { autoAlpha: 1 });

  const tl = gsap.timeline({
    defaults: { ease: 'power3.inOut' },
    scrollTrigger: { trigger: stage, start: 'top top', end: () => '+=' + stage.clientHeight * 3.8, pin: true, scrub: 1, invalidateOnRefresh: true },
  });

  // paso 1: la foto se corre a la derecha y la solapa sale de atrás de la foto
  tl.to(imgs[0], { x: 0, y: 0, duration: 1 }, 0.2)
    .set(card, { autoAlpha: 1 }, 1.15)
    .to(card, { x: 0, y: 0, duration: 1, ease: 'power3.out' }, 1.2)
    .fromTo(imgs[1], { autoAlpha: 0, yPercent: 10 }, { autoAlpha: 1, yPercent: 0, duration: 0.6, ease: 'power2.out' }, 0.9);

  // pasos 2 y 3: la solapa se guarda, la chica pasa a ser la principal y la solapa vuelve a salir con el texto nuevo
  [1, 2].forEach((i, k) => {
    const at = 2.4 + k * 2.1;
    tl.to(card, { x: () => hidden().x, y: () => hidden().y, duration: 0.55, ease: 'power3.in' }, at)
      .set(card, { autoAlpha: 0 }, at + 0.55)
      .set(items[i - 1], { autoAlpha: 0 }, at + 0.55)
      .set(items[i], { autoAlpha: 1 }, at + 0.55)
      .set(imgs[i - 1], { zIndex: 1 }, at + 0.5)
      .to(imgs[i - 1], { x: () => L().exit.x, y: () => L().exit.y, scale: 0.86, autoAlpha: 0, duration: 1 }, at + 0.5)
      .set(imgs[i], { zIndex: 4 }, at + 0.5)
      .to(imgs[i], { x: 0, y: 0, scale: 1, duration: 1 }, at + 0.5)
      .set(card, { autoAlpha: 1 }, at + 1.55)
      .to(card, { x: 0, y: 0, duration: 0.8, ease: 'power3.out' }, at + 1.6);
    if (imgs[i + 1]) tl.fromTo(imgs[i + 1], { autoAlpha: 0, yPercent: 10 }, { autoAlpha: 1, yPercent: 0, duration: 0.6, ease: 'power2.out' }, at + 1.3);
  });
  tl.to({}, { duration: 0.6 });
}

// ---------- 05 Líneas: las fotos se suceden con un fundido suave ----------
function initLineas() {
  const sections = $$('.linea');
  // la Pre-diseñada sube por encima de la A medida
  ScrollTrigger.create({ trigger: sections[0], start: 'top top', end: 'bottom top', pin: true, pinSpacing: false });

  sections.forEach((sec, k) => {
    const slides = $$('[data-slideshow] img', sec);
    const dots = $$('.linea__dots i', sec);
    const DUR = 5.2;
    let i = 0, timer = null, kb = null, fill = null;

    gsap.set(slides, { zIndex: 0 });
    gsap.set(slides.slice(1), { autoAlpha: 0 });
    gsap.set(slides[0], { zIndex: 1 });

    const progress = () => {
      fill?.kill();
      dots.forEach((d, j) => d.style.setProperty('--p', j < i ? 1 : 0));
      fill = gsap.fromTo(dots[i], { '--p': 0 }, { '--p': 1, duration: DUR, ease: 'none' });
      kb?.kill();
      kb = gsap.to(slides[i], { scale: 1.05, duration: DUR + 2, ease: 'none' });
    };
    // fundido largo y suave: la nueva aparece encima mientras se asienta su escala
    const go = (n) => {
      const cur = slides[i], nxt = slides[n];
      gsap.set(nxt, { zIndex: 2, autoAlpha: 0, scale: 1.08 });
      gsap.timeline()
        .to(nxt, { autoAlpha: 1, duration: 1.9, ease: 'sine.inOut' }, 0)
        .to(nxt, { scale: 1, duration: 3.2, ease: 'power2.out' }, 0)
        .set(cur, { zIndex: 0, autoAlpha: 0 })
        .set(nxt, { zIndex: 1 });
      i = n;
      if (i === 0) dots.forEach((d) => d.style.setProperty('--p', 0));
      progress();
    };
    const start = () => { if (timer || reduce) return; progress(); timer = setInterval(() => go((i + 1) % slides.length), DUR * 1000); };
    const stop = () => { clearInterval(timer); timer = null; fill?.pause(); kb?.pause(); };
    ScrollTrigger.create({ trigger: sec, start: 'top 60%', end: 'bottom 20%', onToggle: (s) => (s.isActive ? start() : stop()) });

    // texto: renglones que suben
    const t = new SplitText($('.linea__title', sec), { type: 'lines', mask: 'lines' });
    gsap.timeline({ scrollTrigger: { trigger: sec, start: k ? 'top 55%' : 'top 70%' } })
      .from($('.linea__label', sec), { autoAlpha: 0, x: -20, duration: 0.9, ease: EASE_OUT })
      .from(t.lines, { yPercent: 110, duration: 1.2, stagger: 0.1, ease: EASE_OUT }, 0.1)
      .from([$('.linea__body', sec), $('.linea__links', sec), $('.pill', sec)], { autoAlpha: 0, y: 16, duration: 1, stagger: 0.08, ease: EASE_OUT }, 0.35);
  });
}

// ---------- 06 Proyectos (al pasar por uno, el resto desaparece: CSS) ----------
function initProyectos() {
  $$('.proy').forEach((p) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: p, start: 'top 88%' } });
    tl.from(p.querySelector('figure'), { clipPath: 'inset(100% 0% 0% 0% round 22px)', duration: 1.5, ease: 'power4.out' })
      .from(p.querySelector('img'), { scale: 1.3, duration: 2, ease: 'power3.out' }, 0)
      .from([p.querySelector('.proy__name'), p.querySelector('.proy__meta')], { autoAlpha: 0, y: 14, duration: 1, stagger: 0.08, ease: EASE_OUT }, 0.35);
  });
  gsap.from('.proyectos__more .pill', { autoAlpha: 0, y: 16, duration: 1, ease: EASE_OUT, scrollTrigger: { trigger: '.proyectos__more', start: 'top 92%' } });
}

// ---------- 07 Empresa: contadores ----------
function initEmpresa() {
  gsap.from('.empresa__rule', { scaleX: 0, duration: 1.4, ease: 'power3.inOut', scrollTrigger: { trigger: '.empresa__rule', start: 'top 85%' } });
  const counts = $$('.count');
  counts.forEach((el) => {
    const to = +el.dataset.to, o = { v: 0 };
    el.textContent = '0';
    gsap.to(o, { v: to, duration: 3.2, delay: counts.indexOf(el) * 0.15, ease: 'sine.inOut', onUpdate: () => (el.textContent = Math.round(o.v)), scrollTrigger: { trigger: '.stats', start: 'top 80%' } });
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
  initShowcase();
  initObra();
  initLineas();
  initProyectos();
  initEmpresa();
  initTira();
  initTexts();
  initNav();
  ScrollTrigger.refresh();
  playIntro();
})();
