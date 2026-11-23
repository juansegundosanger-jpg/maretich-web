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
  const title = new SplitText('.lm-hero__title', { type: 'lines', mask: 'lines' });
  const tl = gsap.timeline({ delay: 0.15 });
  tl.from(title.lines, { yPercent: 120, duration: 1.4, ease: 'casa' })
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
  // dos capas del mismo texto: blanca sobre la foto y marrón fuera de ella, cortadas justo en el borde de la imagen
  const txt = title.textContent.trim();
  title.innerHTML = `<span class="t-base">${txt}</span><span class="t-ghost" aria-hidden="true">${txt}</span>`;
  const base = $('.t-base', title), ghost = $('.t-ghost', title);
  const docTop = (el) => el.getBoundingClientRect().top + (smoother ? smoother.scrollTop() : window.scrollY);
  // la palabra queda quieta a media pantalla, con el tamaño y la posición del título, hasta que llega a su lugar
  let S = 0;
  const calc = () => { S = Math.max(0, docTop(title) - (window.innerHeight / 2 - title.offsetHeight / 2) - (gsap.getProperty(title, 'y') || 0)); };
  const split = () => {
    const edge = intro.getBoundingClientRect().bottom;
    const r = title.getBoundingClientRect();
    const white = Math.max(0, Math.min(r.height, edge - r.top));
    ghost.style.clipPath = `inset(0 0 ${r.height - white}px 0)`;
    base.style.clipPath = `inset(${white}px 0 0 0)`;
  };
  calc();
  gsap.set(title, { y: -S });
  document.body.classList.remove('js-wait');
  ScrollTrigger.create({
    start: 0, end: () => S, invalidateOnRefresh: true,
    onRefreshInit: () => { gsap.set(title, { y: 0 }); calc(); },
    onRefresh: (st) => { gsap.set(title, { y: Math.min(0, st.scroll() - S) }); split(); },
    onUpdate: (st) => { gsap.set(title, { y: Math.min(0, st.scroll() - S) }); split(); },
  });
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: split });
  split();
  // la foto se queda atrás: se mueve más lento que la página
  gsap.fromTo($('img', intro), { yPercent: 0, scale: 1.04 }, { yPercent: 28, scale: 1.1, ease: 'none', scrollTrigger: { trigger: intro, start: 'top top', end: 'bottom top', scrub: true } });
  // el camino de migas aparece recién cuando la palabra llegó, para que no se crucen
  gsap.fromTo('.lm-hero__crumb', { autoAlpha: 0 }, { autoAlpha: 1, ease: 'none', scrollTrigger: { start: () => S, end: () => S + 90, scrub: true, invalidateOnRefresh: true } });
  // entrada al cargar, como la del inicio: "Interior" aparece al medio sobre el nogal, se va hacia la izquierda
  // hasta su lugar y, en el hueco que deja, la foto se abre desde el centro
  const media = $('.lm-intro__media', intro);
  const r = title.getBoundingClientRect();
  const x0 = window.innerWidth / 2 - r.width / 2 - r.left;
  if (smoother) smoother.paused(true);
  gsap.set(title, { x: x0 });
  gsap.set(media, { scale: 0, borderRadius: 2000, opacity: 0 });
  gsap.set('.nav', { autoAlpha: 0 });
  gsap.timeline({ onComplete: () => { if (smoother) smoother.paused(false); ScrollTrigger.refresh(); } })
    .fromTo(title, { autoAlpha: 0, filter: 'blur(4px)' }, { autoAlpha: 1, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out', clearProps: 'filter' }, 0.1)
    .fromTo(base.parentNode, { yPercent: 30 }, { yPercent: 0, duration: 1.1, ease: 'power3.out' }, 0.1)
    .to(title, { x: 0, duration: 1.6, ease: 'casa' }, 1.5)
    .to(media, { scale: 1, borderRadius: 0, opacity: 1, duration: 1.6, ease: 'casa' }, 1.5)
    .to('.nav', { autoAlpha: 1, duration: 0.9, ease: 'power2.out', clearProps: 'opacity,visibility' }, 2.8);
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
    const DUR = 1.15, EASE = 'power3.inOut';
    const items = () => [$('.fd__stage', fd), ...$$('.fd__info > *', fd)];
    const close = (instant) => {
      if (!card.classList.contains('is-open')) return;
      const w1 = card.offsetWidth, h1 = card.offsetHeight;
      card.classList.remove('is-open'); fd.setAttribute('aria-hidden', 'true'); media.setAttribute('aria-expanded', 'false');
      if (instant === true) { gsap.set(card, { clearProps: 'width,height' }); return; }
      const w0 = card.offsetWidth, h0 = card.offsetHeight;
      gsap.fromTo(card, { width: w1, height: h1 }, { width: w0, height: h0, duration: 0.9, ease: EASE, clearProps: 'width,height', onComplete: later });
      gsap.from([media, $('.feat__name', card), $('.feat__txt', card), $('.feat__cta', card)], { autoAlpha: 0, duration: 0.6, delay: 0.3, ease: 'power2.out' });
    };
    const open = () => {
      // si había otra abierta, se cierra al instante para que las medidas sean las finales
      $$('.feat.is-open').forEach((o) => o !== card && o._close && o._close(true));
      gsap.killTweensOf([card, strip]);
      const w0 = card.offsetWidth, h0 = card.offsetHeight;
      card.classList.add('is-open'); fd.setAttribute('aria-hidden', 'false'); media.setAttribute('aria-expanded', 'true');
      const w1 = card.offsetWidth, h1 = card.offsetHeight;
      // destino horizontal: la tarjeta abierta queda centrada en la tira
      const maxL = strip.scrollWidth - strip.clientWidth;
      const left = Math.max(0, Math.min(maxL, card.offsetLeft + w1 / 2 - strip.clientWidth / 2));
      gsap.fromTo(card, { width: w0, height: h0 }, { width: w1, height: h1, duration: DUR, ease: EASE, clearProps: 'width,height', onComplete: later });
      gsap.to(strip, { scrollLeft: left, duration: DUR, ease: EASE });
      gsap.fromTo(items(), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.05, ease: 'power3.out', delay: 0.35 });
      // destino vertical: la tarjeta queda al medio de la pantalla
      if (smoother) {
        const top = smoother.offset(card, 'top top') - Math.max(70, (window.innerHeight - h1) / 2);
        gsap.to(smoother, { scrollTop: Math.max(0, top), duration: DUR, ease: EASE });
      }
    };
    card._close = close;
    media.addEventListener('click', open);
    $('.fd__close', fd).addEventListener('click', () => close());
  });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.feat.is-open .fd__close').forEach((b) => b.click()); });
}

