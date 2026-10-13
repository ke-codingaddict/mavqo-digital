import * as THREE from "three";

/**
 * Playable 3D scene for the homepage banner: the Mavqo core, five product cards
 * (drag/throw/flip), data-flow pulses and tappable growth bars.
 * Loaded lazily by <HeroScene /> so three.js never blocks the first paint.
 */

export type SceneProduct = {
  key: "school" | "hospital" | "restaurant" | "pos" | "inventory" | string;
  label: string;
  href: string;
  features: string[];
};

export type HintName = "spin" | "throw" | "flip" | "core" | "bars";

export type SceneOptions = {
  products: SceneProduct[];
  reducedMotion: boolean;
  lowPower: boolean;
  onHint: (hint: HintName) => void;
  onOpen: (product: SceneProduct) => void;
};

export type SceneHandle = {
  setPaused: (paused: boolean) => void;
  reset: () => void;
  destroy: () => void;
};

type CardData = {
  product: SceneProduct;
  home: THREE.Vector3;
  vel: THREE.Vector3;
  lift: number;
  phase: number;
  flip: number;
  flipTarget: number;
  wobble: number;
  dragged: boolean;
  pivot: THREE.Group;
  shadow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
};

type PointerState = {
  x: number;
  y: number;
  kind: "spin" | "card" | "core" | "bars";
  card?: THREE.Group;
  lastX: number;
  lastTime: number;
  lastLocal?: THREE.Vector3;
  moved: boolean;
};

const C = { teal: 0x18b6a4, sun: 0xf5b83d, navy: 0x12233f };
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, "Segoe UI", Roboto, Arial, sans-serif';
const LAYOUT: [number, number, number][] = [
  [-3.7, 1.7, 0.6],
  [-2.3, 2.75, -2.1],
  [0, 3.55, -2.9],
  [2.3, 2.75, -2.1],
  [3.7, 1.7, 0.6],
];

