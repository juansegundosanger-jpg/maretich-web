// Maretich · Home — animaciones (GSAP + ScrollTrigger + ScrollSmoother + SplitText)
(function () {
const { gsap, ScrollTrigger, ScrollSmoother, SplitText, CustomEase } = window;
gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, CustomEase);
// la curva que usa Casa Momo en su intro: cubic-bezier(.8, 0, 0, 1)
CustomEase.create('casa', 'M0,0 C0.8,0 0,1 1,1');

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

// ---------- 01 Intro ----------
// Copia del recorrido de Casa Momo (CASA | MOMO), con el isologo y el logotipo:
//  1. aparecen juntos y grandes al centro (suben con un leve desenfoque e inclinación);
//  2. a los 1,5 s se separan hacia los bordes (1,6 s, curva .8,0,0,1);
//  3. a los 2,9 s el video crece desde el centro (de círculo a pantalla completa) y, en lugar de irse a las esquinas,
//     la marca vuelve a juntarse y viaja arriba a la izquierda, donde queda como logo de la navegación.
function playIntro() {
  const iso = $('.intro__iso'), logo = $('.intro__logo');
  const navLogo = $('.nav__logo');
  const done = () => { document.body.classList.remove('is-loading'); $('.wa-float').classList.add('is-in'); if (smoother) smoother.paused(false); };
  const copy = new SplitText('.hero__title', { type: 'lines', mask: 'lines' });
  // siempre desde arriba de todo y sin dejar scrollear mientras corre la intro
  window.scrollTo(0, 0);
  if (smoother) { smoother.scrollTop(0); smoother.paused(true); }
  if (reduce) { done(); return; }

  // proporciones de los dibujos (medidas sobre los SVG): caja del trazo dentro de cada archivo
  const ISO = { ar: 851 / 1000, gx: 0.043, gy: 0.042, gw: 0.911, gh: 0.767 };      // isologo
  const LOG = { ar: 195 / 1000, gx: 0.015, gy: 0.025, gw: 0.962, gh: 0.153 };      // logotipo
  const vw = window.innerWidth, vh = window.innerHeight;

  // estado 1 y 2: logotipo grande (como el "MOMO" de 200 px en 1600) y el isologo un poco más alto que las letras
  const logoW = Math.min(vw * 0.42, 760);
  const glyphH = LOG.gh * logoW;
  const isoW = (glyphH * 1.33) / ISO.gh;
  const gap = (68 / 1600) * vw;
  const rowW = isoW * ISO.gw + gap + logoW * LOG.gw;
  const cy = vh / 2;
  const place = (el, M, w, gx, gcy) => ({ x: gx - M.gx * w, y: gcy - (M.gy + M.gh / 2) * w, width: w });
  const s1 = {
    iso: place(iso, ISO, isoW, (vw - rowW) / 2, cy),
    logo: place(logo, LOG, logoW, (vw - rowW) / 2 + isoW * ISO.gw + gap, cy),
  };
  const edge = (48 / 1600) * vw;
  const s2 = {
    iso: place(iso, ISO, isoW, edge, cy),
    logo: place(logo, LOG, logoW, vw - edge - logoW * LOG.gw, cy),
  };
  // estado 3: exactamente donde está el logo de la navegación (hoja y "MARETICH" dentro de logo-full.svg)
  const n = navLogo.getBoundingClientRect(), W = n.width;
  const isoW3 = (0.188 * W) / ISO.gw, logoW3 = (0.738 * W) / LOG.gw;
  const s3 = {
    iso: { x: n.left + 0.020 * W - ISO.gx * isoW3, y: n.top + 0.023 * W - ISO.gy * isoW3, width: isoW3 },
    logo: { x: n.left + 0.243 * W - LOG.gx * logoW3, y: n.top + 0.042 * W - LOG.gy * logoW3, width: logoW3 },
  };

  gsap.set(iso, s1.iso); gsap.set(logo, s1.logo);
  gsap.set(navLogo, { autoAlpha: 0 });
  gsap.set('.nav__menu, .nav__burger', { autoAlpha: 0, y: -8 });
  gsap.set('.hero__media', { scale: 0, borderRadius: 2000, opacity: 0 });
  gsap.set('.hero__copy', { autoAlpha: 0 });

  const tl = gsap.timeline({ onComplete: done });
  tl.set('.intro span', { opacity: 1 }, 0)
    // 1. aparecen
    .fromTo([iso, logo], { yPercent: 40, skewY: 2, filter: 'blur(4px)', autoAlpha: 0 }, { yPercent: 0, skewY: 0, filter: 'blur(0px)', autoAlpha: 1, duration: 1.1, stagger: 0.08, ease: 'power3.out' }, 0.1)
    // 2. se separan hacia los bordes y, en el hueco que dejan, se abre el hero (el video crece desde el centro)
    .to(iso, { ...s2.iso, duration: 1.6, ease: 'casa' }, 1.5)
    .to(logo, { ...s2.logo, duration: 1.6, ease: 'casa' }, 1.5)
    .set('.intro', { backgroundColor: 'rgba(56,38,28,0)' }, 1.5)
    .to('.hero__media', { scale: 1, borderRadius: 0, opacity: 1, duration: 1.6, ease: 'casa' }, 1.5)
    // 3. la marca vuelve a juntarse arriba a la izquierda, donde queda como logo de la navegación
    .to(iso, { ...s3.iso, duration: 1.6, ease: 'casa' }, 2.9)
    .to(logo, { ...s3.logo, duration: 1.6, ease: 'casa' }, 2.9)
    // queda el logo de la navegación (aparece la bajada "aberturas de madera")
    .to(navLogo, { autoAlpha: 1, duration: 0.45, ease: 'power2.out' }, 4.45)
    .to('.intro span', { opacity: 0, duration: 0.3 }, 4.6)
    .to('.nav__menu, .nav__burger', { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE_OUT }, 4.3)
    .set('.hero__copy', { autoAlpha: 1 }, 4.0)
    .from(copy.lines, { yPercent: 110, duration: 1.2, stagger: 0.1, ease: EASE_OUT }, 4.0)
    .from('.hero__sub', { autoAlpha: 0, y: 14, duration: 1, ease: EASE_OUT }, 4.35);
}

function initHero() {
  // el hero queda fijo y "Diseñamos" sube por encima
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', pin: true, pinSpacing: false });
  gsap.to('.hero__copy', { y: -80, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '70% top', scrub: true } });

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

  // las fotos se suceden con un fundido largo y un leve acercamiento
  let i = 0, timer = null;
  const next = () => {
    const cur = imgs[i]; i = (i + 1) % imgs.length; const nxt = imgs[i];
    gsap.set(nxt, { zIndex: 2, autoAlpha: 0, scale: 1.08 });
    gsap.set(cur, { zIndex: 1 });
    gsap.timeline()
      .to(nxt, { autoAlpha: 1, duration: 1.1, ease: 'sine.inOut' }, 0)
      .to(nxt, { scale: 1, duration: 2, ease: 'power2.out' }, 0)
      .set(cur, { autoAlpha: 0, zIndex: 0 });
  };
  ScrollTrigger.create({ trigger: media, start: 'top bottom', end: 'bottom top', onToggle: (s) => { clearInterval(timer); timer = null; if (s.isActive && !reduce) timer = setInterval(next, 2000); } });
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

// ---------- 04 Tu obra — copia del bloque de Still/Form ("Not every space needs to be grand" → "A different way to stay") ----------
// 1) la foto arranca recortada al ~50% y, con el scroll, se abre a pantalla completa (fondo blanco → gris);
// 2) aparece la frase grande abajo a la izquierda;
// 3) por pasos: la foto se achica al centro, la info entra a la derecha y la siguiente asoma abajo a la derecha;
//    al avanzar, la principal se achica y se va arriba a la izquierda, y la de abajo pasa a ser la principal.
// Los pasos no van atados al scroll cuadro a cuadro: al cruzar cada umbral, la animación se reproduce sola (como en Still/Form).
function initObras() {
  const stage = $('.obras__stage');
  const imgs = $$('.ob__img', stage);
  const inners = imgs.map((f) => f.querySelector('img'));
  const heroPieces = $$('.ob__hp', stage);
  const texts = $$('.ob__text', stage).map((t) => $$('.ob__p', t));
  const textBoxes = $$('.ob__text', stage);
  const label = $('.ob__count', stage);
  const col = $('.ob__col', stage);
  const d = imgs.length;
  const R = 18;
  const S = {
    desktop: {
      hero: { left: 0, top: 0, width: 100, height: 100, borderRadius: 0, opacity: 1 },
      main: { left: 27, top: 3.4, width: 45, height: 93.2, borderRadius: 28, opacity: 1 },
      prev: { left: 16.6, top: 3.4, width: 8.6, height: 18, borderRadius: R, opacity: 1 },
      next: { left: 74, top: 78.6, width: 8.6, height: 18, borderRadius: R, opacity: 1 },
      out: { left: 16.6, top: 3.4, width: 8.6, height: 18, borderRadius: R, opacity: 0 },
      wait: { left: 74, top: 78.6, width: 8.6, height: 18, borderRadius: R, opacity: 0 },
    },
    mobile: {
      hero: { left: 0, top: 0, width: 100, height: 100, borderRadius: 0, opacity: 1 },
      main: { left: 4, top: 3, width: 92, height: 50, borderRadius: 28, opacity: 1 },
      prev: { left: 4, top: 84, width: 22, height: 12, borderRadius: R, opacity: 1 },
      next: { left: 74, top: 84, width: 22, height: 12, borderRadius: R, opacity: 1 },
      out: { left: 4, top: 84, width: 22, height: 12, borderRadius: R, opacity: 0 },
      wait: { left: 74, top: 84, width: 22, height: 12, borderRadius: R, opacity: 0 },
    },
  };
  const css = (e) => ({ left: e.left + '%', top: e.top + '%', width: e.width + '%', height: e.height + '%', borderRadius: e.borderRadius, opacity: e.opacity });
  const prevIdx = (e) => (e === 0 ? 0 : e - 1);
  const F = 130 + 110 * d + 40;                       // largo del pin en % de pantalla (igual que Still/Form)
  const label_ = (k) => (k < 0 ? 'hidden' : 's' + k);
  let current = -1, player;

  gsap.matchMedia().add({ desktop: '(min-width: 901px)', mobile: '(max-width: 900px)' }, (ctx) => {
    const st = ctx.conditions.desktop ? S.desktop : S.mobile;
    const pose = (i, step) => {
      if (step === 0) return i === 0 ? st.hero : st.wait;
      const k = i - (step - 1);
      return k <= -2 ? st.out : k === -1 ? st.prev : k === 0 ? st.main : k === 1 ? st.next : st.wait;
    };
    imgs.forEach((im, i) => gsap.set(im, { ...css(pose(i, 0)), zIndex: d - i }));
    gsap.set(inners, { scale: (i) => (i === 0 ? 1 : 1.2) });
    gsap.set(heroPieces, { yPercent: 110, opacity: 0 });
    texts.forEach((p) => gsap.set(p, { yPercent: 110, opacity: 0 }));
    gsap.set(label, { opacity: 0 });

    // apertura: atada al scroll (primer 100%)
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: stage, start: 'top top', end: '+=100%', scrub: 0.8, invalidateOnRefresh: true } })
      .fromTo(imgs[0], { clipPath: ctx.conditions.desktop ? 'inset(24% 32% 24% 32% round 28px)' : 'inset(30% 8% 30% 8% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut', duration: 1 }, 0)
      .fromTo(inners[0], { scale: 1.3 }, { scale: 1, ease: 'power2.inOut', duration: 1 }, 0)
      .fromTo(stage, { backgroundColor: '#FFFFFF' }, { backgroundColor: '#e6e5e0', duration: 0.4 }, 0.6);

    // pasos: línea de tiempo en pausa con etiquetas hidden, s0, s1…
    const w = gsap.timeline({ paused: true });
    w.addLabel('hidden', 0);
    w.fromTo(heroPieces, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.09, ease: 'power3.out', immediateRender: false }, 0);
    w.addLabel('s0', 1);
    for (let e = 1; e <= d; e++) {
      const t = 1 + (e - 1) * 1.2, first = e === 1;
      imgs.forEach((im, r) => {
        const from = pose(r, e - 1), to = pose(r, e);
        if (from !== to) {
          const late = from === st.wait && to === st.next;
          w.to(im, { ...css(to), duration: first && r === 0 ? 1.1 : 0.9, ease: 'power3.inOut' }, late && first ? t + 0.6 : t);
        }
        const a = r === prevIdx(e - 1) ? 1 : 1.2, b = r === prevIdx(e) ? 1 : 1.2;
        if (a !== b) w.to(inners[r], { scale: b, duration: 0.9, ease: 'power3.inOut' }, t);
      });
      if (prevIdx(e) !== prevIdx(e - 1)) { w.set(imgs[prevIdx(e)], { zIndex: 3 }, t); w.set(imgs[prevIdx(e - 1)], { zIndex: 2 }, t); }
      if (first) w.fromTo(heroPieces, { yPercent: 0, opacity: 1 }, { yPercent: -110, opacity: 0, duration: 0.4, stagger: 0.05, ease: 'power2.in', immediateRender: false }, t);
      else w.fromTo(texts[e - 2], { yPercent: 0, opacity: 1 }, { yPercent: -110, opacity: 0, duration: 0.2, stagger: 0.03, ease: 'power2.in', immediateRender: false }, t);
      w.call(((k) => () => textBoxes.forEach((b, j) => b.classList.toggle('is-on', j === k)))(e - 1), null, t + 0.3);
      w.to(texts[e - 1], { yPercent: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: 'power3.out' }, t + (first ? 0.55 : 0.35));
      if (first) w.to(label, { opacity: 1, duration: 0.6 }, t + 0.6);
      else w.to(col, { yPercent: -(100 / d) * (e - 1), duration: 0.6, ease: 'power3.inOut' }, t);
      w.set({}, {}, t + 1.2);
      w.addLabel('s' + e, t + 1.2);
    }
    w.seek(label_(current));

    ScrollTrigger.create({
      trigger: stage, start: 'top top', end: '+=' + F + '%', pin: true, anticipatePin: 1,
      onUpdate: (self) => {
        const p = self.progress * F, a = (p - 100 - 30) / 110;
        const k = a >= 0.6 ? Math.min(d, Math.floor(a - 0.6) + 1) : p >= 90 ? 0 : -1;
        if (k !== current) { current = k; if (player) player.kill(); player = w.tweenTo(label_(k), { ease: 'none' }); }
      },
    });
  });
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