// cambia el color de todas las puertas de la materialidad. Cada puerta trae un mapa (assets/img/int/map) que dice
// qué parte es material (laca o madera) y cuánta sombra tiene cada punto: vidrios, herrajes y cerraduras no cambian.
// Las maderas usan una plancha del tamaño de una puerta (85 x 210 cm) con tablas y veta en escala real.
function initTint() {
  const cache = new WeakMap();
  const sheets = {};
  const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const pixels = (img, w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, w, h); return x.getImageData(0, 0, w, h).data; };
  const prep = async (img) => {
    if (cache.has(img)) return cache.get(img);
    if (!img.complete || !img.naturalWidth) await new Promise((r) => img.addEventListener('load', r, { once: true }));
    const w = img.naturalWidth, h = img.naturalHeight;
    const map = await loadImg(img.getAttribute('src').replace('/int/', '/int/map/'));
    const out = document.createElement('canvas'); out.width = w; out.height = h;
    img.parentNode.appendChild(out);
    const d = { w, h, src: pixels(img, w, h), map: pixels(map, w, h), out };
    cache.set(img, d);
    return d;
  };
  const sheet = async (url, w, h) => {
    const key = url + w + 'x' + h;
    if (!sheets[key]) sheets[key] = loadImg(url).then((t) => pixels(t, w, h));
    return sheets[key];
  };
  const hex = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const paint = async (img, opt) => {
    const { w, h, src, map, out } = await prep(img);
    const tex = opt.tex ? await sheet(opt.tex, w, h) : null;
    const col = opt.color ? hex(opt.color) : null;
    let lum;
    if (col) lum = (0.299 * col[0] + 0.587 * col[1] + 0.114 * col[2]) / 255;
    else { let s = 0, n = 0; for (let i = 0; i < tex.length; i += 64) { s += 0.299 * tex[i] + 0.587 * tex[i + 1] + 0.114 * tex[i + 2]; n++; } lum = s / n / 255; }
    // en terminaciones oscuras se marcan más las molduras para que no se pierdan
    const gain = lum < 0.3 ? 2.4 : 1.1;
    const x = out.getContext('2d');
    const o = x.createImageData(w, h); const od = o.data;
    for (let i = 0; i < od.length; i += 4) {
      const a = src[i + 3]; if (!a) continue;
      const m = map[i + 1] / 255, sh = map[i] / 127.5;
      let f = 1 + (sh - 1) * gain; if (f < 0.05) f = 0.05;
      const hi = sh > 1 ? (sh - 1) * 60 : 0;
      const r = col ? col[0] : tex[i], g = col ? col[1] : tex[i + 1], b = col ? col[2] : tex[i + 2];
      od[i] = src[i] * (1 - m) + (r * f + hi) * m;
      od[i + 1] = src[i + 1] * (1 - m) + (g * f + hi) * m;
      od[i + 2] = src[i + 2] * (1 - m) + (b * f + hi) * m;
      od[i + 3] = a;
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
      for (let k = 0; k < imgs.length; k += 6) {
        if (btn.getAttribute('aria-pressed') !== 'true') return;
        await Promise.all(imgs.slice(k, k + 6).map((i) => paint(i, opt)));
        await new Promise((r) => requestAnimationFrame(r));
      }
    }));
  });
}

