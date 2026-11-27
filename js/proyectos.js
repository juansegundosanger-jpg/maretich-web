// Maretich · Proyectos — GSAP + ScrollTrigger + ScrollSmoother + SplitText
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
const pjStart = new Map(); // inicio de cada proyecto en el scroll (están fijados, así que se calcula aparte)
const goTo = (t, smooth = true) => {
  const y = pjStart.has(t) ? pjStart.get(t)() : null;
  if (y !== null) return smoother ? smoother.scrollTo(y, smooth) : window.scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' });
  return smoother ? smoother.scrollTo(t, smooth, 'top 90px') : t.scrollIntoView({ behavior: 'smooth' });
};
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
}

// ---------- Proyectos: la pantalla queda fija y cada scroll pasa a la obra siguiente ----------
// p va de 0 a N-1: la parte entera es la obra, la fracción es el paso a la siguiente
function initProjects() {
  const sec = $('.pjx');
  if (!sec) return;
  const stage = $('.pjx__stage', sec);
  const bgs = $$('.pjx__bg', sec);
  const rows = $$('.pjx__names li', sec);
  const texts = $$('.pjx__text', sec);
  const N = texts.length;
  const mob = window.matchMedia('(max-width: 900px)');
  const clamp = gsap.utils.clamp(0, 1);
  const shows = bgs.map(slideshow);
  const arrows = $('.pjx__nav', sec);
  $$('.pjx__arrow', sec).forEach((b) => b.addEventListener('click', () => { if (active >= 0) shows[active].go(+b.dataset.dir); }));
  const vh = () => window.innerHeight;
  let active = -1, seen = false, st = null, busy = false, obs = null, lastWheel = 0, swiped = false;

  // nombres: el activo bien grande; el resto, más chico y casi transparente
  const render = (p) => {
    const k = Math.max(0.62, Math.min(1, window.innerWidth / 1440)) * (mob.matches ? 0.78 : 1);
    const big = mob.matches ? 1.2 : 1.75;
    const lim = mob.matches ? 1 : 2;
    rows.forEach((r, i) => {
      const d = i - p, a = Math.abs(d), sg = Math.sign(d);
      const y = sg * (Math.min(a, 1) * 66 + Math.max(a - 1, 0) * 40) * k;
      const sc = big - (big - 1) * Math.min(a, 1);
      const op = a <= 1 ? 1 - 0.78 * a : a <= lim ? 0.22 : Math.max(0, 0.22 * (lim + 0.6 - a) / 0.6);
      r.style.transform = `translate3d(0,${y.toFixed(2)}px,0) scale(${sc.toFixed(4)})`;
      r.style.opacity = op.toFixed(3);
      r.style.pointerEvents = op > 0.15 ? '' : 'none';
    });
    // fondos: la obra siguiente sube desde abajo y se asienta
    bgs.forEach((b, i) => {
      if (!i) return;
      const r = clamp(p - (i - 1));
      b.style.clipPath = `inset(${((1 - r) * 100).toFixed(2)}% 0 0 0)`;
      b.style.transform = `scale(${(1.12 - 0.12 * r).toFixed(4)})`;
      b.style.visibility = r > 0 ? 'visible' : 'hidden';
    });
    setActive(Math.round(p));
  };

  function playActive() {
    if (active < 0 || !seen) return;
    bgs.forEach((b, i) => { const v = $('video', b); if (!v) return; if (i === active) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause(); });
    shows.forEach((s, i) => s[i === active ? 'play' : 'pause']());
  }
  function pauseAll() { bgs.forEach((b) => { const v = $('video', b); if (v) v.pause(); }); shows.forEach((s) => s.pause()); }
  function setActive(k) {
    if (k === active) return;
    const prev = active;
    active = k;
    const nb = $('video', bgs[k + 1] || bgs[k]); if (nb) nb.preload = 'auto';
    $$('img[loading="lazy"]', bgs[k + 1] || bgs[k]).slice(0, 2).forEach((im) => (im.loading = 'eager'));
    if (prev >= 0) {
      const o = texts[prev];
      gsap.to(o, { autoAlpha: 0, y: -14, duration: 0.4, ease: 'power2.in', overwrite: true, onComplete: () => o.classList.remove('is-on') });
      shows[prev].pause();
    }
    const t = texts[k];
    t.classList.add('is-on');
    gsap.killTweensOf(t);
    gsap.set(t, { autoAlpha: 1, y: 0 });
    if (!reduce && prev >= 0) gsap.fromTo(t.children, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.07, ease: EASE_OUT, delay: 0.25, overwrite: true });
    shows[k].reset();
    arrows.classList.toggle('is-off', shows[k].n < 2);
    playActive();
  }

  st = ScrollTrigger.create({
    trigger: sec, start: 'top top+=2', end: () => '+=' + ((N - 1) * vh() + 3), pin: stage, anticipatePin: 1,
    onUpdate: (s) => { render(Math.min(N - 1, (s.scroll() - s.start) / vh())); if (!reduce && obs && !obs.isEnabled && !busy && s.progress > 0.003 && s.progress < 0.997) enter(); },
    onToggle: (s) => { if (!obs) return; if (s.isActive) enter(s.direction > 0 ? 0 : N - 1); else obs.disable(); },
  });
  texts.forEach((t, i) => pjStart.set(t, () => Math.max(0, st.start + 3) + i * vh())); // +1: dentro del tramo fijo, también en la primera
  ScrollTrigger.create({ trigger: sec, start: 'top bottom', end: 'bottom top', onToggle: (s) => { seen = s.isActive; if (seen) playActive(); else pauseAll(); } });

  // un gesto = una obra: mientras la pantalla está fija, la rueda y el dedo no desplazan la página,
  // sólo piden la obra anterior o la siguiente. En la primera y la última, el gesto hacia afuera sale de la sección
  const go = (i) => {
    busy = true;
    goTo(texts[i]);
    gsap.delayedCall(1.3, () => (busy = false));
  };
  const step = (dir) => {
    if (busy) return;
    const cur = Math.round(st.progress * (N - 1));
    const nx = cur + dir;
    if (nx < 0) return; // arriba de la primera obra no hay nada: queda en su lugar
    if (nx > N - 1) {
      // en la última obra, el gesto hacia abajo devuelve el scroll normal y baja hasta ver el footer entero
      obs.disable();
      busy = true; gsap.delayedCall(0.8, () => (busy = false));
      const y = st.end + $('.footer').offsetHeight; // abajo de la última: el footer entero a la vista
      if (smoother) smoother.scrollTo(y, true); else window.scrollTo({ top: y, behavior: 'smooth' });
      return;
    }
    go(nx);
  };
  // la rueda manda un chorro de eventos por gesto (y el trackpad sigue por inercia): sólo cuenta el primero
  // de cada gesto, es decir, el que llega después de un silencio. Con el dedo, uno por toque
  obs = ScrollTrigger.observe({
    target: window, type: 'wheel,touch', tolerance: 8, preventDefault: true,
    onPress: () => { swiped = false; },
    onChange: (self) => {
      const e = self.event;
      const touch = !e.type.startsWith('wheel');
      const dx = self.deltaX, dy = self.deltaY;
      const horiz = Math.abs(dx) > Math.abs(dy) * 1.2;
      if (touch) {
        if (swiped || Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
        swiped = true;
        if (horiz) shows[active].go(dx < 0 ? 1 : -1); else step(dy < 0 ? 1 : -1);
        return;
      }
      // la rueda manda un chorro de eventos por gesto (y el trackpad sigue por inercia): cuenta sólo el primero
      const now = performance.now(), gap = now - lastWheel;
      lastWheel = now;
      if (gap < 200) return;
      if (horiz) shows[active].go(dx > 0 ? 1 : -1); else if (Math.abs(dy) >= 1) step(dy > 0 ? 1 : -1);
    },
  });
  // con el teclado: ↑ ↓ cambian de obra, ← → pasan las fotos
  window.addEventListener('keydown', (e) => {
    if (!obs.isEnabled || e.target.closest('input, textarea')) return;
    const d = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 }[e.key];
    if (d) { e.preventDefault(); step(d); return; }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); shows[active].go(e.key === 'ArrowRight' ? 1 : -1); }
  });
  obs.disable();
  gsap.delayedCall(0.05, () => { if (st.isActive) enter(); }); // la página arranca dentro del tramo fijo
  // al entrar a la sección (desde arriba o desde abajo), se acomoda en la obra más cercana y toma el control
  function enter(to) {
    if (reduce || !obs) return;
    const i = to === undefined ? Math.round(st.progress * (N - 1)) : to;
    // con el scroll suave, la página puede venir con inercia más allá: se compara contra el destino real (scrollY)
    if (Math.abs(window.scrollY - pjStart.get(texts[i])()) > 2) { busy = true; requestAnimationFrame(() => go(i)); }
    lastWheel = performance.now(); // el gesto que trajo hasta acá no cuenta como pedido de la siguiente obra
    obs.enable();
  }

  render(0);
  if (!reduce) {
    gsap.timeline({ delay: 0.2 })
      .from($('.pjx__names ol', sec), { autoAlpha: 0, x: -24, duration: 1.1, ease: EASE_OUT }, 0)
      .from(texts[0].children, { autoAlpha: 0, y: 24, duration: 1.1, stagger: 0.07, ease: EASE_OUT }, 0.25);
  }
  mob.addEventListener('change', () => render(st.progress * (N - 1)));
  window.addEventListener('resize', () => render(st.progress * (N - 1)));
}

