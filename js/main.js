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
    .set('.hero__video', { scale: 1.28 })
    .from('.intro__mark--iso', { x: 40, autoAlpha: 0, duration: 1, ease: EASE_OUT }, 0.15)
    .from('.intro__mark--logo', { x: -40, autoAlpha: 0, duration: 1, ease: EASE_OUT }, 0.15)
    // el marco se abre al medio: isologo hacia un lado, logotipo hacia el otro
    .to('.intro__half--l', { xPercent: -100, duration: 1.6 }, 1.2)
    .to('.intro__half--r', { xPercent: 100, duration: 1.6 }, 1.2)
    .to('.hero__video', { scale: 1, duration: 2.4, ease: 'power2.out' }, 1.2)
    .from(title.lines, { yPercent: 110, duration: 1.3, stagger: 0.1, ease: EASE_OUT }, 2.0)
    .from('.hero__sub', { autoAlpha: 0, y: 14, duration: 1, ease: EASE_OUT }, 2.35)
    .to('.nav', { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE_OUT }, 2.2);
}

// ---------- 01 Hero: queda fijo y el carrusel se le superpone ----------
function initHero() {
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', pin: true, pinSpacing: false });
  gsap.to('.hero__copy', { y: -80, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '70% top', scrub: true } });
  gsap.to('.hero__video', { scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
}

// ---------- 02 → 03: la imagen chica crece, pasan las obras y la puerta pasa a 3D ----------
function initShowcase() {
  const stage = $('.showcase__stage');
  const frame = $('.showcase__frame');
  const imgs = $$('.showcase__img', frame);
  const arrows = $$('.showcase__arrow');
  const doorWrap = $('.door3d');
  const door = createDoor($('.door3d__canvas'));

  const vw = () => stage.clientWidth, vh = () => stage.clientHeight;
  const inset = (t, r, b, l) => `inset(${t}px ${r}px ${b}px ${l}px round ${t ? 18 : 0}px)`;
  const small = () => {
    const w = isDesktop() ? vw() * 0.3 : vw() * 0.7, h = isDesktop() ? vh() * 0.46 : vh() * 0.4;
    return inset((vh() - h) / 2, (vw() - w) / 2, (vh() - h) / 2, (vw() - w) / 2);
  };
  const full = 'inset(0px 0px 0px 0px round 0px)';
  const doorClip = () => { const r = door.getScreenRect(); return inset(r.top, vw() - r.right, vh() - r.bottom, r.left); };

  const title = new SplitText('.showcase__title', { type: 'lines,words', mask: 'lines' });
  const reveal = { p: 0 };
  gsap.set(imgs.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.set(imgs[0], { scale: 1.3 });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '.showcase', start: 'top top', end: () => '+=' + vh() * 7.5, pin: stage, scrub: 1, invalidateOnRefresh: true,
      onUpdate: (s) => { const live = s.progress > 0.74; doorWrap.classList.toggle('is-live', live); door.setLive(live); },
      onToggle: (s) => door.setVisible(s.isActive),
    },
  });

  // a. crece
  tl.fromTo(frame, { clipPath: small }, { clipPath: full, duration: 1.3, ease: 'power2.inOut' }, 0)
    .to(imgs[0], { scale: 1, duration: 1.3, ease: 'power2.inOut' }, 0)
    .to(arrows, { autoAlpha: 1, duration: 0.3 }, 1.1)
    .addLabel('img0', 1.3);

  // b. pasan las obras (cada una sube como una persiana)
  let t = 1.7;
  imgs.slice(1).forEach((img, i) => {
    tl.fromTo(img, { scale: 1.2 }, { scale: 1, duration: 1.1, ease: 'power2.out' }, t)
      .to(img, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'power3.inOut' }, t)
      .to(imgs[i], { yPercent: -12, duration: 0.9, ease: 'power3.inOut' }, t)
      .addLabel('img' + (i + 1), t + 0.9);
    t += 1.2;
  });

  // flechas: llevan el scroll a la obra anterior / siguiente
  const current = () => {
    const st = tl.scrollTrigger; const y = st.scroll();
    return imgs.reduce((best, _, i) => (Math.abs(st.labelToScroll('img' + i) - y) < Math.abs(st.labelToScroll('img' + best) - y) ? i : best), 0);
  };
  arrows[0].addEventListener('click', () => scrollToY(tl.scrollTrigger.labelToScroll('img' + Math.max(0, current() - 1))));
  arrows[1].addEventListener('click', () => scrollToY(tl.scrollTrigger.labelToScroll('img' + Math.min(imgs.length - 1, current() + 1))));

  // c. se extrae la puerta: el cuadro se recorta a la hoja y la foto se vuelve objeto 3D
  tl.to(arrows, { autoAlpha: 0, duration: 0.25 }, t)
    .to(frame, { clipPath: doorClip, duration: 1.2, ease: 'power3.inOut' }, t)
    .to(doorWrap, { autoAlpha: 1, duration: 0.4 }, t + 1.0)
    .to(frame, { autoAlpha: 0, duration: 0.45 }, t + 1.1)
    .to(reveal, { p: 1, duration: 1.4, ease: 'power2.inOut', onUpdate: () => door.setReveal(reveal.p) }, t + 1.1);

  // d. texto: las palabras suben dentro de cada renglón, la regla se dibuja hasta el borde
  t += 1.5;
  tl.from(title.words, { yPercent: 115, rotate: 4, transformOrigin: '0% 100%', duration: 0.8, ease: 'power3.out', stagger: { each: 0.035, ease: 'power1.in' } }, t)
    .to('.showcase__rule', { scaleX: 1, duration: 0.9, ease: 'power3.inOut' }, t + 0.7)
    .fromTo('.showcase__body', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, t + 1.0)
    .to({}, { duration: 2.2 }); // pausa: la puerta queda para girarla y la sección bordó sube por encima
}