// "Ver los N modelos" y panel de terminaciones que acompaña el scroll al costado de la grilla
function initModelsGrid() {
  const wide = window.matchMedia('(min-width: 1101px)');
  $$('.mat__grid').forEach((grid) => {
    const doors = $('.doors', grid);
    const panel = $('.fin__panel', grid);
    const more = $('.doors__more', grid);
    if (more) more.addEventListener('click', () => {
      const all = doors.classList.toggle('is-all');
      more.setAttribute('aria-expanded', all);
      $('.doors__more-t', more).textContent = all ? 'Ver menos' : `Ver los ${doors.children.length} modelos`;
      if (all) gsap.fromTo($$('.door:nth-child(n+11)', doors), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.025, ease: EASE_OUT, clearProps: 'transform' });
      else if (smoother) smoother.scrollTo(grid, true, 'top 100px');
      ScrollTrigger.refresh();
    });
    // el panel queda fijo mientras se recorre la grilla (solo en pantallas anchas, con la grilla más alta que el panel)
    if (wide.matches) ScrollTrigger.create({
      trigger: grid, start: 'top 100px', end: () => '+=' + Math.max(0, grid.offsetHeight - panel.offsetHeight),
      pin: panel, pinSpacing: false, invalidateOnRefresh: true,
    });
  });
}

function initCatalog() {
  const mats = $$('.mat');
  if (!mats.length) return;
  $$('[data-drag]').forEach(initDrag);
  initFeatured();
  initTint();
  initModelsGrid();
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
  // el logo se dibuja mientras el footer sube y termina justo al llegar al fondo de la página
  gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { start: () => ScrollTrigger.maxScroll(window) - window.innerHeight * 0.85, end: 'max', scrub: 0.6, invalidateOnRefresh: true } })
    .to(st, { p: 1, duration: 1, onUpdate: render })
    .to(fills, { attr: { opacity: 1 }, duration: 0.05 }, 0.96);
}

function initFooter() {
  const f = $('.footer');
  if (!f) return;
  if (!reduce) {
    gsap.fromTo('.footer__inner', { yPercent: -28 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom bottom', scrub: true } });
    gsap.fromTo('.footer__quick a, .footer__contact', { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.07, ease: EASE_OUT, scrollTrigger: { trigger: f, start: 'top 70%', once: true } });
    drawFooterLogo();
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
