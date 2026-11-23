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
  const done = () => { gsap.set('.lg-iso, .lg-word', { clearProps: 'filter' }); document.body.classList.remove('is-loading'); $('.wa-float').classList.add('is-in'); if (smoother) smoother.paused(false); };
  const copy = new SplitText('.hero__title', { type: 'lines', mask: 'lines' });
  // siempre desde arriba de todo y sin dejar scrollear mientras corre la intro
  window.scrollTo(0, 0);
  if (smoother) { smoother.scrollTop(0); smoother.paused(true); }
  if (reduce) { done(); return; }

  // la marca de la intro ES el logo de la navegación: se anima su hoja y su "MARETICH" desde el centro
  // hasta su lugar, y al final se suma el descriptivo "aberturas de madera" (marca completa, sin cortes)
  const svg = $('svg', navLogo);
  const gIso = $('.lg-iso', svg), gWord = $('.lg-word', svg), gDesc = $('.lg-desc', svg);
  const vw = window.innerWidth, vh = window.innerHeight;
  const rIso = gIso.getBoundingClientRect(), rWord = gWord.getBoundingClientRect();
  const u = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;   // px por unidad del svg

  // tamaños como antes: "MARETICH" grande y la hoja un poco más alta que las letras
  const wordW = Math.min(vw * 0.42, 760) * 0.962;
  const kWord = wordW / rWord.width;
  const isoH = rWord.height * kWord * 1.33;
  const kIso = isoH / rIso.height;
  const isoW = rIso.width * kIso;
  const gap = (68 / 1600) * vw, edge = (48 / 1600) * vw, cy = vh / 2;
  const rowW = isoW + gap + wordW;
  // lleva la caja de un grupo (escalado k) a la posición de pantalla (left, centro vertical)
  const at = (r, k, left) => ({ x: (left - r.left) / u, y: (cy - (r.height * k) / 2 - r.top) / u, scale: k });
  const s1 = { iso: at(rIso, kIso, (vw - rowW) / 2), word: at(rWord, kWord, (vw - rowW) / 2 + isoW + gap) };
  const s2 = { iso: at(rIso, kIso, edge), word: at(rWord, kWord, vw - edge - wordW) };
  const s3 = { x: 0, y: 0, scale: 1 };

  gsap.set([gIso, gWord], { transformOrigin: '0% 0%' });
  gsap.set(gIso, s1.iso); gsap.set(gWord, s1.word);
  gsap.set(gDesc.children, { autoAlpha: 0, y: 6 });
  gsap.set('.intro span', { display: 'none' });
  gsap.set('.nav__menu, .nav__burger', { autoAlpha: 0, y: -8 });
  gsap.set('.hero__media', { scale: 0, borderRadius: 2000, opacity: 0 });
  gsap.set('.hero__copy', { autoAlpha: 0 });

  const tl = gsap.timeline({ onComplete: done });
  tl
    // 1. aparecen
    .fromTo([gIso, gWord], { autoAlpha: 0, filter: 'blur(4px)' }, { autoAlpha: 1, filter: 'blur(0px)', duration: 1.1, stagger: 0.08, ease: 'power3.out' }, 0.1)
    .fromTo(gIso, { y: s1.iso.y + 30 }, { y: s1.iso.y, duration: 1.1, ease: 'power3.out' }, 0.1)
    .fromTo(gWord, { y: s1.word.y + 30 }, { y: s1.word.y, duration: 1.1, ease: 'power3.out' }, 0.18)
    // 2. se separan hacia los bordes y, en el hueco que dejan, se abre el hero (el video crece desde el centro)
    .to(gIso, { ...s2.iso, duration: 1.6, ease: 'casa' }, 1.5)
    .to(gWord, { ...s2.word, duration: 1.6, ease: 'casa' }, 1.5)
    .set('.intro', { backgroundColor: 'rgba(56,38,28,0)' }, 1.5)
    .to('.hero__media', { scale: 1, borderRadius: 0, opacity: 1, duration: 1.6, ease: 'casa' }, 1.5)
    // 3. la marca se vuelve a juntar arriba a la izquierda y se queda: se le suma "aberturas de madera"
    .to([gIso, gWord], { ...s3, duration: 1.6, ease: 'casa' }, 2.9)
    .to(gDesc.children, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.025, ease: 'power3.out' }, 4.25)
    .to('.nav__menu, .nav__burger', { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE_OUT, clearProps: 'opacity,visibility,transform' }, 4.3)
    .set('.hero__copy', { autoAlpha: 1 }, 4.0)
    .from(copy.lines, { yPercent: 140, duration: 1.2, stagger: 0.1, ease: EASE_OUT }, 4.0)
    .from('.hero__sub', { autoAlpha: 0, y: 14, duration: 1, ease: EASE_OUT }, 4.35);
}