// ---------- 04 Tu obra ----------
function initObra() {
  const stage = $('.obra__stage');
  const imgs = $$('.obra__img', stage);
  const items = $$('.obra__item', stage);
  const card = $('.obra__card');

  // medidas del Figma (1440 × 900) pasadas a proporciones del viewport
  const L = () => {
    const vw = stage.clientWidth, vh = stage.clientHeight;
    if (isDesktop()) {
      const main = { l: vw * 0.3965, t: vh * 0.128, w: vw * 0.347, h: vh * 0.739 };
      return {
        vw, vh, main,
        card: { l: vw * 0.1125, t: vh * 0.128, w: vw * 0.284, h: vh * 0.343 },
        center: { x: (vw - main.w) / 2 - main.l, y: 0 },
        small: { x: vw * 0.774 - main.l, y: vh * 0.629 - main.t, s: (vw * 0.111) / main.w },
        exit: { x: vw * 0.16 - main.l, y: vh * 0.05 },
      };
    }
    const main = { l: vw * 0.06, t: vh * 0.1, w: vw * 0.88, h: vh * 0.5 };
    return {
      vw, vh, main,
      card: { l: vw * 0.06, t: vh * 0.63, w: vw * 0.88, h: vh * 0.27 },
      center: { x: 0, y: vh * 0.12 },
      small: { x: main.w * 0.68, y: main.h * 0.7, s: 0.3 },
      exit: { x: -vw * 0.3, y: 0 },
    };
  };
  const place = () => {
    const r = L();
    imgs.forEach((im) => Object.assign(im.style, { left: r.main.l + 'px', top: r.main.t + 'px', width: r.main.w + 'px', height: r.main.h + 'px' }));
    Object.assign(card.style, { left: r.card.l + 'px', top: r.card.t + 'px', width: r.card.w + 'px', height: r.card.h + 'px' });
  };
  place();
  ScrollTrigger.addEventListener('refreshInit', place);

  // "Cada obra tiene su puerta." entra mientras el panel bordó sube sobre la puerta 3D
  const ttl = new SplitText('.obra__title', { type: 'lines', mask: 'lines' });
  gsap.from(ttl.lines, { yPercent: 110, duration: 1.4, stagger: 0.12, ease: EASE_OUT, scrollTrigger: { trigger: '.obra', start: 'top 40%' } });

  gsap.set(imgs[0], { x: () => L().center.x, y: () => L().center.y, scale: 1, zIndex: 3 });
  gsap.set(imgs.slice(1), { x: () => L().small.x, y: () => L().small.y, scale: () => L().small.s, autoAlpha: 0, zIndex: 3 });
  gsap.set(card, { x: () => -(L().card.l + L().card.w + 40), zIndex: 2 });
  gsap.set(items, { autoAlpha: 0, y: 26 });

  const tl = gsap.timeline({
    defaults: { ease: 'power3.inOut' },
    scrollTrigger: { trigger: stage, start: 'top top', end: () => '+=' + stage.clientHeight * 3.6, pin: true, scrub: 1, invalidateOnRefresh: true },
  });

  // paso 1: viviendas se corre a la derecha, entra la solapa por la izquierda y asoma la siguiente abajo
  tl.to(imgs[0], { x: 0, y: 0, duration: 1 }, 0.2)
    .to(card, { x: 0, duration: 1 }, 0.2)
    .to(items[0], { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.75)
    .fromTo(imgs[1], { autoAlpha: 0, yPercent: 12 }, { autoAlpha: 1, yPercent: 0, duration: 0.6, ease: 'power2.out' }, 0.8);

  // pasos 2 y 3: la chica toma el lugar de la grande, la grande se va por detrás de la solapa
  [1, 2].forEach((i, k) => {
    const at = 1.9 + k * 1.5;
    tl.set(imgs[i - 1], { zIndex: 1 }, at)
      .to(items[i - 1], { autoAlpha: 0, y: -20, duration: 0.35, ease: 'power2.in' }, at)
      .to(imgs[i - 1], { x: () => L().exit.x, y: () => L().exit.y, scale: 0.86, autoAlpha: 0, duration: 1 }, at)
      .to(imgs[i], { x: 0, y: 0, scale: 1, duration: 1 }, at)
      .to(items[i], { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, at + 0.5);
    if (imgs[i + 1]) tl.fromTo(imgs[i + 1], { autoAlpha: 0, yPercent: 12 }, { autoAlpha: 1, yPercent: 0, duration: 0.6, ease: 'power2.out' }, at + 0.55);
  });
  tl.to({}, { duration: 0.5 });
}

// ---------- 05 Líneas: las fotos se suceden abriéndose al medio, como dos hojas ----------
function initLineas() {
  const sections = $$('.linea');
  // la Pre-diseñada sube por encima de la A medida
  ScrollTrigger.create({ trigger: sections[0], start: 'top top', end: 'bottom top', pin: true, pinSpacing: false });

  sections.forEach((sec, k) => {
    const slides = $$('[data-slideshow] img', sec);
    const dots = $$('.linea__dots i', sec);
    const DUR = 4.6;
    let i = 0, timer = null, kb = null, fill = null;

    gsap.set(slides, { zIndex: 0 });
    gsap.set(slides.slice(1), { clipPath: 'inset(0% 50% 0% 50%)' });
    gsap.set(slides[0], { zIndex: 1 });

    const progress = () => {
      fill?.kill();
      dots.forEach((d, j) => d.style.setProperty('--p', j < i ? 1 : 0));
      fill = gsap.fromTo(dots[i], { '--p': 0 }, { '--p': 1, duration: DUR, ease: 'none' });
      kb?.kill();
      kb = gsap.fromTo(slides[i], { scale: 1 }, { scale: 1.06, duration: DUR + 1.6, ease: 'none' });
    };
    const go = (n) => {
      const cur = slides[i], nxt = slides[n];
      gsap.set(nxt, { zIndex: 2, clipPath: 'inset(0% 50% 0% 50%)', scale: 1.16 });
      gsap.timeline()
        .to(nxt, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.35, ease: 'power4.inOut' }, 0)
        .to(nxt, { scale: 1, duration: 1.9, ease: 'power3.out' }, 0)
        .to(cur, { scale: '+=0.04', filter: 'brightness(.7)', duration: 1.35, ease: 'power4.inOut' }, 0)
        .set(cur, { zIndex: 0, filter: 'none', clipPath: 'inset(0% 50% 0% 50%)' })
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
    gsap.to(o, { v: to, duration: 2.6, ease: 'power3.out', onUpdate: () => (el.textContent = Math.round(o.v)), scrollTrigger: { trigger: '.stats', start: 'top 80%' } });
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

// ---------- Navegación ----------
function initNav() {
  const nav = $('.nav');
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom 90px', onToggle: (s) => nav.classList.toggle('is-solid', !s.isActive) });
  let last = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (s) => { const y = s.scroll(); if (!nav.classList.contains('is-open')) nav.classList.toggle('is-hidden', y > last && y > window.innerHeight * 0.8); last = y; },
  });
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
