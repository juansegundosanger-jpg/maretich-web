// Maretich · Home — animaciones
import { createDoor } from './door.js';

const { gsap, ScrollTrigger, ScrollSmoother, SplitText } = window;
gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktop = () => window.matchMedia('(min-width: 901px)').matches;
const EASE_OUT = 'expo.out';
const EASE_IO = 'power3.inOut';
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

// ---------- 0. SVG de marca en línea (para poder colorearlos con currentColor) ----------
async function inlineSvgs() {
  const cache = {};
  await Promise.all($$('[data-svg]').map(async (el) => {
    const url = el.dataset.svg;
    cache[url] ??= fetch(url).then((r) => r.text());
    el.innerHTML = await cache[url];
  }));
}

// ---------- 1. Scroll suave ----------
let smoother = null;
function initSmooth() {
  if (reduce) return;
  smoother = ScrollSmoother.create({ wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: 1.1, smoothTouch: 0.1, effects: false });
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    smoother.scrollTo(t, true, 'top 0px');
  }));
}

// ---------- 2. Intro: isologo | logotipo se abren y muestran el hero ----------
function playIntro() {
  const done = () => { document.body.classList.remove('is-loading'); $('.wa-float').classList.add('is-in'); };
  const heroTitle = new SplitText('.hero__title', { type: 'lines', mask: 'lines', linesClass: 'line' });
  if (reduce) { done(); return; }

  const tl = gsap.timeline({ defaults: { ease: EASE_IO }, onComplete: done });
  tl.set('.nav', { autoAlpha: 0, y: -12 })
    .set('.hero__video', { scale: 1.3 })
    .from('.intro__mark--iso', { xPercent: 30, autoAlpha: 0, duration: 1, ease: EASE_OUT }, 0.15)
    .from('.intro__mark--logo', { xPercent: -8, autoAlpha: 0, duration: 1, ease: EASE_OUT }, 0.15)
    // las dos mitades se separan: la imagen aparece en el medio, como un marco que se abre
    .to('.intro__half--l', { xPercent: -100, duration: 1.5 }, 1.25)
    .to('.intro__half--r', { xPercent: 100, duration: 1.5 }, 1.25)
    .to('.intro__mark--iso', { xPercent: -40, duration: 1.5 }, 1.25)
    .to('.intro__mark--logo', { xPercent: 12, duration: 1.5 }, 1.25)
    .to('.hero__video', { scale: 1.08, duration: 2.2, ease: 'power2.out' }, 1.25)
    .from(heroTitle.lines, { yPercent: 110, duration: 1.2, stagger: 0.09, ease: EASE_OUT }, 2.05)
    .from('.hero__copy .eyebrow', { autoAlpha: 0, y: 10, duration: 0.8, ease: EASE_OUT }, 2.1)
    .from('.hero__scroll', { autoAlpha: 0, duration: 0.8 }, 2.3)
    .to('.nav', { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE_OUT }, 2.2);
}