function initHero() {
  // el hero queda fijo y "Diseñamos" sube por encima
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', pin: true, pinSpacing: false });
  gsap.to('.hero__copy', { y: -80, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '70% top', scrub: true } });

  // un solo video horizontal en loop (planos generales de obra, en cámara lenta)
  const v = $('.hero__video');
  const play = () => { const p = v.play(); if (p) p.catch(() => {}); };
  play();
  ScrollTrigger.create({ trigger: '.hero', start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? play() : v.pause()) });
  document.addEventListener('visibilitychange', () => (document.hidden ? v.pause() : play()));
}

// ---------- 02 Diseñamos y fabricamos (Bulletproof) ----------
function initDisenamos() {
  const sec = $('.dis');
  const lines = $$('.dis__line > span', sec);
  const desc = $$('.dis__dl > span', sec);
  const media = $('.dis__media', sec);
  const imgs = $$('img', media);

  gsap.set(lines, { yPercent: 140 });
  gsap.set(desc, { yPercent: 140 });
  gsap.set(media, { clipPath: 'inset(50% 50% 50% 50% round 18px)' });
  gsap.set(imgs.slice(1), { autoAlpha: 0 });
  let ready = false;

  gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 70%' } })
    .to(lines, { yPercent: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out' })
    .to(media, { clipPath: 'inset(0% 0% 0% 0% round 18px)', duration: 1.4, ease: 'expo.inOut', onComplete: () => { gsap.set(media, { clearProps: 'clipPath' }); ready = true; } }, 0.35)
    .to(desc, { yPercent: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out' }, 0.9)
    .from('.dis__btn', { autoAlpha: 0, y: 12, duration: 0.9, ease: EASE_OUT }, 1.2);

  // el título se mueve mientras bajás: cada renglón se desliza hacia un lado distinto
  $$('.dis__line', sec).forEach((l, k) => gsap.fromTo(l, { x: () => (k % 2 ? -1 : 1) * window.innerWidth * 0.06 }, {
    x: () => (k % 2 ? 1 : -1) * window.innerWidth * 0.06, ease: 'none',
    scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true },
  }));

  // las fotos se suceden con un corte seco, sin transición
  let i = 0, timer = null, active = false, fanned = false;
  const next = () => {
    if (fanned) return;
    const cur = imgs[i]; i = (i + 1) % imgs.length;
    gsap.set(imgs[i], { autoAlpha: 1 }); gsap.set(cur, { autoAlpha: 0 });
  };
  ScrollTrigger.create({ trigger: media, start: 'top bottom', end: 'bottom top', onToggle: (s) => { active = s.isActive; clearInterval(timer); timer = null; if (active && !reduce) timer = setInterval(next, 2000); } });

  // al pasar el mouse por el cuadro, todas las fotos se despliegan en horizontal como cartas (superpuestas);
  // la carta que tiene el cursor encima se agranda
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const n = imgs.length, mid = (n - 1) / 2;
  const fanPose = (k) => {
    const d = k - mid, w = media.offsetWidth;
    return { x: d * w * 0.46, y: d * d * 5, rotation: d * 3.5, scale: 1 };
  };
  const open = () => {
    if (!ready || fanned) return;
    fanned = true;
    media.classList.add('is-fan');
    imgs.forEach((im, k) => gsap.set(im, { autoAlpha: 1, zIndex: k + 1 }));
    imgs.forEach((im, k) => gsap.to(im, { ...fanPose(k), duration: 0.8, ease: 'expo.out', delay: Math.abs(k - mid) * 0.03, overwrite: 'auto' }));
  };
  const close = () => {
    if (!fanned) return;
    imgs.forEach((im, k) => gsap.to(im, { x: 0, y: 0, rotation: 0, scale: 1, duration: 0.6, ease: 'expo.inOut', overwrite: 'auto',
      onComplete: k === n - 1 ? () => {
        if (media.matches(':hover')) return;   // si el cursor volvió mientras se cerraba, no cortar
        fanned = false; media.classList.remove('is-fan');
        imgs.forEach((x, j) => gsap.set(x, { autoAlpha: j === i ? 1 : 0, zIndex: 'auto' }));
      } : undefined }));
  };
  media.addEventListener('pointerenter', open);
  media.addEventListener('pointerleave', close);
  imgs.forEach((im, k) => {
    im.addEventListener('pointerenter', () => {
      if (!fanned) return;
      gsap.set(im, { zIndex: n + 5 });
      gsap.to(im, { ...fanPose(k), y: fanPose(k).y - 16, rotation: 0, scale: 1.22, duration: 0.5, ease: 'expo.out', overwrite: 'auto' });
    });
    im.addEventListener('pointerleave', () => {
      if (!fanned) return;
      gsap.set(im, { zIndex: k + 1 });
      if (media.matches(':hover')) gsap.to(im, { ...fanPose(k), duration: 0.5, ease: 'expo.out', overwrite: 'auto' });
    });
  });
}

// ---------- 03 Cada obra tiene su puerta (túnel) ----------
// Las puertas recortadas vienen desde el fondo hacia la cámara mientras se scrollea, como en "Feel at home".
function initTunel() {
  // el isologo se dibuja siguiendo su contorno a medida que se scrollea (y se desdibuja al subir).
  // Una máscara recorre el borde de cada forma con un pincel ancho: se ve el logo relleno, sin línea de trazo.
  const sec = $('.tunel');
  const art = $('.tunel__art', sec);
  const svg = $('svg', art);
  const NS = 'http://www.w3.org/2000/svg';
  const paths = $$('path', svg);
  const mask = document.createElementNS(NS, 'mask');
  mask.setAttribute('id', 'isoDraw'); mask.setAttribute('maskUnits', 'userSpaceOnUse');
  const vb = svg.viewBox.baseVal;
  mask.setAttribute('x', vb.x); mask.setAttribute('y', vb.y); mask.setAttribute('width', vb.width); mask.setAttribute('height', vb.height);
  // Líneas centrales del logo (calculadas del dibujo), en el orden en que se "escribe":
  // 1) hoja izquierda hasta el pie del tallo, 2) del tallo a la hoja derecha, 3) hoja del medio de abajo-derecha a abajo-izquierda
  const CENTER = ["M1111.60 544.06 L1110.90 546.36 L1109.40 548.76 L1103.50 554.76 L1099.30 558.36 L1095.80 560.96 L1091.90 561.96 L1091.50 561.56 L1091.70 556.06 L1092.60 551.36 L1093.90 546.96 L1094.40 543.26 L1094.00 542.96 L1089.00 542.46 L1084.80 541.46 L1080.70 539.96 L1077.90 538.56 L1072.50 535.06 L1065.40 529.46 L1063.00 527.26 L1062.10 524.96 L1062.70 523.46 L1063.10 523.06 L1067.60 520.56 L1068.30 519.56 L1068.10 515.96 L1067.20 510.66 L1067.00 508.16 L1067.00 506.86 L1067.20 506.66 L1071.50 507.06 L1077.00 508.66 L1080.10 509.06 L1081.80 507.86 L1084.10 504.36 L1084.80 503.56 L1085.40 503.26 L1086.20 502.96 L1087.50 503.26 L1088.60 503.66 L1089.80 504.66 L1097.90 512.66 L1104.50 520.66 L1107.50 524.96 L1110.40 529.66 L1114.50 537.76 L1117.20 544.96 L1118.90 551.16 L1119.30 553.56 L1120.80 554.76 L1121.20 555.36 L1121.20 574.16 L1120.20 575.06", "M1120.20 575.06 L1121.20 574.16 L1121.10 555.16 L1123.00 553.56 L1124.60 546.66 L1126.80 540.16 L1128.60 536.06 L1131.20 530.96 L1133.60 526.86 L1138.90 519.26 L1146.00 510.96 L1153.80 503.56 L1155.90 502.86 L1157.30 503.36 L1158.10 504.16 L1161.10 508.66 L1162.00 509.16 L1164.30 508.96 L1170.70 507.06 L1175.10 506.66 L1175.30 506.96 L1175.10 511.16 L1174.00 517.26 L1173.90 519.66 L1174.40 520.46 L1179.60 523.36 L1180.40 524.86 L1179.80 526.66 L1179.40 527.36 L1177.90 528.76 L1172.80 532.96 L1169.20 535.56 L1164.30 538.66 L1161.90 539.86 L1157.30 541.56 L1154.00 542.36 L1148.10 542.96 L1147.90 543.16 L1148.30 546.66 L1149.80 552.06 L1150.70 557.36 L1150.80 561.46 L1150.40 561.96 L1146.70 561.06 L1143.50 558.76 L1138.80 554.76 L1132.90 548.76 L1131.50 546.56 L1131.00 545.36 L1130.80 544.06", "M1125.20 529.26 L1125.10 528.26 L1129.60 520.96 L1133.30 513.76 L1138.00 502.36 L1139.50 497.66 L1141.20 490.86 L1141.70 487.66 L1141.80 483.46 L1141.40 483.16 L1137.90 483.66 L1132.60 485.06 L1129.60 485.26 L1128.90 484.86 L1128.20 484.06 L1123.10 475.36 L1122.70 474.96 L1121.00 474.26 L1119.40 474.96 L1118.90 475.46 L1113.70 484.06 L1112.50 484.96 L1108.80 484.66 L1104.80 483.66 L1101.10 483.16 L1100.60 483.16 L1100.30 483.86 L1100.60 488.26 L1101.50 492.86 L1103.20 499.06 L1105.90 506.66 L1109.30 514.36 L1113.40 522.16 L1117.60 529.16 L1121.80 535.26 L1122.20 538.76"];
  const pens = CENTER.map((d) => {
    const m = document.createElementNS(NS, 'path');
    m.setAttribute('d', d); m.setAttribute('fill', 'none'); m.setAttribute('stroke', '#fff');
    m.setAttribute('stroke-width', '6'); m.setAttribute('stroke-linecap', 'round'); m.setAttribute('stroke-linejoin', 'round');
    mask.appendChild(m); return m;
  });
  const fillAll = paths.map((p) => { const f = p.cloneNode(); f.removeAttribute('fill-opacity'); f.setAttribute('fill', '#fff'); f.setAttribute('opacity', '0'); mask.appendChild(f); return f; });
  let defs = $('defs', svg); if (!defs) { defs = document.createElementNS(NS, 'defs'); svg.prepend(defs); }
  defs.appendChild(mask);
  const g = document.createElementNS(NS, 'g'); g.setAttribute('mask', 'url(#isoDraw)');
  paths.forEach((p) => g.appendChild(p)); svg.appendChild(g);

  const lens = pens.map((m) => m.getTotalLength());
  const total = lens.reduce((s, l) => s + l, 0);
  const st = { p: 0 };
  const render = () => {
    let left = st.p * total;
    pens.forEach((m, i) => {
      const d = Math.max(0, Math.min(lens[i], left)); left -= lens[i];
      m.setAttribute('stroke-dasharray', `${d} ${lens[i] + 10}`);
      m.style.visibility = d > 0.01 ? 'visible' : 'hidden';
    });
  };
  render();

  // empieza a dibujarse recién cuando la sección llega arriba (queda fija) y termina en unos 3 scrolls
  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + window.innerHeight * 0.6, scrub: 0.5, invalidateOnRefresh: true },
  })
    .to(st, { p: 1, duration: 1, onUpdate: render })
    .to(fillAll, { attr: { opacity: 1 }, duration: 0.06 }, 0.97);
  ScrollTrigger.create({ trigger: sec, start: 'top top', end: () => '+=' + window.innerHeight * 0.6, pin: '.tunel__stage', pinSpacing: true, invalidateOnRefresh: true });

  const t = new SplitText('.tunel__title', { type: 'lines', mask: 'lines' });
  gsap.from(t.lines, { yPercent: 140, duration: 1.3, stagger: 0.12, ease: EASE_OUT, scrollTrigger: { trigger: sec, start: 'top 60%' } });
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
  const shade = $('.ob__shade', stage);
  const texts = $$('.ob__text', stage).map((t) => $$('.ob__p', t));
  const textBoxes = $$('.ob__text', stage);
  const label = $('.ob__titles', stage);
  const tItems = $$('.ob__t', stage);
  // tamaño de los títulos: el más largo ocupa del margen al medianil
  const fitTitles = () => { label.classList.add('is-fit'); label.style.setProperty('--tf', '100px'); const w = Math.max(...tItems.map((t) => t.scrollWidth)); label.style.setProperty('--tf', (100 * label.clientWidth / w) + 'px'); label.offsetWidth; label.classList.remove('is-fit'); };
  fitTitles(); window.addEventListener('resize', fitTitles);
  const d = imgs.length;
  const R = 18;
  const S = {
    desktop: {
      hero: { left: 0, top: 0, width: 100, height: 100, borderRadius: 0, opacity: 1 },
      // posiciones del frame "OBRAS 3" del Figma
      main: { left: 33.8, top: 13.1, width: 34.4, height: 73.6, borderRadius: 28, opacity: 1 },
      // miniaturas más chicas para que no compitan con la foto principal
      prev: { left: 20, top: 13.1, width: 7.4, height: 15.7, borderRadius: R, opacity: 1 },
      next: { left: 71.7, top: 71, width: 7.4, height: 15.7, borderRadius: R, opacity: 1 },
      out: { left: 20, top: 13.1, width: 7.4, height: 15.7, borderRadius: R, opacity: 0 },
      wait: { left: 71.7, top: 71, width: 7.4, height: 15.7, borderRadius: R, opacity: 0 },
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
    gsap.set(heroPieces, { yPercent: 140, opacity: 0 });
    gsap.set(shade, { opacity: 0 });
    texts.forEach((p) => gsap.set(p, { yPercent: 140, opacity: 0 }));
    gsap.set(label, { opacity: 0 });

    // apertura: atada al scroll (primer 100%)
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: stage, start: 'top top', end: '+=100%', scrub: 0.8, invalidateOnRefresh: true } })
      .fromTo(imgs[0], { clipPath: ctx.conditions.desktop ? 'inset(24% 32% 24% 32% round 28px)' : 'inset(30% 8% 30% 8% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut', duration: 1 }, 0)
      .fromTo(inners[0], { scale: 1.3 }, { scale: 1, ease: 'power2.inOut', duration: 1 }, 0)
      .fromTo(stage, { backgroundColor: '#FFFFFF' }, { backgroundColor: '#e6e5e0', duration: 0.4 }, 0.6);

    // pasos: línea de tiempo en pausa con etiquetas hidden, s0, s1…
    const w = gsap.timeline({ paused: true });
    w.addLabel('hidden', 0);
    w.fromTo(heroPieces, { yPercent: 140, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.09, ease: 'power3.out', immediateRender: false }, 0);
    w.fromTo(shade, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.out', immediateRender: false }, 0);
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
      if (first) { w.fromTo(heroPieces, { yPercent: 0, opacity: 1 }, { yPercent: -110, opacity: 0, duration: 0.4, stagger: 0.05, ease: 'power2.in', immediateRender: false }, t); w.fromTo(shade, { opacity: 1 }, { opacity: 0, duration: 0.5, ease: 'power1.inOut', immediateRender: false }, t); }
      else w.fromTo(texts[e - 2], { yPercent: 0, opacity: 1 }, { yPercent: -110, opacity: 0, duration: 0.2, stagger: 0.03, ease: 'power2.in', immediateRender: false }, t);
      w.call(((k) => () => { textBoxes.forEach((b, j) => b.classList.toggle('is-on', j === k)); })(e - 1), null, t + 0.3);
      w.to(texts[e - 1], { yPercent: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: 'power3.out' }, t + (first ? 0.55 : 0.35));
      if (first) w.to(label, { opacity: 1, duration: 0.6 }, t + 0.6);
      w.set({}, {}, t + 1.2);
      w.addLabel('s' + e, t + 1.2);
    }
    w.seek(label_(current));

    ScrollTrigger.create({
      trigger: stage, start: 'top top', end: '+=' + F + '%', pin: true, anticipatePin: 1,
      onUpdate: (self) => {
        const p = self.progress * F, a = (p - 100 - 30) / 110;
        const k = a >= 0.6 ? Math.min(d, Math.floor(a - 0.6) + 1) : p >= 90 ? 0 : -1;
        if (k !== current) { current = k; tItems.forEach((b, j) => b.classList.toggle('is-on', j === k - 1)); if (player) player.kill(); player = w.tweenTo(label_(k), { ease: 'none' }); }
      },
    });
  });
}