export function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function createHeroScene(container: HTMLElement, opts: SceneOptions): SceneHandle {
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(o: T) => (disposables.push(o), o);

  const renderer = new THREE.WebGLRenderer({ antialias: !opts.lowPower, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.lowPower ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  container.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b1a31, 17, 32);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  const camBase = new THREE.Vector3(0.4, 6.2, 14);
  const lookAt = new THREE.Vector3(0, 0.95, -0.4);
  camera.position.copy(camBase);

  // Physically-based light units (three r155+): legacy intensities × π.
  scene.add(new THREE.HemisphereLight(0xcfe9ff, 0x0b1a31, 1.4));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
  keyLight.position.set(5, 10, 7);
  scene.add(keyLight);
  const coreLight = new THREE.PointLight(C.teal, 6, 10, 2);
  coreLight.position.set(0, 2, 0);
  scene.add(coreLight);

  const world = new THREE.Group();
  scene.add(world);

  // ── helpers ────────────────────────────────────────────────
  function roundedRect(w: number, h: number, r: number) {
    const s = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  function slab(w: number, h: number, r: number, depth: number, bevel: number) {
    const g = new THREE.ExtrudeGeometry(roundedRect(w, h, r), {
      depth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 3,
      curveSegments: 10,
    });
    g.center();
    return track(g);
  }
  function canvasTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d")!, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return track(t);
  }
  function rr2d(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function glowTex(rgb: string) {
    return canvasTex(128, 128, (ctx) => {
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, `rgba(${rgb},1)`);
      g.addColorStop(0.35, `rgba(${rgb},0.5)`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    });
  }
  function fitText(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, maxWidth: number) {
    let s = size;
    do {
      ctx.font = `${weight} ${s}px ${FONT}`;
      s -= 1;
    } while (ctx.measureText(text).width > maxWidth && s > 14);
  }
  const mat = <M extends THREE.Material>(m: M) => track(m);

  // ── platform ───────────────────────────────────────────────
  const platform = new THREE.Mesh(slab(9.4, 9.4, 1.3, 0.3, 0.08), mat(new THREE.MeshStandardMaterial({ color: 0x0e1b31, roughness: 0.85, metalness: 0.15 })));
  platform.rotation.x = -Math.PI / 2;
  platform.position.y = -0.2;
  world.add(platform);
  const gridTex = canvasTex(1024, 1024, (ctx, w, h) => {
    rr2d(ctx, 8, 8, w - 16, h - 16, 130);
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = "rgba(24,182,164,0.22)";
    ctx.lineWidth = 2;
    for (let i = 0; i <= w; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }
    ctx.restore();
    rr2d(ctx, 8, 8, w - 16, h - 16, 130);
    ctx.strokeStyle = "rgba(24,182,164,0.85)";
    ctx.lineWidth = 6;
    ctx.stroke();
  });
  const grid = new THREE.Mesh(track(new THREE.PlaneGeometry(9.4, 9.4)), mat(new THREE.MeshBasicMaterial({ map: gridTex, transparent: true, depthWrite: false })));
  grid.rotation.x = -Math.PI / 2;
  world.add(grid);

  const ringGeo = track(new THREE.RingGeometry(0.96, 1, 64));
  const rings = [0, 1, 2].map((i) => {
    const m = new THREE.Mesh(ringGeo, mat(new THREE.MeshBasicMaterial({ color: C.teal, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.02;
    m.userData.phase = i / 3;
    world.add(m);
    return m;
  });

  // ── core: the Mavqo mark ──────────────────────────────────
  const core = new THREE.Group();
  core.position.set(0, 1.55, 0);
  world.add(core);
  core.add(new THREE.Mesh(slab(1.9, 1.9, 0.42, 0.42, 0.06), mat(new THREE.MeshStandardMaterial({ color: C.navy, roughness: 0.35, metalness: 0.4, emissive: 0x0b1a31 }))));
  const mPts = ([[9, 28], [9, 12.5], [20, 22], [31, 12.5], [31, 28]] as const).map(
    ([x, y]) => new THREE.Vector3(((x - 20) / 20) * 0.82, (-(y - 20) / 20) * 0.82, 0.3),
  );
  const mPath = new THREE.CurvePath<THREE.Vector3>();
  for (let i = 0; i < mPts.length - 1; i++) mPath.add(new THREE.LineCurve3(mPts[i], mPts[i + 1]));
  const mMat = mat(new THREE.MeshStandardMaterial({ color: C.teal, emissive: C.teal, emissiveIntensity: 0.55, roughness: 0.3 }));
  core.add(new THREE.Mesh(track(new THREE.TubeGeometry(mPath, 64, 0.09, 10, false)), mMat));
  const sunDot = new THREE.Mesh(track(new THREE.SphereGeometry(0.11, 20, 20)), mat(new THREE.MeshStandardMaterial({ color: C.sun, emissive: C.sun, emissiveIntensity: 0.5 })));
  sunDot.position.set(((31 - 20) / 20) * 0.82, (-(12.5 - 20) / 20) * 0.82, 0.32);
  core.add(sunDot);
  const halo = new THREE.Sprite(mat(new THREE.SpriteMaterial({ map: glowTex("24,182,164"), transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending })));
  halo.scale.set(4.2, 4.2, 1);
  core.add(halo);

  // ── product cards ─────────────────────────────────────────
  const icons: Record<string, (ctx: CanvasRenderingContext2D, x: number, y: number) => void> = {
    school(ctx, x, y) {
      ctx.beginPath();
      ctx.moveTo(x - 26, y - 4);
      ctx.lineTo(x, y - 16);
      ctx.lineTo(x + 26, y - 4);
      ctx.lineTo(x, y + 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(x - 14, y + 2, 28, 12);
      ctx.fillRect(x + 20, y - 4, 3, 18);
    },
    hospital(ctx, x, y) {
      ctx.fillRect(x - 6, y - 20, 12, 40);
      ctx.fillRect(x - 20, y - 6, 40, 12);
    },
    restaurant(ctx, x, y) {
      ctx.fillRect(x - 14, y - 20, 4, 40);
      ctx.fillRect(x - 20, y - 20, 3, 14);
      ctx.fillRect(x - 7, y - 20, 3, 14);
      ctx.beginPath();
      ctx.ellipse(x + 14, y - 8, 7, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + 12, y, 4, 20);
    },
    pos(ctx, x, y) {
      [3, 2, 5, 2, 3, 6, 2, 4, 3].reduce((px, w) => {
        ctx.fillRect(px, y - 18, w, 36);
        return px + w + 3;
      }, x - 22);
    },
    inventory(ctx, x, y) {
      ctx.fillRect(x - 22, y + 2, 20, 18);
      ctx.fillRect(x + 2, y + 2, 20, 18);
      ctx.fillRect(x - 10, y - 20, 20, 18);
    },
  };
  const shadowTex = canvasTex(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(0,0,0,0.55)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });
  const cardBodyGeo = slab(2.0, 1.25, 0.24, 0.1, 0.03);
  const cardFaceGeo = track(new THREE.PlaneGeometry(2.0, 1.25));
  const shadowGeo = track(new THREE.PlaneGeometry(2.4, 1.4));
  const cardBodyMat = mat(new THREE.MeshStandardMaterial({ color: 0xe9eef5, roughness: 0.4, metalness: 0.1 }));

  const cards = opts.products.slice(0, LAYOUT.length).map((p, i) => {
    const face = canvasTex(512, 320, (ctx, w, h) => {
      rr2d(ctx, 0, 0, w, h, 44);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      rr2d(ctx, 36, 36, 104, 104, 28);
      ctx.fillStyle = "#e2f4f0";
      ctx.fill();
      ctx.fillStyle = "#0a7569";
      (icons[p.key] ?? icons.inventory)(ctx, 88, 88);
      ctx.fillStyle = "#0f1e36";
      fitText(ctx, p.label, 700, 46, w - 72);
      ctx.fillText(p.label, 36, 214);
      ctx.fillStyle = "#18b6a4";
      ctx.beginPath();
      ctx.arc(46, 260, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#667085";
      ctx.font = `600 28px ${FONT}`;
      ctx.fillText("Live demo available", 64, 270);
    });
    const back = canvasTex(512, 320, (ctx, w, h) => {
      rr2d(ctx, 0, 0, w, h, 44);
      ctx.fillStyle = "#12233f";
      ctx.fill();
      ctx.fillStyle = "#18b6a4";
      fitText(ctx, p.label, 700, 34, w - 72);
      ctx.fillText(p.label, 36, 70);
      p.features.slice(0, 3).forEach((f, k) => {
        ctx.fillStyle = "#18b6a4";
        ctx.font = `600 30px ${FONT}`;
        ctx.fillText("✓", 36, 128 + k * 46);
        ctx.fillStyle = "#ffffff";
        fitText(ctx, f, 500, 30, w - 110);
        ctx.fillText(f, 74, 128 + k * 46);
      });
      rr2d(ctx, 36, 252, 260, 44, 22);
      ctx.fillStyle = "#f5b83d";
      ctx.fill();
      ctx.fillStyle = "#12233f";
      ctx.font = `700 24px ${FONT}`;
      ctx.fillText("Tap again to open →", 54, 282);
    });
    const group = new THREE.Group();
    const pivot = new THREE.Group();
    group.add(pivot);
    const front = new THREE.Mesh(cardFaceGeo, mat(new THREE.MeshBasicMaterial({ map: face, transparent: true })));
    front.position.z = 0.09;
    const backFace = new THREE.Mesh(cardFaceGeo, mat(new THREE.MeshBasicMaterial({ map: back, transparent: true })));
    backFace.position.z = -0.09;
    backFace.rotation.y = Math.PI;
    pivot.add(new THREE.Mesh(cardBodyGeo, cardBodyMat), front, backFace);
    const home = new THREE.Vector3(...LAYOUT[i]);
    group.position.copy(home);
    const shadow = new THREE.Mesh(shadowGeo, mat(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })));
    shadow.rotation.x = -Math.PI / 2;
    world.add(shadow);
    const data: CardData = { product: p, home, vel: new THREE.Vector3(), lift: 0, phase: i * 1.3, flip: 0, flipTarget: 0, wobble: 0, dragged: false, pivot, shadow };
    group.userData = data;
    world.add(group);
    return group;
  });
  const cardData = (c: THREE.Object3D) => c.userData as CardData;

  // ── data flow lines + travelling pulses ───────────────────
  const flowMat = mat(new THREE.LineBasicMaterial({ color: C.teal, transparent: true, opacity: 0.35 }));
  const pulseGeo = track(new THREE.SphereGeometry(0.065, 12, 12));
  const flows = cards.map((card, i) => {
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3());
    const lineGeo = track(new THREE.BufferGeometry().setFromPoints(new Array(40).fill(0).map(() => new THREE.Vector3())));
    const line = new THREE.Line(lineGeo, flowMat);
    world.add(line);
    const pulses = [0, 1, 2].map((k) => {
      const m = new THREE.Mesh(pulseGeo, mat(new THREE.MeshBasicMaterial({ color: k === 1 ? C.sun : C.teal, transparent: true })));
      m.userData = { t: (k / 3 + i * 0.17) % 1, dir: k === 1 ? -1 : 1 };
      world.add(m);
      return m;
    });
    return { card, curve, line, pulses };
  });
  const tmpB = new THREE.Vector3();
  function updateFlow(f: (typeof flows)[number]) {
    const a = core.position;
    tmpB.copy(f.card.position);
    tmpB.y -= 0.62;
    f.curve.v0.copy(a);
    f.curve.v2.copy(tmpB);
    f.curve.v1.set((a.x + tmpB.x) / 2, Math.max(a.y, tmpB.y) + 0.9, (a.z + tmpB.z) / 2);
    f.line.geometry.setFromPoints(f.curve.getPoints(39));
  }

  // ── growth bars ───────────────────────────────────────────
  const bars = new THREE.Group();
  bars.position.set(-2.4, 0, 2.6);
  world.add(bars);
  const barGeo = track(new THREE.BoxGeometry(0.26, 1, 0.26));
  const barHeights = [0.45, 0.7, 0.62, 1.0, 1.25, 1.65];
  const barMeshes = barHeights.map((hgt, i) => {
    const last = i === barHeights.length - 1;
    const m = new THREE.Mesh(barGeo, mat(new THREE.MeshStandardMaterial({ color: last ? C.sun : C.teal, emissive: last ? C.sun : C.teal, emissiveIntensity: 0.25, roughness: 0.4 })));
    m.position.x = i * 0.36 - 0.9;
    m.userData = { h: hgt, boost: 0, cur: hgt };
    bars.add(m);
    return m;
  });

  // ── sparks ────────────────────────────────────────────────
  const sparkTex = glowTex("255,255,255");
  const sparks: THREE.Sprite[] = [];
  function burst(origin: THREE.Vector3, count: number, colors: number[]) {
    for (let i = 0; i < count; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkTex, color: colors[i % colors.length], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      s.position.copy(origin);
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.9 + 0.3, Math.random() - 0.5).normalize();
      s.userData = { vel: dir.multiplyScalar(3 + Math.random() * 3.5), life: 1 };
      s.scale.setScalar(0.32);
      world.add(s);
      sparks.push(s);
    }
  }

  // ── ambient particles ─────────────────────────────────────
  const dustCount = opts.lowPower ? 80 : 220;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 16;
    dustPos[i * 3 + 1] = Math.random() * 7;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 12;
  }
  const dustGeo = track(new THREE.BufferGeometry());
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, mat(new THREE.PointsMaterial({ color: 0x9fe8de, size: 0.045, transparent: true, opacity: 0.6, depthWrite: false })));
  scene.add(dust);

  // ── state & input ─────────────────────────────────────────
  const state = { spinVel: 0, spin: 0, idleFor: 0, coreBurst: 0, coreSpin: 0 };
  const ndc = new THREE.Vector2(-9, -9);
  const parallax = new THREE.Vector2();
  const parallaxTarget = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const dragPlane = new THREE.Plane();
  const hitPoint = new THREE.Vector3();
  const grabOffset = new THREE.Vector3();
  const pickables: THREE.Object3D[] = [...cards, core, bars];
  let pointer: PointerState | null = null;
  let hovered: THREE.Group | null = null;

  function setNdc(e: PointerEvent) {
    const r = container.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }
  function pick(): { kind: "core" | "bars" } | { kind: "card"; card: THREE.Group } | null {
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(pickables, true)[0];
    if (!hit) return null;
    let o: THREE.Object3D | null = hit.object;
    while (o && !pickables.includes(o)) o = o.parent;
    if (o === core) return { kind: "core" };
    if (o === bars) return { kind: "bars" };
    return o ? { kind: "card", card: o as THREE.Group } : null;
  }
  function pointOnDragPlane(out: THREE.Vector3) {
    raycaster.setFromCamera(ndc, camera);
    return raycaster.ray.intersectPlane(dragPlane, out);
  }

  const onDown = (e: PointerEvent) => {
    // Ignore presses on overlay controls (pause/reset) layered over the canvas.
    if (e.button !== 0 || e.target !== renderer.domElement) return;
    setNdc(e);
    const target = pick();
    const now = performance.now();
    pointer = { x: e.clientX, y: e.clientY, kind: target ? target.kind : "spin", card: target && "card" in target ? target.card : undefined, lastX: e.clientX, lastTime: now, moved: false };
    if (pointer.card) {
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      const worldPos = pointer.card.getWorldPosition(new THREE.Vector3());
      dragPlane.setFromNormalAndCoplanarPoint(camDir.negate(), worldPos);
      if (pointOnDragPlane(hitPoint)) grabOffset.copy(worldPos).sub(hitPoint);
      pointer.lastLocal = pointer.card.position.clone();
    }
    container.setPointerCapture(e.pointerId);
    container.dataset.grabbing = "true";
    state.idleFor = 0;
    wake();
  };

  const onMove = (e: PointerEvent) => {
    setNdc(e);
    parallaxTarget.set(ndc.x, ndc.y);
    if (!pointer) {
      wake();
      return;
    }
    const r = container.getBoundingClientRect();
    const dx = e.clientX - pointer.lastX;
    if (Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y) > 6) pointer.moved = true;
    const now = performance.now();
    const dt = Math.max(1, now - pointer.lastTime) / 1000;
    if (pointer.kind === "card" && pointer.card && pointer.moved) {
      const u = cardData(pointer.card);
      if (pointOnDragPlane(hitPoint)) {
        const local = world.worldToLocal(hitPoint.clone().add(grabOffset));
        local.y = Math.max(0.8, Math.min(5, local.y));
        u.vel.copy(local).sub(pointer.lastLocal!).divideScalar(dt).clampLength(0, 22);
        pointer.lastLocal!.copy(local);
        pointer.card.position.copy(local);
        u.dragged = true;
      }
    } else if (pointer.kind !== "card" && pointer.moved) {
      pointer.kind = "spin";
      const delta = (dx / r.width) * 4.2;
      state.spin += delta;
      state.spinVel = delta / dt;
    }
    pointer.lastX = e.clientX;
    pointer.lastTime = now;
  };

  const onUp = () => {
    if (!pointer) return;
    const p = pointer;
    pointer = null;
    delete container.dataset.grabbing;
    if (p.kind === "card" && p.card && cardData(p.card).dragged) {
      const u = cardData(p.card);
      u.dragged = false;
      u.wobble = 1;
      opts.onHint("throw");
      return;
    }
    if (p.moved) {
      if (p.kind === "spin") opts.onHint("spin");
      return;
    }
    if (p.kind === "card" && p.card) {
      const u = cardData(p.card);
      if (u.flipTarget === Math.PI) {
        u.flipTarget = 0;
        opts.onOpen(u.product);
      } else {
        cards.forEach((c) => (cardData(c).flipTarget = 0));
        u.flipTarget = Math.PI;
        opts.onHint("flip");
      }
    } else if (p.kind === "core") {
      state.coreBurst = 1;
      state.coreSpin += Math.PI * 2;
      burst(core.position.clone(), opts.lowPower ? 26 : 46, [0x18b6a4, 0xf5b83d, 0xffffff]);
      opts.onHint("core");
    } else if (p.kind === "bars") {
      barMeshes.forEach((b, i) => (b.userData.boost = Math.min(b.userData.boost + 0.35 + i * 0.06, 1.8)));
      burst(new THREE.Vector3(bars.position.x + 0.9, 2.2, bars.position.z), 14, [0xf5b83d, 0xffffff]);
      opts.onHint("bars");
    }
  };
  const onLeave = () => {
    if (!pointer) parallaxTarget.set(0, 0);
  };

  container.addEventListener("pointerdown", onDown);
  container.addEventListener("pointermove", onMove);
  container.addEventListener("pointerup", onUp);
  container.addEventListener("pointercancel", onUp);
  container.addEventListener("pointerleave", onLeave);

  // ── sizing ────────────────────────────────────────────────
  function resize() {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Narrow (phone) stages: wider lens and a closer camera so the scene fills the frame.
    const narrow = w / h < 1.1;
    camera.fov = narrow ? 46 : 36;
    camBase.z = narrow ? 12.5 : 14;
    camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(() => {
    resize();
    renderer.render(scene, camera);
  });
  resizeObserver.observe(container);
  resize();

  // ── simulation step ───────────────────────────────────────
  let elapsed = 2.2;
  const tmp = new THREE.Vector3();
  function step(dt: number) {
    elapsed += dt;
    const t = elapsed;
    state.idleFor += dt;

    parallax.lerp(parallaxTarget, 0.06);
    camera.position.set(camBase.x + parallax.x * 1.2, camBase.y + parallax.y * 0.7, camBase.z);
    camera.lookAt(lookAt);

    if (!pointer || pointer.kind !== "spin") {
      state.spin += state.spinVel * dt;
      state.spinVel *= Math.pow(0.12, dt);
      if (state.idleFor > 3) state.spin += Math.sin(t * 0.2) * 0.0015;
    }
    world.rotation.y = state.spin;

    state.coreBurst *= Math.pow(0.18, dt);
    core.rotation.y += (state.coreSpin + Math.sin(t * 0.5) * 0.35 - core.rotation.y) * Math.min(1, dt * 4);
    core.position.y = 1.55 + Math.sin(t * 1.2) * 0.08 + state.coreBurst * 0.5;
    core.scale.setScalar(1 + state.coreBurst * 0.25);
    mMat.emissiveIntensity = 0.55 + state.coreBurst * 1.8;
    halo.material.opacity = 0.5 + state.coreBurst * 0.5;
    coreLight.intensity = 5 + Math.sin(t * 2) * 0.8 + state.coreBurst * 12;

    rings.forEach((r) => {
      const p = (t * (0.28 + state.coreBurst * 0.8) + r.userData.phase) % 1;
      const s = 1 + p * 3.6;
      r.scale.set(s, s, 1);
      r.material.opacity = (1 - p) * (0.35 + state.coreBurst * 0.5);
    });

    if (!pointer) {
      const h = pick();
      hovered = h && h.kind === "card" ? h.card : null;
      container.dataset.hover = h ? "true" : "false";
    }

    cards.forEach((c) => {
      const u = cardData(c);
      const isDragged = Boolean(pointer && pointer.card === c && u.dragged);
      u.lift += ((c === hovered && !isDragged ? 1 : 0) - u.lift) * 0.12;
      if (!isDragged) {
        tmp.copy(u.home);
        tmp.y += Math.sin(t * 1.1 + u.phase) * 0.12 + u.lift * 0.3;
        tmp.sub(c.position);
        u.vel.addScaledVector(tmp, 38 * dt);
        u.vel.multiplyScalar(Math.pow(0.035, dt));
        c.position.addScaledVector(u.vel, dt);
      }
      c.scale.setScalar(1 + u.lift * 0.07 + (isDragged ? 0.08 : 0));
      c.getWorldPosition(tmp);
      c.rotation.set(0, Math.atan2(camera.position.x - tmp.x, camera.position.z - tmp.z) - world.rotation.y, 0);
      u.flip += (u.flipTarget - u.flip) * Math.min(1, dt * 7);
      u.wobble *= Math.pow(0.1, dt);
      u.pivot.rotation.y = u.flip;
      u.pivot.rotation.z = THREE.MathUtils.clamp(-u.vel.x * 0.03, -0.5, 0.5) + Math.sin(t * 18) * u.wobble * 0.08;
      u.pivot.rotation.x = THREE.MathUtils.clamp(u.vel.y * 0.02, -0.4, 0.4);
      u.shadow.position.set(c.position.x, 0.03, c.position.z);
      u.shadow.material.opacity = Math.max(0.12, 0.7 - (c.position.y - 1.6) * 0.25);
    });

    const speed = 0.32 + state.coreBurst * 1.6;
    flows.forEach((f) => {
      updateFlow(f);
      f.pulses.forEach((p) => {
        p.userData.t = (p.userData.t + dt * speed * p.userData.dir + 1) % 1;
        p.position.copy(f.curve.getPoint(p.userData.t));
        (p.material as THREE.MeshBasicMaterial).opacity = Math.sin(p.userData.t * Math.PI);
        p.scale.setScalar(1 + state.coreBurst * 0.8);
      });
    });
    flowMat.opacity = 0.35 + state.coreBurst * 0.5;

    barMeshes.forEach((b, i) => {
      const u = b.userData;
      u.boost *= Math.pow(0.55, dt);
      const goal = u.h * (0.88 + 0.12 * Math.sin(t * 1.4 - i * 0.6)) + u.boost;
      u.cur += (goal - u.cur) * Math.min(1, dt * 6);
      b.scale.y = u.cur;
      b.position.y = u.cur / 2;
    });

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      const u = s.userData;
      u.vel.y -= 6 * dt;
      u.vel.multiplyScalar(Math.pow(0.4, dt));
      s.position.addScaledVector(u.vel, dt);
      u.life -= dt * 0.9;
      s.material.opacity = Math.max(0, u.life);
      s.scale.setScalar(0.32 * Math.max(0.2, u.life));
      if (u.life <= 0) {
        world.remove(s);
        s.material.dispose();
        sparks.splice(i, 1);
      }
    }

    const arr = dustGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < dustCount; i++) {
      arr[i * 3 + 1] += dt * (0.12 + state.coreBurst * 0.6);
      if (arr[i * 3 + 1] > 7) arr[i * 3 + 1] = 0;
    }
    dustGeo.attributes.position.needsUpdate = true;
  }

  // ── loop control ──────────────────────────────────────────
  const timer = new THREE.Timer();
  let running = false;
  let visible = true;
  let paused = opts.reducedMotion;
  let raf = 0;
  let sleepAfter = 0;
  let destroyed = false;

  function loop(ts?: number) {
    if (!running || destroyed) return;
    timer.update(ts);
    // Clamp to [0, 50ms]: the first frame after (re)starting can report a tiny negative delta,
    // which would make the card springs explode.
    step(THREE.MathUtils.clamp(timer.getDelta(), 0, 0.05));
    renderer.render(scene, camera);
    // Paused (or reduced motion): only animate while the visitor is interacting.
    if (paused && performance.now() > sleepAfter && !pointer && sparks.length === 0) {
      running = false;
      return;
    }
    raf = requestAnimationFrame(loop);
  }
  function start() {
    if (running || destroyed) return;
    running = true;
    timer.reset();
    raf = requestAnimationFrame(loop);
  }
  function wake() {
    sleepAfter = performance.now() + 2500;
    if (visible && !document.hidden) start();
  }
  function sync() {
    if (visible && !document.hidden && !paused) start();
    else if (!visible || document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    }
  }
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    sync();
  });
  io.observe(container);
  document.addEventListener("visibilitychange", sync);

  // First frame: a settled pose, even when motion is reduced.
  step(0);
  renderer.render(scene, camera);
  sync();

  return {
    setPaused(v) {
      paused = v;
      if (!v) sync();
    },
    reset() {
      state.spin = 0;
      state.spinVel = 0;
      state.coreSpin = Math.round(core.rotation.y / (Math.PI * 2)) * Math.PI * 2;
      cards.forEach((c) => {
        const u = cardData(c);
        u.flipTarget = 0;
        u.vel.set(0, 0, 0);
      });
      barMeshes.forEach((b) => (b.userData.boost = 0));
      wake();
    },
    destroy() {
      destroyed = true;
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      container.removeEventListener("pointerdown", onDown);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerup", onUp);
      container.removeEventListener("pointercancel", onUp);
      container.removeEventListener("pointerleave", onLeave);
      sparks.forEach((s) => s.material.dispose());
      disposables.forEach((d) => d.dispose());
      timer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