// ---------- 3. Hero fijo: la sección siguiente se le superpone ----------
function initHero() {
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', pin: true, pinSpacing: false });
  gsap.to('.hero__copy', { yPercent: -30, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '60% top', scrub: true } });
  gsap.to('.hero__shade', { opacity: 1.6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
}

// ---------- 4. Showcase: imagen chica → grande → proyectos → puerta 3D ----------
function initShowcase() {
  const stage = $('.showcase__stage');
  const frame = $('.showcase__frame');
  const imgs = $$('.showcase__img', frame);
  const names = ['Casa El Bosque', 'Casa Altos C', 'Casa Ashi', 'Condominio Foresta', 'Nova · Línea A medida'];
  const countEl = $('.showcase__count');
  const nameEl = $('.showcase__name');
  const doorWrap = $('.door3d');
  const door = createDoor($('.door3d__canvas'));

  const vw = () => stage.clientWidth, vh = () => stage.clientHeight;
  const small = () => {
    const w = isDesktop() ? vw() * 0.26 : vw() * 0.62, h = isDesktop() ? vh() * 0.42 : vh() * 0.36;
    return `inset(${(vh() - h) / 2}px ${(vw() - w) / 2}px ${(vh() - h) / 2}px ${(vw() - w) / 2}px)`;
  };
  const full = 'inset(0px 0px 0px 0px)';
  const doorClip = () => {
    const r = door.getScreenRect();
    return `inset(${r.top}px ${vw() - r.right}px ${vh() - r.bottom}px ${r.left}px)`;
  };

  const title = new SplitText('.showcase__title', { type: 'lines,chars', mask: 'lines' });
  const reveal = { p: 0 };

  gsap.set(imgs.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.set(imgs, { scale: 1.25 });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '.showcase', start: 'top top', end: () => '+=' + vh() * 7, pin: stage, scrub: 1, invalidateOnRefresh: true,
      onUpdate: (self) => {
        const live = self.progress > 0.78;
        doorWrap.classList.toggle('is-live', live);
        door.setLive(live);
      },
      onToggle: (self) => door.setVisible(self.isActive),
    },
  });

  // a. la imagen chica crece hasta ocupar el cuadro
  tl.fromTo(frame, { clipPath: small }, { clipPath: full, duration: 1.2, ease: 'power2.inOut' }, 0)
    .to(imgs[0], { scale: 1, duration: 1.2, ease: 'power2.inOut' }, 0)
    .to('.showcase__caption', { autoAlpha: 1, duration: 0.3 }, 0.9);

  // b. pasan los proyectos, cada uno se revela de abajo hacia arriba
  let t = 1.6;
  imgs.slice(1).forEach((img, i) => {
    tl.to(img, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'power2.inOut' }, t)
      .to(img, { scale: 1, duration: 1.1, ease: 'power2.out' }, t)
      .to(imgs[i], { scale: 0.92, duration: 0.9, ease: 'power2.inOut' }, t)
      .call(() => setCaption(i + 1), null, t + 0.45)
      .call(() => setCaption(i), null, t + 0.44); // al volver para arriba
    t += 1.15;
  });
  function setCaption(i) {
    const dir = tl.scrollTrigger?.direction ?? 1;
    const idx = dir > 0 ? i : i;
    countEl.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(imgs.length).padStart(2, '0')}`;
    nameEl.textContent = names[idx];
  }

  // c. se "extrae" la puerta: el cuadro se recorta a la hoja y pasa a 3D
  tl.to('.showcase__caption', { autoAlpha: 0, duration: 0.3 }, t)
    .to(frame, { clipPath: doorClip, duration: 1.1, ease: 'power3.inOut' }, t)
    .to('.showcase', { backgroundColor: '#e6e5e0', duration: 0.1 }, t)
    .to(doorWrap, { autoAlpha: 1, duration: 0.35 }, t + 0.95)
    .to(frame, { autoAlpha: 0, filter: 'blur(6px)', duration: 0.4 }, t + 1.0)
    .to(reveal, { p: 1, duration: 1.2, ease: 'power2.inOut', onUpdate: () => door.setReveal(reveal.p) }, t + 1.1);

  // d. "Diseñamos aberturas de madera."
  t += 1.4;
  tl.to('.showcase__text .eyebrow', { autoAlpha: 1, duration: 0.3 }, t)
    .from(title.chars, {
      yPercent: 115, rotate: 6, filter: 'blur(4px)', duration: 0.7, ease: 'power3.out',
      stagger: { each: 0.025, ease: 'power1.in' },
    }, t)
    .to('.showcase__body', { autoAlpha: 1, y: 0, duration: 0.5 }, t + 0.6)
    .to({}, { duration: 1.8 }); // pausa: la puerta queda para jugar y la sección siguiente sube por encima

  gsap.set('.showcase__body', { y: 14 });
}

// ---------- 5. Tu obra: "Cada obra tiene su puerta." ----------
function initObra() {
  const stage = $('.obra__stage');
  const imgs = $$('.obra__img', stage);
  const items = $$('.obra__item', stage);
  const flap = $('.obra__flap');

  // Todas las imágenes viven en el rectángulo "principal a la derecha" y se mueven con transform.
  const R = () => {
    const vw = stage.clientWidth, vh = stage.clientHeight;
    if (!isDesktop()) {
      const main = { l: vw * 0.06, t: vh * 0.08, w: vw * 0.88, h: vh * 0.4 };
      return { vw, vh, main, center: { x: 0, y: 0 }, small: { x: vw * 0.52, y: vh * 0.38, s: 0.4 }, exit: { x: -vw, y: 0 } };
    }
    const main = { l: vw * 0.5, t: vh * 0.13, w: vw * 0.34, h: vh * 0.72 };
    return {
      vw, vh, main,
      center: { x: (vw - main.w) / 2 - main.l, y: 0 },                                   // centrada en el cuadro
      small: { x: vw * 0.865 - main.l, y: vh * 0.93 - main.t - main.h * 0.27, s: 0.27 }, // abajo a la derecha
      exit: { x: -main.l - main.w * 0.2, y: 0 },                                   // se va por detrás de la solapa
    };
  };
  const place = () => {
    const r = R();
    imgs.forEach((im) => Object.assign(im.style, { left: r.main.l + 'px', top: r.main.t + 'px', width: r.main.w + 'px', height: r.main.h + 'px', transformOrigin: '0 0' }));
  };
  place();
  ScrollTrigger.addEventListener('refreshInit', place);

  // título de la sección
  const ttl = new SplitText('.obra__title', { type: 'lines', mask: 'lines' });
  // la sección sube por encima de la puerta 3D y el título aparece mientras sube
  gsap.from(ttl.lines, { yPercent: 110, duration: 1.3, stagger: 0.12, ease: EASE_OUT, scrollTrigger: { trigger: '.obra', start: 'top 45%' } });

  gsap.set(imgs[0], { x: () => R().center.x, y: 0, scale: 1 });
  gsap.set(imgs.slice(1), { x: () => R().small.x, y: () => R().small.y, scale: () => R().small.s, autoAlpha: 0 });
  gsap.set(items, { autoAlpha: 0, y: 24 });

  const tl = gsap.timeline({
    defaults: { ease: 'power3.inOut' },
    scrollTrigger: { trigger: stage, start: 'top top', end: () => '+=' + stage.clientHeight * 4, pin: true, scrub: 1, invalidateOnRefresh: true },
  });

  // entra la de viviendas desde abajo, al medio
  tl.from(imgs[0], { y: () => R().vh * 0.9, duration: 1, ease: 'power2.out' }, 0)
    .to('.obra__title', { scale: 0.94, autoAlpha: 0.12, duration: 1, ease: 'power2.out' }, 0);

  // paso 1: viviendas se corre a la derecha, entra la solapa y asoma la siguiente
  tl.to(imgs[0], { x: 0, duration: 1 }, 1)
    .to(flap, { xPercent: 101, duration: 1 }, 1)
    .to('.obra__title', { autoAlpha: 0, duration: 0.5 }, 1)
    .to(items[0], { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 1.45)
    .to(imgs[1], { autoAlpha: 1, duration: 0.5 }, 1.4);

  // pasos 2 y 3: la chica toma el lugar de la principal
  [1, 2].forEach((i, k) => {
    const at = 2.6 + k * 1.4;
    tl.to(items[i - 1], { autoAlpha: 0, y: -18, duration: 0.4, ease: 'power2.in' }, at)
      .to(imgs[i - 1], { x: () => R().exit.x, duration: 1 }, at)
      .to(imgs[i], { x: 0, y: 0, scale: 1, duration: 1 }, at)
      .to(items[i], { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, at + 0.55);
    if (imgs[i + 1]) tl.to(imgs[i + 1], { autoAlpha: 1, duration: 0.5 }, at + 0.4);
  });
  tl.to({}, { duration: 0.6 });
  // la solapa arranca afuera: el estado inicial fuera de pantalla lo da el CSS (-101%)
}

// ---------- 6. Líneas: fotos que se van sucediendo ----------
function initLineas() {
  $$('[data-slideshow]').forEach((box, k) => {
    const slides = $$('img', box);
    gsap.set(slides.slice(1), { clipPath: 'inset(0% 0% 0% 100%)' });
    let i = 0;
    const next = () => {
      const cur = slides[i], nxt = slides[(i + 1) % slides.length];
      gsap.set(nxt, { zIndex: 2, clipPath: 'inset(0% 0% 0% 100%)', scale: 1.14 });
      gsap.set(cur, { zIndex: 1 });
      gsap.timeline()
        .to(nxt, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power4.inOut' }, 0)
        .to(nxt, { scale: 1, duration: 2.2, ease: 'power3.out' }, 0)
        .to(cur, { scale: 1.06, xPercent: -6, duration: 1.3, ease: 'power4.inOut' }, 0)
        .set(cur, { zIndex: 0, xPercent: 0, scale: 1, clipPath: 'inset(0% 0% 0% 100%)' });
      i = (i + 1) % slides.length;
    };
    let timer = null;
    const start = () => { if (!timer && !reduce) timer = setInterval(next, 3600); };
    const stop = () => { clearInterval(timer); timer = null; };
    // la segunda arranca desfasada para que no cambien a la vez
    ScrollTrigger.create({ trigger: box, start: 'top 85%', end: 'bottom top', onToggle: (s) => (s.isActive ? setTimeout(start, k * 1800) : stop()) });
  });

  gsap.from('.linea', { y: 60, autoAlpha: 0, duration: 1.2, stagger: 0.15, ease: EASE_OUT, scrollTrigger: { trigger: '.lineas__grid', start: 'top 80%' } });
}

// ---------- 7. Proyectos: entrada escalonada (el hover lo resuelve el CSS) ----------
function initProyectos() {
  $$('.proy').forEach((p, i) => {
    gsap.from(p.querySelector('figure'), { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.4, ease: 'power4.out', scrollTrigger: { trigger: p, start: 'top 88%' } });
    gsap.from(p.querySelector('img'), { scale: 1.25, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 88%' } });
  });
}

// ---------- 8. Empresa: contadores ----------
function initEmpresa() {
  $$('.count').forEach((el) => {
    const to = +el.dataset.to;
    const o = { v: 0 };
    gsap.to(o, {
      v: to, duration: 2.4, ease: 'power3.out',
      onUpdate: () => (el.textContent = Math.round(o.v)),
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });
  gsap.from('.stat', { y: 40, autoAlpha: 0, duration: 1.1, stagger: 0.1, ease: EASE_OUT, scrollTrigger: { trigger: '.stats', start: 'top 85%' } });
}

// ---------- 9. Tira continua de izquierda a derecha ----------
function initTira() {
  const track = $('.tira__track');
  track.innerHTML += track.innerHTML; // duplicado para el bucle sin cortes
  if (reduce) return;
  const loop = gsap.fromTo(track, { xPercent: -50 }, { xPercent: 0, duration: 55, ease: 'none', repeat: -1 });
  // acelera un poco con la velocidad del scroll
  ScrollTrigger.create({
    trigger: '.tira', start: 'top bottom', end: 'bottom top',
    onUpdate: (s) => {
      const v = Math.min(Math.abs(s.getVelocity()) / 400, 5);
      gsap.to(loop, { timeScale: 1 + v, duration: 0.3, overwrite: true });
      gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.3 });
    },
  });
}

// ---------- 10. Títulos y textos que entran ----------
function initTexts() {
  $$('[data-split-lines]').forEach((el) => {
    const s = new SplitText(el, { type: 'lines', mask: 'lines' });
    gsap.from(s.lines, { yPercent: 110, duration: 1.2, stagger: 0.1, ease: EASE_OUT, scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
  $$('[data-fade], .sec-head .eyebrow, .sec-head .link-arrow').forEach((el) => {
    gsap.from(el, { y: 16, autoAlpha: 0, duration: 1, ease: EASE_OUT, scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
}

// ---------- 11. Navegación ----------
function initNav() {
  const nav = $('.nav');
  ScrollTrigger.create({
    trigger: '.hero', start: 'top top', end: 'bottom 80px',
    onToggle: (s) => { nav.dataset.theme = s.isActive ? 'light' : 'dark'; nav.classList.toggle('is-solid', !s.isActive); },
  });
  let last = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (s) => {
      const y = s.scroll();
      nav.classList.toggle('is-hidden', y > last && y > window.innerHeight);
      last = y;
    },
  });
}

// ---------- Arranque ----------
(async function boot() {
  await inlineSvgs();
  try { await document.fonts.ready; } catch (_) {}
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