// ---------- 05 Líneas: un video en cada una ----------
// Entrada como el loading: sobre fondo plano aparece "Línea a medida" grande al centro; el video crece desde el centro
// mientras el título viaja a su lugar del diseño, y después aparece el resto del texto.
function initLineas() {
  const sections = $$('.linea');
  sections.forEach((sec, idx) => {
    const last = idx === sections.length - 1;
    // borde de arriba: semicírculo que se vuelve recto al terminar de entrar
    gsap.fromTo(sec, { borderTopLeftRadius: '50% 34vh', borderTopRightRadius: '50% 34vh' }, { borderTopLeftRadius: '50% 0vh', borderTopRightRadius: '50% 0vh', ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top top', scrub: true, invalidateOnRefresh: true } });
    const v = $('.linea__video', sec);
    const media = $('.linea__media', sec);
    const label = $('.linea__label', sec);
    const copy = $('.linea__copy', sec);
    // el video sigue reproduciéndose todo el tiempo que la línea está en pantalla (incluido el tramo fijado)
    const playWhileVisible = (pinST) => ScrollTrigger.create({
      trigger: sec, start: 'top bottom', end: pinST ? () => pinST.end + window.innerHeight : 'bottom top',
      onToggle: (s) => { if (s.isActive) { if (v.preload !== 'auto') v.preload = 'auto'; const p = v.play(); if (p) p.catch(() => {}); } else v.pause(); },
    });
    const t = new SplitText($('.linea__title', sec), { type: 'lines', mask: 'lines' });
    const rest = [$('.linea__body', sec), $('.pill', sec)];
    const light = sec.dataset.line === 'pre';   // pre-diseñada: entra sobre el color claro del manual con el título en marrón

    // dónde está el título en el diseño y cuánto hay que moverlo para que arranque grande al centro
    const big = () => {
      const lx = copy.offsetLeft + label.offsetLeft, ly = copy.offsetTop + label.offsetTop;
      const w = label.offsetWidth, h = label.offsetHeight;
      const s = Math.min(4.2, (sec.clientWidth * 0.62) / w);
      return { x: sec.clientWidth / 2 - (lx + w / 2), y: sec.clientHeight / 2 - (ly + h / 2), scale: s };
    };
    if (reduce) { playWhileVisible(); return; }
    // la imagen se abre con un recorte (no se escala el video): así no aparecen manchas ni bordes claros mientras crece.
    // Mientras se abre se ve la foto fija del video; el video entra recién cuando está abierto y reproduciéndose
    const still = document.createElement('img');
    still.className = 'linea__still'; still.alt = ''; still.src = v.getAttribute('poster');
    media.insertBefore(still, v);
    gsap.set(v, { autoAlpha: 0 });
    v.addEventListener('playing', () => gsap.to(v, { autoAlpha: 1, duration: 0.6, ease: 'power1.out', overwrite: true }));
    const open = { k: 0 };
    const clip = () => {
      const k = open.k, i = (1 - k) * 50, r = (1 - k) * Math.min(sec.clientWidth, sec.clientHeight) * 0.5;
      media.style.clipPath = `inset(${i}% ${i}% ${i}% ${i}% round ${r}px)`;
      // mientras es chica no se ve (si no, queda como una mancha junto al título): aparece cuando ya tiene tamaño
      media.style.opacity = Math.max(0, Math.min(1, (k - 0.35) / 0.25));
    };
    clip();
    // force3D:false para que el navegador redibuje el texto a cada tamaño (si no, al agrandarse se ve pixelado)
    gsap.set(label, { x: () => big().x, y: () => big().y, scale: () => big().scale, transformOrigin: '50% 50%', '--ln': 0, force3D: false, color: light ? '#38261c' : '#ffffff' });
    gsap.set(t.lines, { yPercent: 140 });
    gsap.set(rest, { autoAlpha: 0, y: 16 });

    // cada línea se fija en pantalla: al scrollear el título viaja a su lugar, se abre el video y entra el texto;
    // recién al terminar se libera y llega la siguiente (sin superponerse)
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: sec, start: 'top top', end: last ? '+=140%' : '+=240%', pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true } })
      .to({}, { duration: 0.15 })
      .to(open, { k: 1, duration: 1, ease: 'casa', onUpdate: clip }, 0.15)
      .to(label, { x: 0, y: 0, scale: 1, duration: 1, ease: 'casa', force3D: false }, 0.15)
      .to(label, { color: '#ffffff', duration: 0.5 }, 0.6)
      .to(label, { '--ln': 1, duration: 0.35, ease: 'power2.inOut' }, 1.05)
      .to(t.lines, { yPercent: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' }, 1.0)
      .to(rest, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.07, ease: 'power3.out' }, 1.15)
      .to({}, { duration: 0.35 });
    // si viene otra línea, esta queda fija una pantalla más mientras la siguiente sube por encima
    if (!last) tl.to({}, { duration: tl.duration() * (100 / 140) });
    // el video espera en su primer cuadro y arranca desde el principio recién cuando la imagen terminó de abrirse,
    // así el plano se ve entero al llegar (sin el fundido del loop ni un cuadro a mitad de camino)
    const openAt = 1.05 / tl.duration();
    let running = false, outer = null;
    const sync = () => {
      const want = outer && outer.isActive && tl.scrollTrigger.progress >= openAt;
      if (want && !running) { running = true; const p = v.play(); if (p) p.catch(() => {}); }
      else if (!want && running) { running = false; v.pause(); gsap.to(v, { autoAlpha: 0, duration: 0.3, overwrite: true }); }
      if (!want && tl.scrollTrigger.progress < openAt && v.currentTime > 0) v.currentTime = 0;
    };
    v.preload = 'auto';
    outer = ScrollTrigger.create({ trigger: sec, start: 'top bottom', end: () => tl.scrollTrigger.end + window.innerHeight, onUpdate: sync, onToggle: sync });
  });
}

