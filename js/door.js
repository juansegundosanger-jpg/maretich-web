// Puerta 3D de Maretich: three.js, sin modelos externos.
// - setReveal(p): 0 = puerta de frente (coincide con la foto), 1 = presentada en 3/4
// - Al pasar el cursor por encima gira para verla de todos lados; arrastrar también la gira.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';

const W = 0.9, H = 2.1, D = 0.055;          // hoja en metros
const FRAME = 0.07, FRAME_D = 0.13;           // marco

export function createDoor(canvas, { texture = 'assets/img/door-photo.jpg' } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 0, 6.2);

  // Luces: clave cálida desde la izquierda, relleno frío suave
  const key = new THREE.DirectionalLight(0xfff1e0, 2.4);
  key.position.set(-3, 3.5, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -2; key.shadow.camera.right = 2; key.shadow.camera.top = 2; key.shadow.camera.bottom = -2;
  key.shadow.radius = 6;
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0xf2efe8, 0x38261c, 0.6));

  // ---------- Materiales ----------
  const loader = new THREE.TextureLoader();
  const faceTex = loader.load(texture, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; });
  faceTex.colorSpace = THREE.SRGBColorSpace;
  const edgeTex = makeGrainTexture();

  const face = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.62, metalness: 0 });
  const edge = new THREE.MeshStandardMaterial({ map: edgeTex, color: 0x8a6243, roughness: 0.7 });
  const frameMat = new THREE.MeshStandardMaterial({ map: edgeTex, color: 0x5a3d2a, roughness: 0.65 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x1d1a18, roughness: 0.32, metalness: 0.85 });

  // ---------- Geometría ----------
  const pivot = new THREE.Group();       // gira todo el conjunto
  scene.add(pivot);
  const door = new THREE.Group();
  pivot.add(door);

  // BoxGeometry: orden de caras +x,-x,+y,-y,+z,-z
  const slab = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), [edge, edge, edge, edge, face, face]);
  slab.castShadow = true; slab.receiveShadow = true;
  // espejar la cara trasera para que la veta no quede invertida
  const uv = slab.geometry.attributes.uv;
  for (let i = 20; i < 24; i++) uv.setX(i, 1 - uv.getX(i));
  door.add(slab);

  // Marco
  const frame = new THREE.Group();
  const jambL = new THREE.Mesh(new THREE.BoxGeometry(FRAME, H + FRAME, FRAME_D), frameMat);
  jambL.position.set(-(W / 2 + FRAME / 2 + 0.004), FRAME / 2, 0);
  const jambR = jambL.clone(); jambR.position.x *= -1;
  const head = new THREE.Mesh(new THREE.BoxGeometry(W + FRAME * 2 + 0.008, FRAME, FRAME_D), frameMat);
  head.position.set(0, H / 2 + FRAME / 2 + 0.004, 0);
  [jambL, jambR, head].forEach((m) => { m.castShadow = true; m.receiveShadow = true; frame.add(m); });
  door.add(frame);

  // Manija tipo palanca, de ambos lados
  const makeHandle = (side) => {
    const g = new THREE.Group();
    const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.012, 32), metal);
    rose.rotation.x = Math.PI / 2;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.05, 16), metal);
    neck.rotation.x = Math.PI / 2; neck.position.z = 0.03;
    const lever = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.016, 0.016), metal);
    lever.position.set(-0.058, 0, 0.055);
    g.add(rose, neck, lever);
    g.position.set(W / 2 - 0.08, -0.06, side * (D / 2 + 0.006));
    if (side < 0) g.rotation.y = Math.PI;
    g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    return g;
  };
  door.add(makeHandle(1), makeHandle(-1));

  // Sombra de contacto en el piso
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.ShadowMaterial({ opacity: 0.18 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -H / 2 - 0.001;
  floor.receiveShadow = true;
  door.add(floor);

  // ---------- Estado ----------
  let reveal = 0;               // 0..1, lo maneja el scroll
  let live = false;             // interacción habilitada
  const pointer = { x: 0, y: 0, inside: false };
  const drag = { on: false, startX: 0, base: 0, offset: 0 };
  const rot = { x: 0, y: 0 };   // valor suavizado
  let layoutX = 0.9;            // desplazamiento lateral del conjunto
  let visible = false;

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const narrow = w < 900;
    layoutX = narrow ? 0 : Math.min(1.25, camera.aspect * 0.62);
    pivot.position.set(layoutX, narrow ? 0.35 : 0, 0);
    pivot.scale.setScalar(narrow ? 0.78 : 1);
  }

  // Interacción: el cursor sobre la puerta la hace girar de -180° a 180°
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
    pointer.inside = true;
    if (drag.on) drag.offset = drag.base + (e.clientX - drag.startX) * 0.012;
  };
  const onLeave = () => { pointer.inside = false; };
  const onDown = (e) => { if (!live) return; drag.on = true; drag.startX = e.clientX; drag.base = drag.offset; canvas.setPointerCapture(e.pointerId); };
  const onUp = (e) => { drag.on = false; try { canvas.releasePointerCapture(e.pointerId); } catch (_) {} };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);

  let lastT = performance.now(), elapsed = 0;
  function tick() {
    const now = performance.now(); const dt = Math.min((now - lastT) / 1000, 0.05); lastT = now; elapsed += dt;
    if (visible) {
      const ease = 1 - Math.pow(0.0015, dt);   // suavizado independiente del framerate
      // pose base guiada por el scroll
      const baseY = -0.55 * reveal + Math.sin(elapsed * 0.4) * 0.05 * reveal;
      const baseX = 0.06 * reveal;
      let ty = baseY + drag.offset, tx = baseX;
      if (live && pointer.inside && !drag.on && window.matchMedia('(hover: hover)').matches) {
        // de punta a punta del lienzo la puerta da media vuelta para cada lado
        ty = pointer.x * Math.PI + drag.offset;
        tx = pointer.y * 0.35;
      }
      rot.y += (ty - rot.y) * ease;
      rot.x += (tx - rot.x) * ease;
      pivot.rotation.set(rot.x, rot.y, 0);
      renderer.render(scene, camera);
    }
    requestAnimationFrame(tick);
  }

  // Rectángulo en pantalla de la cara frontal sin rotar (para el pase foto → 3D)
  function getScreenRect() {
    const prev = pivot.rotation.clone();
    pivot.rotation.set(0, 0, 0);
    pivot.updateMatrixWorld(true);
    const pts = [[-W / 2, -H / 2], [W / 2, -H / 2], [W / 2, H / 2], [-W / 2, H / 2]].map(([x, y]) => {
      const v = new THREE.Vector3(x, y, D / 2).applyMatrix4(slab.matrixWorld).project(camera);
      return [(v.x + 1) / 2 * canvas.clientWidth, (1 - v.y) / 2 * canvas.clientHeight];
    });
    pivot.rotation.copy(prev);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  requestAnimationFrame(tick);

  return {
    setReveal(p) { reveal = p; },
    setLive(v) { live = v; if (!v) { pointer.inside = false; drag.on = false; } },
    setVisible(v) { visible = v; },
    getScreenRect,
    resize,
  };
}

// Veta de madera procedural para cantos y marco
function makeGrainTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#a07452'; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * c.width;
    const w = 0.6 + Math.random() * 2.4;
    g.strokeStyle = `rgba(${60 + Math.random() * 30},${35 + Math.random() * 20},${20 + Math.random() * 10},${0.08 + Math.random() * 0.22})`;
    g.lineWidth = w;
    g.beginPath();
    let px = x;
    g.moveTo(px, 0);
    for (let y = 0; y <= c.height; y += 32) { px += (Math.random() - 0.5) * 3; g.lineTo(px, y); }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