// fotos de fondo de cada obra: se funden una en otra y, mientras están, se acercan y se corren apenas,
// como una toma de cámara lenta. Pasan solas y también con las flechas (o deslizando, o con ← →)
function slideshow(bg) {
  const slides = $$('.pjx__ph', bg);
  const HOLD = 5.2, FADE = 1.6;
  let i = 0, timer = null, running = false, drift = null;
  const eager = (img) => { if (img && img.loading === 'lazy') img.loading = 'eager'; };
  const move = (el, n) => {
    if (drift) drift.kill();
    const dx = n % 2 ? -2.2 : 2.2;
    drift = gsap.fromTo(el, { scale: 1.09, xPercent: -dx / 2 }, { scale: 1, xPercent: dx / 2, duration: HOLD + FADE + 1.5, ease: 'sine.out' });
  };
  const schedule = () => {
    if (timer) timer.kill();
    timer = running ? gsap.delayedCall(HOLD + FADE, () => show(i + 1)) : null;
  };
  const show = (n) => {
    const prev = slides[i];
    i = (n + slides.length) % slides.length;
    const cur = slides[i];
    if (cur === prev) return;
    eager(cur); eager(slides[(i + 1) % slides.length]);
    slides.forEach((s) => (s.style.zIndex = s === cur ? 3 : s === prev ? 2 : 1));
    gsap.killTweensOf(cur, 'opacity');
    gsap.fromTo(cur, { opacity: 0 }, { opacity: 1, duration: FADE, ease: 'power2.inOut',
      onComplete: () => slides.forEach((s) => { if (s !== cur) gsap.set(s, { opacity: 0 }); }) });
    move(cur, i);
    schedule();
  };
  return {
    n: slides.length,
    go(d) { if (slides.length > 1) show(i + d); },
    play() { if (slides.length < 2 || reduce || running) return; running = true; eager(slides[1]); if (drift) drift.play(); else move(slides[i], i); schedule(); },
    pause() { running = false; if (timer) timer.kill(); timer = null; if (drift) drift.pause(); },
    reset() {
      if (timer) timer.kill(); timer = null; i = 0;
      slides.forEach((s, j) => { gsap.killTweensOf(s); gsap.set(s, { opacity: j ? 0 : 1, scale: 1.09, xPercent: 0, zIndex: j ? 1 : 3 }); });
      if (drift) drift.kill(); drift = null;
      eager(slides[0]); eager(slides[1]);
      if (running) { move(slides[0], 0); schedule(); }
    },
  };
}

// ---------- Textos y footer (iguales a la home) ----------
function initTexts() {
  if (!reduce) $$('[data-lines]').forEach((el) => {
    const s = new SplitText(el, { type: 'lines', mask: 'lines' });
    gsap.from(s.lines, { yPercent: 140, duration: 1.3, stagger: 0.1, ease: EASE_OUT, scrollTrigger: { trigger: el, start: 'top 85%' } });
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
  initProjects();
  initTexts();
  initFooter();
  initNav();
  ScrollTrigger.refresh();
  // si se llega desde la home con #proyecto, ir directo a ese proyecto
  const t = location.hash && document.querySelector(location.hash);
  if (t) requestAnimationFrame(() => goTo(t, false));
})();
})();