// ---------- 06 Proyectos — como la lista de trabajos de Bulletproof ----------
// Nombres grandes, escalonados; al pasar el mouse aparece la foto del proyecto siguiendo al cursor
// y el texto se invierte al pasar por encima de la foto.
function initProyectos() {
  const sec = $('.proyectos');
  const list = $('.plist', sec);
  const links = $$('.plist__item a', sec);
  const poster = $('.plist__poster', sec);
  const imgs = $$('.plist__imgs img', sec);
  const capName = $('.plist__cap-name', sec), capMeta = $('.plist__cap-meta', sec);
  const metas = list.dataset.metas.split('|');

  gsap.from($$('.plist__name', sec), { yPercent: 140, duration: 1.3, stagger: 0.08, ease: EASE_OUT, scrollTrigger: { trigger: list, start: 'top 80%' } });
  gsap.from($$('.plist__nr', sec), { autoAlpha: 0, duration: 0.8, stagger: 0.08, delay: 0.3, scrollTrigger: { trigger: list, start: 'top 80%' } });
  // leve corrimiento horizontal con el scroll, una fila para cada lado
  links.forEach((a, k) => gsap.fromTo(a, { x: () => (k % 2 ? -1 : 1) * window.innerWidth * 0.025 }, { x: () => (k % 2 ? 1 : -1) * window.innerWidth * 0.025, ease: 'none', scrollTrigger: { trigger: list, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } }));
  gsap.from('.proyectos__more .pill', { autoAlpha: 0, y: 16, duration: 1, ease: EASE_OUT, scrollTrigger: { trigger: '.proyectos__more', start: 'top 92%' } });

  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const xTo = gsap.quickTo(poster, 'x', { duration: 0.65, ease: 'power3' });
  const yTo = gsap.quickTo(poster, 'y', { duration: 0.65, ease: 'power3' });
  // recorta la copia blanca de cada texto al rectángulo de la foto, cuadro a cuadro
  const texts = $$('.plist__nr, .plist__name', sec);
  let clipping = false;
  const clip = () => {
    const pr = poster.getBoundingClientRect();
    texts.forEach((el) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--ct', Math.max(0, pr.top - r.top) + 'px');
      el.style.setProperty('--cb', Math.max(0, r.bottom - pr.bottom) + 'px');
      el.style.setProperty('--cl', Math.max(0, pr.left - r.left) + 'px');
      el.style.setProperty('--cr', Math.max(0, r.right - pr.right) + 'px');
      if (pr.width < 2 || pr.top > r.bottom || pr.bottom < r.top || pr.left > r.right || pr.right < r.left) el.style.setProperty('--ct', '100%');
    });
  };
  const startClip = () => { if (!clipping) { clipping = true; gsap.ticker.add(clip); } };
  const stopClip = () => { clipping = false; gsap.ticker.remove(clip); texts.forEach((el) => el.style.setProperty('--ct', '100%')); };
  let cur = -1, lastX = 0;
  sec.addEventListener('pointermove', (e) => {
    const r = sec.getBoundingClientRect();
    xTo(e.clientX - r.left - poster.offsetWidth / 2);
    yTo(e.clientY - r.top - poster.offsetHeight / 2);
  });
  const show = (i) => {
    if (i === cur) return;
    const prev = cur; cur = i;
    capName.textContent = links[i].querySelector('.plist__name').textContent;
    capMeta.textContent = metas[i];
    gsap.to(poster, { opacity: 1, scale: 1, duration: 0.55, ease: 'power3.out', overwrite: 'auto' });
    imgs.forEach((im, j) => gsap.set(im, { zIndex: j === i ? 2 : j === prev ? 1 : 0 }));
    gsap.fromTo(imgs[i], { opacity: 1, clipPath: 'inset(100% 0% 0% 0%)', scale: 1.15 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 0.7, ease: 'power3.out', overwrite: true });
  };
  links.forEach((a, i) => a.addEventListener('pointerenter', () => { startClip(); show(i); }));
  list.addEventListener('pointerleave', () => { cur = -1; gsap.to(poster, { opacity: 0, scale: 0.6, duration: 0.4, ease: 'power3.in', overwrite: 'auto', onComplete: () => { if (cur === -1) stopClip(); } }); });
}

// ---------- 07 Empresa: contadores suaves ----------
function initEmpresa() {
  if (!$('.empresa')) return;
  gsap.from('.empresa__rule', { scaleX: 0, duration: 1.4, ease: 'power3.inOut', scrollTrigger: { trigger: '.empresa__rule', start: 'top 85%' } });
  const counts = $$('.count');
  counts.forEach((el, k) => {
    const to = +el.dataset.to, o = { v: 0 };
    el.textContent = '0';
    gsap.to(o, { v: to, duration: 3.2, delay: k * 0.15, ease: 'sine.inOut', onUpdate: () => (el.textContent = Math.round(o.v)), scrollTrigger: { trigger: '.stats', start: 'top 80%' } });
  });
  gsap.from('.stat', { y: 40, autoAlpha: 0, duration: 1.2, stagger: 0.12, ease: EASE_OUT, scrollTrigger: { trigger: '.stats', start: 'top 80%' } });
  const words = new SplitText('.stat__words', { type: 'lines', mask: 'lines' });
  gsap.from(words.lines, { yPercent: 140, duration: 1.2, stagger: 0.12, delay: 0.5, ease: EASE_OUT, scrollTrigger: { trigger: '.stats', start: 'top 80%' } });
}

// ---------- 08 Tira: ABERTURAS · DE MADERA, de izquierda a derecha sin fin ----------
// ---------- Footer: entra con parallax (el contenido sube desde abajo), columnas en cascada y el logo grande se revela ----------
// el logo del footer se dibuja como si se escribiera (igual que el de "Cada obra tiene su puerta"):
// una máscara recorre las líneas centrales de la hoja, de MARETICH y de "aberturas de madera"
function drawFooterLogo() {
  const svg = $('.footer__logo svg');
  const ST = window.LOGO_STROKES;
  if (!svg || !ST) return;
  const NS = 'http://www.w3.org/2000/svg';
  const paths = $$('path', svg);
  const vb = svg.viewBox.baseVal;
  const mask = document.createElementNS(NS, 'mask');
  mask.setAttribute('id', 'footDraw'); mask.setAttribute('maskUnits', 'userSpaceOnUse');
  mask.setAttribute('x', vb.x - 5); mask.setAttribute('y', vb.y - 5); mask.setAttribute('width', vb.width + 10); mask.setAttribute('height', vb.height + 10);
  const pens = ST.map(([d, w]) => {
    const m = document.createElementNS(NS, 'path');
    m.setAttribute('d', d); m.setAttribute('fill', 'none'); m.setAttribute('stroke', '#fff'); m.setAttribute('stroke-width', w);
    m.setAttribute('stroke-linecap', 'round'); m.setAttribute('stroke-linejoin', 'round');
    mask.appendChild(m); return m;
  });
  const fills = paths.map((p) => { const f = p.cloneNode(); f.removeAttribute('fill-opacity'); f.setAttribute('fill', '#fff'); f.setAttribute('opacity', '0'); mask.appendChild(f); return f; });
  let defs = $('defs', svg); if (!defs) { defs = document.createElementNS(NS, 'defs'); svg.prepend(defs); }
  defs.appendChild(mask);
  const g = document.createElementNS(NS, 'g'); g.setAttribute('mask', 'url(#footDraw)');
  paths.forEach((p) => g.appendChild(p)); svg.appendChild(g);
  const lens = pens.map((m) => m.getTotalLength());
  const total = lens.reduce((s, l) => s + l, 0);
  const st = { p: 0 };
  const render = () => {
    let left = st.p * total;
    pens.forEach((m, i) => {
      const d = Math.max(0, Math.min(lens[i], left)); left -= lens[i];
      m.setAttribute('stroke-dasharray', `${d} ${lens[i] + 10}`);
      m.style.visibility = d > 0.01 ? 'visible' : 'hidden';
    });
  };
  render();
  // al llegar al fondo, la página se queda quieta tal como está (el footer en su tamaño, lo de arriba a la vista)
  // y en 3 scrolls más el logo se termina de dibujar. Un espacio extra al final da el recorrido; mientras se recorre,
  // todo el contenido baja exactamente lo que sube el scroll, así nada se mueve
  const spacer = document.createElement('div');
  spacer.className = 'end-spacer'; spacer.setAttribute('aria-hidden', 'true');
  $('.footer').after(spacer);
  const content = [$('main'), $('.footer')];
  gsap.fromTo(content, { y: 0 }, { y: () => spacer.offsetHeight, ease: 'none', scrollTrigger: { trigger: spacer, start: 'top bottom', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true } });
  gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: spacer, start: 'top bottom', end: 'bottom bottom', scrub: 0.5, invalidateOnRefresh: true } })
    .to(st, { p: 1, duration: 1, onUpdate: render })
    .to(fills, { attr: { opacity: 1 }, duration: 0.05 }, 0.96);
}

function initFooter() {
  const f = $('.footer');
  if (!f) return;
  gsap.fromTo('.footer__inner', { yPercent: -28 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom bottom', scrub: true } });
  gsap.fromTo('.footer__quick a, .footer__contact', { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.07, ease: EASE_OUT, scrollTrigger: { trigger: f, start: 'top 70%', once: true } });
    drawFooterLogo();
  const up = $('.footer__up');
  if (up) up.addEventListener('click', () => { const sm = ScrollSmoother.get(); if (sm) sm.scrollTo(0, true); else window.scrollTo({ top: 0, behavior: 'smooth' }); });
}

function initTexts() {
  $$('[data-lines]').forEach((el) => {
    const s = new SplitText(el, { type: 'lines', mask: 'lines' });
    gsap.from(s.lines, { yPercent: 140, duration: 1.3, stagger: 0.1, ease: EASE_OUT, scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
  $$('[data-reveal]').forEach((el) => gsap.from(el, { autoAlpha: 0, y: 14, duration: 1, ease: EASE_OUT, scrollTrigger: { trigger: el, start: 'top 90%' } }));
  initFooter();
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
  initTexts();
  initNav();
  ScrollTrigger.refresh();
  playIntro();
})();
})();
