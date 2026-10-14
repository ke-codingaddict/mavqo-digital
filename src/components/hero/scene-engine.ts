import * as THREE from "three";

/**
 * 3D product dashboard for the homepage banner: a glass app window showing a
 * live dashboard for each Mavqo system (KPIs, an animated chart with hover
 * tooltips, a progress ring and recent activity), with notification cards
 * floating around it. The UI is drawn into canvas textures, so it stays crisp
 * and uses the site's own fonts. Loaded lazily by <HeroScene />, so three.js
 * never blocks the first paint.
 *
 * All figures are illustrative sample data and stay within each product's
 * listed features — no integrations are implied (see src/content/products.ts).
 */

export type SceneProduct = {
  key: "school" | "hospital" | "restaurant" | "pos" | "inventory" | string;
  label: string;
  href: string;
  features: string[];
};

export type SceneOptions = {
  products: SceneProduct[];
  reducedMotion: boolean;
  lowPower: boolean;
  /** Called whenever the dashboard shows another product (auto-cycle or setProduct). */
  onProductChange: (index: number) => void;
};

export type SceneHandle = {
  setPaused: (paused: boolean) => void;
  setProduct: (index: number) => void;
  destroy: () => void;
};

/* ───────────────────────────── Sample dashboards ───────────────────────────── */

type Tone = "green" | "teal" | "sun" | "muted";
type Kpi = { label: string; v: number; dec: number; pre?: string; suf?: string; delta: string; good: boolean; spark: number[]; live?: number };
type Dash = {
  app: string;
  heading: string;
  sub: string;
  kpis: Kpi[];
  chart: { title: string; labels: string[]; cur: number[]; prev: number[]; pre?: string; suf?: string };
  ring: { title: string; pct: number; caption: string; detail: string };
  activity: { who: string; meta: string; amount: string; status: string; tone: Tone }[];
  toasts: { title: string; sub: string; icon: "check" | "bell" | "alert" | "doc"; tone: Tone }[];
  mini: { title: string; value: string; caption: string; bars: number[] };
};

const WEEKS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"];
const HOURS = ["8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm"];
const DAYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

const DASHBOARDS: Record<string, Dash> = {
  school: {
    app: "School Management",
    heading: "Term 3 overview",
    sub: "Sample school · Grades PP1–9",
    kpis: [
      { label: "Learners enrolled", v: 1248, dec: 0, delta: "+3.1%", good: true, spark: [4, 5, 5, 6, 6, 7, 8] },
      { label: "Fees collected", v: 8.42, dec: 2, pre: "KES ", suf: "M", delta: "+12.4%", good: true, spark: [3, 4, 4, 6, 7, 7, 9], live: 0.01 },
      { label: "Attendance today", v: 96.2, dec: 1, suf: "%", delta: "+0.8%", good: true, spark: [7, 6, 7, 8, 7, 8, 8] },
      { label: "Outstanding balances", v: 1.16, dec: 2, pre: "KES ", suf: "M", delta: "−9.3%", good: true, spark: [9, 8, 8, 7, 6, 6, 5] },
    ],
    chart: { title: "Fee payments · this term", labels: WEEKS, cur: [420, 610, 540, 720, 680, 760, 830, 790, 910, 870, 980, 1040], prev: [380, 450, 500, 540, 590, 610, 650, 700, 720, 760, 800, 830], pre: "KES ", suf: "K" },
    ring: { title: "Term fees collected", pct: 0.88, caption: "KES 8.42M of 9.58M", detail: "On track for term close" },
    activity: [
      { who: "Wanjiru A.", meta: "Grade 7 · Term 3 fees", amount: "KES 18,500", status: "Paid", tone: "green" },
      { who: "Grade 9 reports", meta: "212 learners", amount: "", status: "Ready", tone: "teal" },
      { who: "Otieno K.", meta: "Grade 4 · Transport", amount: "KES 6,000", status: "Partial", tone: "sun" },
      { who: "Grade 4 East", meta: "Attendance · 38 of 40", amount: "", status: "Recorded", tone: "muted" },
    ],
    toasts: [
      { title: "Payment recorded", sub: "KES 18,500 · Grade 7 fees", icon: "check", tone: "green" },
      { title: "Progress reports ready", sub: "Grade 9 · 212 learners", icon: "doc", tone: "teal" },
      { title: "Fee reminder sent", sub: "Parents with balances · Grade 6", icon: "bell", tone: "sun" },
    ],
    mini: { title: "Attendance this week", value: "96.2%", caption: "Mon – Fri", bars: [0.92, 0.95, 0.97, 0.94, 0.96] },
  },
  hospital: {
    app: "Hospital Management",
    heading: "Today at the clinic",
    sub: "Sample facility · Outpatients",
    kpis: [
      { label: "Patients today", v: 186, dec: 0, delta: "+6.8%", good: true, spark: [4, 5, 6, 5, 7, 7, 8], live: 1 },
      { label: "Billed today", v: 642, dec: 0, pre: "KES ", suf: "K", delta: "+9.1%", good: true, spark: [3, 4, 5, 5, 6, 7, 8], live: 2 },
      { label: "Average wait", v: 14, dec: 0, suf: " min", delta: "−18%", good: true, spark: [9, 8, 8, 7, 6, 5, 5] },
      { label: "Lab requests", v: 74, dec: 0, delta: "+4.2%", good: true, spark: [5, 5, 6, 6, 7, 6, 7] },
    ],
    chart: { title: "Patient visits · last 12 days", labels: DAYS, cur: [142, 158, 151, 170, 166, 181, 174, 168, 190, 184, 179, 186], prev: [130, 138, 141, 150, 147, 155, 158, 152, 160, 163, 158, 165] },
    ring: { title: "Lab results returned", pct: 0.82, caption: "61 of 74 requests", detail: "Average turnaround 46 min" },
    activity: [
      { who: "Patient #0412", meta: "OPD · Consultation", amount: "KES 2,500", status: "Billed", tone: "green" },
      { who: "Rx #2291", meta: "Pharmacy · 3 items", amount: "KES 1,840", status: "Dispensed", tone: "teal" },
      { who: "Patient #0415", meta: "Lab · Full blood count", amount: "", status: "In progress", tone: "sun" },
      { who: "Patient #0398", meta: "Insurance · Claim billing", amount: "KES 12,300", status: "Prepared", tone: "muted" },
    ],
    toasts: [
      { title: "Lab result ready", sub: "Full blood count · Patient #0412", icon: "doc", tone: "teal" },
      { title: "Queue update", sub: "6 waiting at triage · 9 min avg", icon: "bell", tone: "sun" },
      { title: "Bill settled", sub: "KES 2,500 · Consultation", icon: "check", tone: "green" },
    ],
    mini: { title: "Average wait", value: "14 min", caption: "Down from 17 min", bars: [0.95, 0.8, 0.72, 0.6, 0.55] },
  },
  restaurant: {
    app: "Restaurant Management",
    heading: "Tonight's service",
    sub: "Sample restaurant · 24 tables",
    kpis: [
      { label: "Orders today", v: 312, dec: 0, delta: "+11.2%", good: true, spark: [3, 4, 4, 6, 7, 8, 9], live: 1 },
      { label: "Sales today", v: 486, dec: 0, pre: "KES ", suf: "K", delta: "+8.6%", good: true, spark: [4, 4, 5, 6, 6, 7, 9], live: 2 },
      { label: "Average bill", v: 1560, dec: 0, pre: "KES ", delta: "+3.4%", good: true, spark: [6, 5, 6, 7, 6, 7, 7] },
      { label: "Tables open", v: 9, dec: 0, suf: " / 24", delta: "Live", good: true, spark: [3, 5, 7, 8, 9, 8, 9] },
    ],
    chart: { title: "Sales by hour · today", labels: HOURS, cur: [12, 18, 22, 31, 58, 74, 49, 28, 24, 36, 62, 71], prev: [10, 15, 20, 26, 51, 66, 44, 25, 22, 31, 55, 60], pre: "KES ", suf: "K" },
    ring: { title: "Orders served on time", pct: 0.94, caption: "293 of 312 orders", detail: "Kitchen average 12 min" },
    activity: [
      { who: "Table 12", meta: "Dine-in · 4 items", amount: "KES 3,850", status: "Served", tone: "green" },
      { who: "Takeaway #208", meta: "2 items", amount: "KES 1,200", status: "Preparing", tone: "sun" },
      { who: "Table 5", meta: "Split bill · 3 guests", amount: "KES 6,400", status: "Paid", tone: "teal" },
      { who: "Delivery #091", meta: "5 items", amount: "KES 2,760", status: "Sent", tone: "muted" },
    ],
    toasts: [
      { title: "New order · Table 7", sub: "3 items sent to the kitchen", icon: "bell", tone: "sun" },
      { title: "Bill paid · Table 5", sub: "KES 6,400 · split 3 ways", icon: "check", tone: "green" },
      { title: "Shift closed", sub: "Cash-up balanced · Evening shift", icon: "doc", tone: "teal" },
    ],
    mini: { title: "Kitchen tickets", value: "12 min", caption: "Average prep time", bars: [0.5, 0.7, 0.95, 0.8, 0.6] },
  },
  pos: {
    app: "POS System",
    heading: "Today's sales",
    sub: "Sample shop · 2 tills",
    kpis: [
      { label: "Sales today", v: 228, dec: 0, pre: "KES ", suf: "K", delta: "+7.9%", good: true, spark: [3, 4, 5, 5, 6, 8, 9], live: 1 },
      { label: "Transactions", v: 418, dec: 0, delta: "+5.3%", good: true, spark: [4, 5, 5, 6, 6, 7, 8], live: 1 },
      { label: "Average basket", v: 545, dec: 0, pre: "KES ", delta: "+2.6%", good: true, spark: [5, 6, 5, 6, 7, 6, 7] },
      { label: "Items sold", v: 1902, dec: 0, delta: "+9.8%", good: true, spark: [3, 4, 5, 6, 7, 8, 9], live: 3 },
    ],
    chart: { title: "Sales by hour · today", labels: HOURS, cur: [8, 14, 17, 19, 26, 31, 22, 18, 21, 27, 33, 29], prev: [7, 11, 15, 17, 22, 27, 21, 16, 19, 24, 28, 25], pre: "KES ", suf: "K" },
    ring: { title: "Daily sales target", pct: 0.81, caption: "KES 228K of 280K", detail: "Best hour: 6pm" },
    activity: [
      { who: "Receipt #10482", meta: "Till 1 · 6 items", amount: "KES 1,250", status: "Paid", tone: "green" },
      { who: "Receipt #10481", meta: "Till 2 · 2 items", amount: "KES 340", status: "Paid", tone: "green" },
      { who: "Return #0077", meta: "Till 1 · 1 item", amount: "−KES 180", status: "Approved", tone: "sun" },
      { who: "Sugar 1kg", meta: "Stock updated", amount: "46 left", status: "Synced", tone: "teal" },
    ],
    toasts: [
      { title: "Sale complete", sub: "Receipt #10482 · KES 1,250", icon: "check", tone: "green" },
      { title: "Stock updated", sub: "Sugar 1kg · 46 left", icon: "doc", tone: "teal" },
      { title: "Shift closed · Till 2", sub: "Balanced · 186 sales", icon: "bell", tone: "sun" },
    ],
    mini: { title: "Top category", value: "Groceries", caption: "41% of today's sales", bars: [0.41, 0.22, 0.17, 0.12, 0.08] },
  },
  inventory: {
    app: "Inventory Management",
    heading: "Stock overview",
    sub: "Sample warehouse · 3 stores",
    kpis: [
      { label: "Stock value", v: 12.8, dec: 1, pre: "KES ", suf: "M", delta: "+2.2%", good: true, spark: [6, 6, 7, 6, 7, 7, 8] },
      { label: "Items tracked", v: 2340, dec: 0, delta: "+46", good: true, spark: [5, 5, 6, 6, 6, 7, 7] },
      { label: "Low stock", v: 18, dec: 0, delta: "−6", good: true, spark: [9, 8, 7, 7, 6, 5, 5] },
      { label: "Deliveries due", v: 7, dec: 0, delta: "This week", good: true, spark: [4, 6, 5, 7, 6, 7, 7] },
    ],
    chart: { title: "Goods received · last 12 weeks", labels: WEEKS, cur: [310, 280, 360, 340, 410, 390, 450, 430, 470, 520, 490, 560], prev: [290, 300, 320, 310, 350, 360, 380, 370, 400, 420, 430, 450], suf: " units" },
    ring: { title: "Stock-take accuracy", pct: 0.98, caption: "2,293 of 2,340 items", detail: "Last count: Monday" },
    activity: [
      { who: "PO-1183", meta: "Goods received · 48 items", amount: "KES 214K", status: "Received", tone: "green" },
      { who: "Cooking oil 1L", meta: "Reorder alert · 12 left", amount: "", status: "Low", tone: "sun" },
      { who: "Store 2", meta: "Goods issued · 30 items", amount: "KES 41K", status: "Issued", tone: "teal" },
      { who: "Maize flour 2kg", meta: "Adjustment · damaged", amount: "−4", status: "Logged", tone: "muted" },
    ],
    toasts: [
      { title: "Reorder alert", sub: "Cooking oil 1L · 12 left", icon: "alert", tone: "sun" },
      { title: "Goods received", sub: "PO-1183 · 48 items", icon: "check", tone: "green" },
      { title: "Stock-take complete", sub: "Store 3 · 98% accurate", icon: "doc", tone: "teal" },
    ],
    mini: { title: "Fastest movers", value: "Flour 2kg", caption: "312 units this week", bars: [0.9, 0.74, 0.6, 0.45, 0.3] },
  },
};

/* ───────────────────────────────── Palette ───────────────────────────────── */

const P = {
  teal: "#18b6a4",
  tealSoft: "rgba(24,182,164,0.16)",
  sun: "#f5b83d",
  green: "#3ddc97",
  ink: "#0f1e36",
  white: "#ffffff",
  w70: "rgba(255,255,255,0.72)",
  w50: "rgba(255,255,255,0.5)",
  w30: "rgba(255,255,255,0.3)",
  w10: "rgba(255,255,255,0.08)",
  w05: "rgba(255,255,255,0.045)",
};
const toneColor: Record<Tone, string> = { green: P.green, teal: P.teal, sun: P.sun, muted: "rgba(255,255,255,0.55)" };
const toneWash: Record<Tone, string> = {
  green: "rgba(61,220,151,0.14)",
  teal: "rgba(24,182,164,0.16)",
  sun: "rgba(245,184,61,0.16)",
  muted: "rgba(255,255,255,0.08)",
};
const AVATARS = ["#18b6a4", "#f5b83d", "#7c8cff", "#ff7a90", "#3ddc97"];

export function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/* ──────────────────────────────── 2D helpers ──────────────────────────────── */

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const fmtNum = (n: number, dec: number) => n.toLocaleString("en-KE", { minimumFractionDigits: dec, maximumFractionDigits: dec });

function initials(s: string) {
  const parts = s.replace(/[#\d-]+/g, " ").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return s.replace(/\D/g, "").slice(-2) || "•";
  return ((parts[0][0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/* ─────────────────────────────── The scene ─────────────────────────────── */

export function createHeroScene(container: HTMLElement, opts: SceneOptions): SceneHandle {
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(o: T) => (disposables.push(o), o);
  const font = getComputedStyle(container).fontFamily || "system-ui, sans-serif";
  const F = (weight: number, size: number) => `${weight} ${size}px ${font}`;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.lowPower ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  container.prepend(renderer.domElement);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const lookAt = new THREE.Vector3(0, -0.75, 0);

  scene.add(new THREE.HemisphereLight(0xcfe9ff, 0x0b1a31, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-4, 6, 8);
  scene.add(key);
  const rim = new THREE.PointLight(0x18b6a4, 18, 14, 2);
  rim.position.set(3.5, 1.5, -2.5);
  scene.add(rim);

  /* ── texture & geometry helpers ── */
  function canvasTexture(w: number, h: number) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    const tex = track(new THREE.CanvasTexture(canvas));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso;
    return { canvas, ctx, tex };
  }
  function shape(w: number, h: number, r: number) {
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
  function slab(w: number, h: number, r: number, depth: number) {
    const g = new THREE.ExtrudeGeometry(shape(w, h, r), { depth, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 12 });
    g.center();
    return track(g);
  }
  /** Rounded plane whose UVs span 0–1, so a canvas maps exactly onto it. */
  function face(w: number, h: number, r: number) {
    const g = new THREE.ShapeGeometry(shape(w, h, r), 12);
    const uv = g.attributes.uv;
    const pos = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
    return track(g);
  }
  function glow(rgb: string, size = 256) {
    const { ctx, tex } = canvasTexture(size, size);
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, `rgba(${rgb},0.9)`);
    g.addColorStop(0.4, `rgba(${rgb},0.28)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return tex;
  }
  const mat = <M extends THREE.Material>(m: M) => track(m);

  /* ── rig: everything that tilts with the pointer ── */
  const rig = new THREE.Group();
  rig.position.x = 0.2;
  scene.add(rig);

  // Ambient glows behind the window
  const glowA = new THREE.Sprite(mat(new THREE.SpriteMaterial({ map: glow("24,182,164"), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })));
  glowA.position.set(-0.6, 0.2, -2.2);
  glowA.scale.set(12, 9, 1);
  rig.add(glowA);
  const glowB = new THREE.Sprite(mat(new THREE.SpriteMaterial({ map: glow("245,184,61"), transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending })));
  glowB.position.set(3.2, 2.0, -1.8);
  glowB.scale.set(5, 5, 1);
  rig.add(glowB);

  // Floor: a dotted grid that fades out, plus the window's soft shadow
  {
    const { ctx, tex } = canvasTexture(1024, 1024);
    for (let y = 16; y < 1024; y += 32) {
      for (let x = 16; x < 1024; x += 32) {
        const d = Math.hypot(x - 512, y - 512) / 512;
        const a = Math.max(0, 1 - d) ** 1.6 * 0.55;
        if (a < 0.01) continue;
        ctx.fillStyle = `rgba(120,220,210,${a})`;
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(18, 18)), mat(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false })));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -2.75, -0.5);
    rig.add(floor);
    const sh = canvasTexture(256, 128);
    const g = sh.ctx.createRadialGradient(128, 64, 0, 128, 64, 128);
    g.addColorStop(0, "rgba(0,0,0,0.6)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    sh.ctx.fillStyle = g;
    sh.ctx.fillRect(0, 0, 256, 128);
    const shadow = new THREE.Mesh(track(new THREE.PlaneGeometry(8, 2.6)), mat(new THREE.MeshBasicMaterial({ map: sh.tex, transparent: true, depthWrite: false })));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0.2, -2.72, 0);
    rig.add(shadow);
  }

  /* ── main window ── */
  const WIN_W = 6.6;
  const WIN_H = 4.15;
  const win = new THREE.Group();
  win.position.set(0.15, 0.1, 0);
  win.rotation.set(0.05, -0.26, 0);
  rig.add(win);

  win.add(new THREE.Mesh(slab(WIN_W, WIN_H, 0.2, 0.1), mat(new THREE.MeshStandardMaterial({ color: 0x0a1528, roughness: 0.35, metalness: 0.55 }))));

  // Glowing border just behind the screen
  {
    const { ctx, tex } = canvasTexture(1024, 650);
    const g = ctx.createLinearGradient(0, 0, 1024, 650);
    g.addColorStop(0, "rgba(24,182,164,0.95)");
    g.addColorStop(0.45, "rgba(24,182,164,0.15)");
    g.addColorStop(0.8, "rgba(245,184,61,0.12)");
    g.addColorStop(1, "rgba(245,184,61,0.6)");
    ctx.strokeStyle = g;
    ctx.lineWidth = 5;
    rr(ctx, 6, 6, 1012, 638, 34);
    ctx.stroke();
    const border = new THREE.Mesh(face(WIN_W + 0.05, WIN_H + 0.05, 0.22), mat(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending })));
    border.position.z = 0.072;
    win.add(border);
  }

  const DW = 1600; // dashboard design units
  const DH = Math.round((DW * WIN_H) / WIN_W);
  const dashScale = opts.lowPower ? 0.8 : 1.28;
  const dash = canvasTexture(Math.round(DW * dashScale), Math.round(DH * dashScale));
  const screenMat = mat(new THREE.MeshBasicMaterial({ map: dash.tex, transparent: true, toneMapped: false }));
  const screen = new THREE.Mesh(face(WIN_W, WIN_H, 0.2), screenMat);
  screen.position.z = 0.075;
  win.add(screen);

  /* ── floating cards ── */
  type Floater = { group: THREE.Group; base: THREE.Vector3; phase: number; depth: number; lift: number; show: number; showTarget: number; mesh: THREE.Mesh };
  function floater(w: number, h: number, canvas: { tex: THREE.CanvasTexture }, pos: [number, number, number], rotY: number, phase: number): Floater {
    const group = new THREE.Group();
    group.position.set(...pos);
    group.rotation.y = rotY;
    group.add(new THREE.Mesh(slab(w, h, 0.14, 0.05), mat(new THREE.MeshStandardMaterial({ color: 0xf4f7fb, roughness: 0.3, metalness: 0.05 }))));
    const mesh = new THREE.Mesh(face(w, h, 0.14), mat(new THREE.MeshBasicMaterial({ map: canvas.tex, transparent: true, toneMapped: false })));
    mesh.position.z = 0.047;
    group.add(mesh);
    rig.add(group);
    return { group, base: new THREE.Vector3(...pos), phase, depth: pos[2], lift: 0, show: 1, showTarget: 1, mesh };
  }
  const TOAST_W = 2.5;
  const TOAST_H = 0.78;
  const toastCanvas = canvasTexture(Math.round(880 * (opts.lowPower ? 0.75 : 1)), Math.round(275 * (opts.lowPower ? 0.75 : 1)));
  const toast = floater(TOAST_W, TOAST_H, toastCanvas, [-2.55, -1.35, 1.35], -0.1, 0);
  const MINI_W = 1.9;
  const MINI_H = 1.2;
  const miniCanvas = canvasTexture(Math.round(656 * (opts.lowPower ? 0.75 : 1)), Math.round(416 * (opts.lowPower ? 0.75 : 1)));
  const mini = floater(MINI_W, MINI_H, miniCanvas, [2.95, 1.6, 1.0], -0.3, 1.7);
  const floaters = [toast, mini];

  // Thin data links from the window to each card, with a travelling pulse
  const linkMat = mat(new THREE.LineBasicMaterial({ color: 0x18b6a4, transparent: true, opacity: 0.35 }));
  const pulseTex = glow("255,255,255", 64);
  const links = floaters.map((f, i) => {
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3());
    const line = new THREE.Line(track(new THREE.BufferGeometry().setFromPoints(new Array(32).fill(0).map(() => new THREE.Vector3()))), linkMat);
    rig.add(line);
    const pulse = new THREE.Sprite(mat(new THREE.SpriteMaterial({ map: pulseTex, color: i ? 0xf5b83d : 0x18b6a4, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
    pulse.scale.setScalar(0.22);
    rig.add(pulse);
    return { f, curve, line, pulse, t: i * 0.5, anchor: new THREE.Vector3(i ? 2.2 : -2.3, i ? 1.2 : -1.0, 0.1) };
  });

  // Fine particles for depth
  const dustCount = opts.lowPower ? 50 : 120;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 14;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 7;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
  }
  const dustGeo = track(new THREE.BufferGeometry());
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  rig.add(new THREE.Points(dustGeo, mat(new THREE.PointsMaterial({ map: pulseTex, color: 0x9fe8de, size: 0.07, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }))));

  /* ───────────────────────── Dashboard drawing ───────────────────────── */

  // Indexes must match the tabs in <HeroScene />, so every product keeps its slot;
  // one without its own sample dashboard borrows the school layout under its own name.
  const products = opts.products;
  const dashboards = products.map((p) => DASHBOARDS[p.key] ?? { ...DASHBOARDS.school, app: p.label });
  const dashFor = (i: number) => dashboards[i] ?? DASHBOARDS.school;
  const ui = {
    index: 0,
    swap: 1, // 0→1 while a new product animates in
    live: 0, // 0→1 after a live tick
    hoverIdx: -1,
    toastIdx: 0,
    rows: 0, // rotation offset of the activity list
    rowIn: 1,
  };
  // Live values drift upward a little while the scene runs.
  const liveKpi: number[][] = dashboards.map((d) => d.kpis.map((k) => k.v));
  const liveChart: number[][] = dashboards.map((d) => [...d.chart.cur]);

  // Chart geometry in design units (shared with hover hit-testing)
  const CH = { x: 112, y: 340, w: 960, h: 630, px: 172, py: 430, pw: 870, ph: 450 };

  function drawSidebarIcon(ctx: CanvasRenderingContext2D, kind: number, x: number, y: number, color: string) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    if (kind === 0) {
      [[-9, -9], [3, -9], [-9, 3], [3, 3]].forEach(([dx, dy]) => (rr(ctx, x + dx, y + dy, 8, 8, 2), ctx.fill()));
    } else if (kind === 1) {
      [[-9, 6], [-2, 1], [5, -6]].forEach(([dx, top]) => ctx.fillRect(x + dx, y + top, 5, 10 - top));
    } else if (kind === 2) {
      ctx.beginPath();
      ctx.arc(x, y - 4, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y + 12, 10, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else if (kind === 3) {
      [-6, 0, 6].forEach((dy) => (ctx.beginPath(), ctx.moveTo(x - 9, y + dy), ctx.lineTo(x + 9, y + dy), ctx.stroke()));
    } else {
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function smoothPath(ctx: CanvasRenderingContext2D, pts: [number, number][]) {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[Math.max(0, i - 1)];
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[i + 1];
      const [x3, y3] = pts[Math.min(pts.length - 1, i + 2)];
      ctx.bezierCurveTo(x1 + (x2 - x0) / 6, y1 + (y2 - y0) / 6, x2 - (x3 - x1) / 6, y2 - (y3 - y1) / 6, x2, y2);
    }
  }

  function drawDashboard() {
    const { ctx, canvas } = dash;
    const d = dashFor(ui.index);
    const kv = liveKpi[ui.index] ?? d.kpis.map((k) => k.v);
    const cv = liveChart[ui.index] ?? d.chart.cur;
    const s = ease(ui.swap);
    const fade = easeOut(clamp01(ui.swap * 1.6));
    ctx.setTransform(canvas.width / DW, 0, 0, canvas.height / DH, 0, 0);
    ctx.clearRect(0, 0, DW, DH);

    // Window background
    rr(ctx, 0, 0, DW, DH, 52);
    const bg = ctx.createLinearGradient(0, 0, DW, DH);
    bg.addColorStop(0, "rgba(19,36,64,0.97)");
    bg.addColorStop(1, "rgba(9,19,36,0.97)");
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.save();
    ctx.clip();
    const sheen = ctx.createRadialGradient(260, 0, 0, 260, 0, 900);
    sheen.addColorStop(0, "rgba(24,182,164,0.12)");
    sheen.addColorStop(1, "rgba(24,182,164,0)");
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, DW, DH);

    // Title bar
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fillRect(0, 0, DW, 64);
    ctx.fillStyle = P.w10;
    ctx.fillRect(0, 64, DW, 1.5);
    ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(40 + i * 26, 32, 7.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.font = F(600, 21);
    ctx.fillStyle = P.w50;
    ctx.textAlign = "center";
    ctx.fillText(`mavqo · ${d.app} · Sample data`, DW / 2, 39);
    ctx.textAlign = "left";
    // "Live" pill beside the window controls
    rr(ctx, 128, 17, 92, 30, 15);
    ctx.fillStyle = P.tealSoft;
    ctx.fill();
    ctx.fillStyle = P.teal;
    ctx.beginPath();
    ctx.arc(148, 32, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = F(700, 15);
    ctx.fillText("LIVE", 162, 38);

    // Sidebar
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    ctx.fillRect(0, 65, 88, DH - 65);
    ctx.fillStyle = P.w10;
    ctx.fillRect(88, 65, 1.5, DH - 65);
    // Mavqo mark
    rr(ctx, 22, 88, 44, 44, 12);
    ctx.fillStyle = P.teal;
    ctx.fill();
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 4.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(33, 121);
    ctx.lineTo(33, 101);
    ctx.lineTo(44, 113);
    ctx.lineTo(55, 101);
    ctx.lineTo(55, 121);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const y = 176 + i * 64;
      if (i === 0) {
        rr(ctx, 20, y - 24, 48, 48, 14);
        ctx.fillStyle = P.tealSoft;
        ctx.fill();
      }
      drawSidebarIcon(ctx, i, 44, y, i === 0 ? P.teal : P.w30);
    }

    ctx.globalAlpha = fade;
    const shift = (1 - fade) * 14;

    // Header
    ctx.font = F(700, 34);
    ctx.fillStyle = P.white;
    ctx.fillText(d.heading, 112, 118 + shift);
    ctx.font = F(500, 19);
    ctx.fillStyle = P.w50;
    ctx.fillText(d.sub, 112, 150 + shift);
    // Range pill + export button (kept clear of the floating card at the top-right corner)
    const HX = 900;
    rr(ctx, HX, 96, 196, 44, 22);
    ctx.fillStyle = P.w05;
    ctx.fill();
    ctx.strokeStyle = P.w10;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = F(600, 17);
    ctx.fillStyle = P.w70;
    ctx.fillText(d.chart.labels === HOURS ? "Today" : d.chart.labels === DAYS ? "Last 12 days" : "This term", HX + 22, 124);
    ctx.strokeStyle = P.w50;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(HX + 170, 114);
    ctx.lineTo(HX + 176, 120);
    ctx.lineTo(HX + 182, 114);
    ctx.stroke();
    rr(ctx, HX + 212, 96, 128, 44, 22);
    ctx.fillStyle = P.teal;
    ctx.fill();
    ctx.font = F(700, 17);
    ctx.fillStyle = P.ink;
    ctx.fillText("Export", HX + 246, 124);

    // KPI tiles
    const tileW = (DW - 112 - 32 - 3 * 20) / 4;
    d.kpis.forEach((k, i) => {
      const x = 112 + i * (tileW + 20);
      const y = 176 + shift;
      rr(ctx, x, y, tileW, 140, 22);
      ctx.fillStyle = P.w05;
      ctx.fill();
      ctx.strokeStyle = P.w10;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = F(500, 17);
      ctx.fillStyle = P.w50;
      ctx.fillText(k.label, x + 24, y + 38);
      const value = kv[i] * (0.82 + 0.18 * s);
      ctx.font = F(700, 38);
      ctx.fillStyle = P.white;
      ctx.fillText(`${k.pre ?? ""}${fmtNum(value, k.dec)}${k.suf ?? ""}`, x + 24, y + 88);
      // delta pill
      ctx.font = F(700, 14);
      const dw = ctx.measureText(k.delta).width + 26;
      rr(ctx, x + 24, y + 104, dw, 24, 12);
      ctx.fillStyle = k.good ? "rgba(61,220,151,0.14)" : "rgba(255,122,144,0.14)";
      ctx.fill();
      ctx.fillStyle = k.good ? P.green : "#ff7a90";
      ctx.fillText(k.delta, x + 37, y + 121);
      // sparkline
      const sx = x + tileW - 116;
      const sw = 92;
      const max = Math.max(...k.spark);
      const min = Math.min(...k.spark);
      const pts: [number, number][] = k.spark.map((v, j) => [sx + (j / (k.spark.length - 1)) * sw * s, y + 128 - ((v - min) / (max - min || 1)) * 28]);
      ctx.beginPath();
      smoothPath(ctx, pts);
      ctx.strokeStyle = i % 2 ? P.sun : P.teal;
      ctx.lineWidth = 3;
      ctx.stroke();
    });

    // Chart card
    {
      const { x, y, w, h, px, py, pw, ph } = CH;
      rr(ctx, x, y, w, h, 24);
      ctx.fillStyle = P.w05;
      ctx.fill();
      ctx.strokeStyle = P.w10;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = F(700, 23);
      ctx.fillStyle = P.white;
      ctx.fillText(d.chart.title, x + 30, y + 50);
      // legend
      ctx.font = F(500, 16);
      ctx.fillStyle = P.teal;
      ctx.beginPath();
      ctx.arc(x + w - 290, y + 44, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = P.w70;
      ctx.fillText("This period", x + w - 276, y + 50);
      ctx.strokeStyle = P.w30;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(x + w - 150, y + 44);
      ctx.lineTo(x + w - 128, y + 44);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillText("Previous", x + w - 118, y + 50);

      const all = [...cv, ...d.chart.prev];
      const top = Math.max(...all) * 1.12;
      const yAt = (v: number) => py + ph - (v / top) * ph;
      const xAt = (i: number) => px + (i / (cv.length - 1)) * pw;
      const fmtAxis = (v: number) => (v >= 1000 ? `${fmtNum(v / 1000, 1)}K` : fmtNum(v, 0));
      ctx.font = F(500, 15);
      for (let g = 0; g <= 4; g++) {
        const gy = py + (ph * g) / 4;
        ctx.fillStyle = P.w10;
        ctx.fillRect(px, gy, pw, 1.2);
        ctx.fillStyle = P.w30;
        ctx.textAlign = "right";
        ctx.fillText(fmtAxis((top * (4 - g)) / 4), px - 14, gy + 5);
      }
      ctx.textAlign = "center";
      d.chart.labels.forEach((l, i) => {
        ctx.fillStyle = i === ui.hoverIdx ? P.white : P.w30;
        ctx.fillText(l, xAt(i), py + ph + 32);
      });
      ctx.textAlign = "left";

      // previous period (dashed)
      ctx.save();
      ctx.beginPath();
      ctx.rect(px - 10, py - 40, (pw + 20) * s, ph + 60);
      ctx.clip();
      ctx.beginPath();
      smoothPath(ctx, d.chart.prev.map((v, i) => [xAt(i), yAt(v)]));
      ctx.setLineDash([8, 7]);
      ctx.strokeStyle = P.w30;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.setLineDash([]);
      // current period: area + line
      const pts: [number, number][] = cv.map((v, i) => [xAt(i), yAt(v)]);
      ctx.beginPath();
      smoothPath(ctx, pts);
      ctx.lineTo(px + pw, py + ph);
      ctx.lineTo(px, py + ph);
      ctx.closePath();
      const area = ctx.createLinearGradient(0, py, 0, py + ph);
      area.addColorStop(0, "rgba(24,182,164,0.38)");
      area.addColorStop(1, "rgba(24,182,164,0)");
      ctx.fillStyle = area;
      ctx.fill();
      ctx.beginPath();
      smoothPath(ctx, pts);
      ctx.strokeStyle = P.teal;
      ctx.lineWidth = 4.5;
      ctx.shadowColor = "rgba(24,182,164,0.7)";
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // focus point: hovered index, or the latest value
      const fi = ui.hoverIdx >= 0 ? ui.hoverIdx : cv.length - 1;
      if (s > 0.98 || ui.hoverIdx >= 0) {
        const fx = xAt(fi);
        const fy = yAt(cv[fi]);
        ctx.strokeStyle = P.w30;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.moveTo(fx, py);
        ctx.lineTo(fx, py + ph);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(24,182,164,0.25)";
        ctx.beginPath();
        ctx.arc(fx, fy, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = P.white;
        ctx.beginPath();
        ctx.arc(fx, fy, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = P.teal;
        ctx.lineWidth = 4;
        ctx.stroke();
        // tooltip
        const label = `${d.chart.pre ?? ""}${fmtNum(cv[fi], 0)}${d.chart.suf ?? ""}`;
        const prev = d.chart.prev[fi];
        const change = prev ? ((cv[fi] - prev) / prev) * 100 : 0;
        const sub = `${d.chart.labels[fi]} · ${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs previous`;
        ctx.font = F(700, 22);
        const tw = Math.max(ctx.measureText(label).width, (ctx.font = F(500, 15), ctx.measureText(sub).width)) + 36;
        const tx = Math.min(Math.max(fx - tw / 2, px), px + pw - tw);
        const ty = Math.max(py - 30, fy - 96);
        ctx.shadowColor = "rgba(0,0,0,0.35)";
        ctx.shadowBlur = 24;
        rr(ctx, tx, ty, tw, 70, 14);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.font = F(700, 22);
        ctx.fillStyle = P.ink;
        ctx.fillText(label, tx + 18, ty + 32);
        ctx.font = F(500, 15);
        ctx.fillStyle = change >= 0 ? "#0a7569" : "#c2410c";
        ctx.fillText(sub, tx + 18, ty + 56);
      }
    }

    // Progress ring card
    {
      const x = 1092;
      const y = 340 + shift;
      const w = DW - 32 - x;
      rr(ctx, x, y, w, 250, 24);
      ctx.fillStyle = P.w05;
      ctx.fill();
      ctx.strokeStyle = P.w10;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const cx = x + 112;
      const cy = y + 125;
      const r = 72;
      ctx.lineCap = "round";
      ctx.lineWidth = 18;
      ctx.strokeStyle = P.w10;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      const pct = d.ring.pct * s;
      const ringGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      ringGrad.addColorStop(0, P.teal);
      ringGrad.addColorStop(1, "#5ee6d4");
      ctx.strokeStyle = ringGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
      ctx.stroke();
      const endA = -Math.PI / 2 + Math.PI * 2 * pct;
      ctx.fillStyle = P.sun;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(endA) * r, cy + Math.sin(endA) * r, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = F(700, 34);
      ctx.fillStyle = P.white;
      ctx.textAlign = "center";
      ctx.fillText(`${Math.round(pct * 100)}%`, cx, cy + 12);
      ctx.textAlign = "left";
      ctx.font = F(700, 20);
      ctx.fillText(d.ring.title, x + 214, y + 92);
      ctx.font = F(500, 17);
      ctx.fillStyle = P.w70;
      ctx.fillText(d.ring.caption, x + 214, y + 124);
      ctx.fillStyle = P.teal;
      ctx.font = F(600, 15);
      ctx.fillText(d.ring.detail, x + 214, y + 154);
    }

    // Activity card
    {
      const x = 1092;
      const y = 610 + shift;
      const w = DW - 32 - x;
      const h = DH - 36 - 610;
      rr(ctx, x, y, w, h, 24);
      ctx.fillStyle = P.w05;
      ctx.fill();
      ctx.strokeStyle = P.w10;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = F(700, 20);
      ctx.fillStyle = P.white;
      ctx.fillText("Recent activity", x + 26, y + 44);
      ctx.font = F(600, 15);
      ctx.fillStyle = P.teal;
      ctx.textAlign = "right";
      ctx.fillText("View all", x + w - 26, y + 44);
      ctx.textAlign = "left";
      const rows = d.activity.length;
      ctx.save();
      rr(ctx, x, y + 62, w, h - 70, 0);
      ctx.clip();
      for (let k = 0; k < Math.min(4, rows); k++) {
        const a = d.activity[(k + ui.rows) % rows];
        const appear = k === 0 ? easeOut(ui.rowIn) : 1;
        // New rows slide in at the top; the others ease down one slot.
        const ry = y + 66 + k * 70 - (k === 0 ? 0 : (1 - easeOut(ui.rowIn)) * 70);
        ctx.globalAlpha = fade * appear;
        // avatar
        ctx.fillStyle = AVATARS[(k + ui.rows) % AVATARS.length];
        ctx.beginPath();
        ctx.arc(x + 48, ry + 34, 21, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = P.ink;
        ctx.font = F(700, 15);
        ctx.textAlign = "center";
        ctx.fillText(initials(a.who), x + 48, ry + 40);
        ctx.textAlign = "left";
        ctx.font = F(600, 18);
        ctx.fillStyle = P.white;
        ctx.fillText(a.who, x + 82, ry + 30);
        ctx.font = F(500, 15);
        ctx.fillStyle = P.w50;
        ctx.fillText(a.meta, x + 82, ry + 54);
        // status pill + amount
        ctx.font = F(700, 13);
        const pw = ctx.measureText(a.status).width + 24;
        rr(ctx, x + w - 26 - pw, ry + 38, pw, 24, 12);
        ctx.fillStyle = toneWash[a.tone];
        ctx.fill();
        ctx.fillStyle = toneColor[a.tone];
        ctx.fillText(a.status, x + w - 26 - pw + 12, ry + 55);
        if (a.amount) {
          ctx.font = F(700, 17);
          ctx.fillStyle = P.white;
          ctx.textAlign = "right";
          ctx.fillText(a.amount, x + w - 26, ry + 28);
          ctx.textAlign = "left";
        }
        if (k < 3) {
          ctx.fillStyle = P.w10;
          ctx.fillRect(x + 26, ry + 69, w - 52, 1.2);
        }
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // Hairline window border
    rr(ctx, 1, 1, DW - 2, DH - 2, 51);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 2;
    ctx.stroke();
    dash.tex.needsUpdate = true;
  }

  function drawToastIcon(ctx: CanvasRenderingContext2D, icon: Dash["toasts"][number]["icon"], cx: number, cy: number, color: string) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (icon === "check") {
      ctx.moveTo(cx - 11, cy);
      ctx.lineTo(cx - 3, cy + 8);
      ctx.lineTo(cx + 12, cy - 8);
      ctx.stroke();
    } else if (icon === "bell") {
      ctx.moveTo(cx - 11, cy + 7);
      ctx.quadraticCurveTo(cx - 10, cy - 13, cx, cy - 13);
      ctx.quadraticCurveTo(cx + 10, cy - 13, cx + 11, cy + 7);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy + 12, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (icon === "alert") {
      ctx.moveTo(cx, cy - 13);
      ctx.lineTo(cx + 13, cy + 10);
      ctx.lineTo(cx - 13, cy + 10);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy - 4);
      ctx.lineTo(cx, cy + 2);
      ctx.stroke();
    } else {
      rr(ctx, cx - 10, cy - 13, 20, 26, 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 3);
      ctx.lineTo(cx + 5, cy - 3);
      ctx.moveTo(cx - 5, cy + 4);
      ctx.lineTo(cx + 3, cy + 4);
      ctx.stroke();
    }
  }

  const tones: Record<Tone, { fg: string; bg: string }> = {
    green: { fg: "#0f8a5f", bg: "#dcf7ea" },
    teal: { fg: "#0a7569", bg: "#dcf3ef" },
    sun: { fg: "#a86a00", bg: "#fdf0d5" },
    muted: { fg: "#475467", bg: "#eef1f5" },
  };

  function drawToast() {
    const { ctx, canvas } = toastCanvas;
    const W = 880;
    const H = 275;
    const d = dashFor(ui.index);
    const t = d.toasts[ui.toastIdx % d.toasts.length];
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    ctx.clearRect(0, 0, W, H);
    rr(ctx, 0, 0, W, H, 44);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    const tone = tones[t.tone];
    rr(ctx, 36, 62, 150, 150, 36);
    ctx.fillStyle = tone.bg;
    ctx.fill();
    ctx.save();
    ctx.translate(111, 137);
    ctx.scale(2.6, 2.6);
    drawToastIcon(ctx, t.icon, 0, 0, tone.fg);
    ctx.restore();
    ctx.font = F(700, 44);
    ctx.fillStyle = P.ink;
    ctx.fillText(t.title, 220, 122);
    ctx.font = F(500, 34);
    ctx.fillStyle = "#5b6678";
    ctx.fillText(t.sub, 220, 176, W - 260);
    ctx.font = F(600, 26);
    ctx.fillStyle = "#98a2b3";
    ctx.textAlign = "right";
    ctx.fillText("just now", W - 44, 66);
    ctx.textAlign = "left";
    toastCanvas.tex.needsUpdate = true;
  }

  function drawMini() {
    const { ctx, canvas } = miniCanvas;
    const W = 656;
    const H = 416;
    const d = dashFor(ui.index);
    const s = ease(ui.swap);
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    ctx.clearRect(0, 0, W, H);
    rr(ctx, 0, 0, W, H, 44);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.font = F(600, 30);
    ctx.fillStyle = "#5b6678";
    ctx.fillText(d.mini.title, 40, 70);
    ctx.font = F(700, 58);
    ctx.fillStyle = P.ink;
    ctx.fillText(d.mini.value, 40, 142, W - 80);
    ctx.font = F(500, 26);
    ctx.fillStyle = "#0a7569";
    ctx.fillText(d.mini.caption, 40, 186, W - 80);
    const n = d.mini.bars.length;
    const bw = (W - 80 - (n - 1) * 18) / n;
    d.mini.bars.forEach((b, i) => {
      const bh = 150 * b * s;
      const x = 40 + i * (bw + 18);
      rr(ctx, x, 222, bw, 150, 14);
      ctx.fillStyle = "#eef1f5";
      ctx.fill();
      rr(ctx, x, 372 - bh, bw, Math.max(bh, 1), 14);
      ctx.fillStyle = i === n - 1 ? P.sun : P.teal;
      ctx.fill();
    });
    miniCanvas.tex.needsUpdate = true;
  }

  /* ───────────────────────── Input ───────────────────────── */
  const ndc = new THREE.Vector2(-9, -9);
  const tilt = new THREE.Vector2();
  const tiltTarget = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const drag = { active: false, x: 0, yaw: 0, yawVel: 0, lastX: 0, lastT: 0 };
  let hoveredFloater: Floater | null = null;

  function setNdc(e: PointerEvent) {
    const r = container.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }
  /** Hover: chart crosshair on the window, lift on floating cards. */
  function updateHover() {
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects([screen, toast.mesh, mini.mesh], false);
    const hit = hits[0];
    let idx = -1;
    hoveredFloater = null;
    if (hit?.object === screen && hit.uv) {
      const x = hit.uv.x * DW;
      const y = (1 - hit.uv.y) * DH;
      const n = (liveChart[ui.index] ?? dashFor(ui.index).chart.cur).length;
      if (x > CH.px - 30 && x < CH.px + CH.pw + 30 && y > CH.py - 40 && y < CH.py + CH.ph + 40) {
        idx = Math.round(((x - CH.px) / CH.pw) * (n - 1));
        idx = Math.max(0, Math.min(n - 1, idx));
      }
    } else if (hit) {
      hoveredFloater = hit.object === toast.mesh ? toast : mini;
    }
    container.dataset.hover = idx >= 0 || hoveredFloater ? "true" : "false";
    if (idx !== ui.hoverIdx) {
      ui.hoverIdx = idx;
      dirty.dash = true;
    }
  }

  const onDown = (e: PointerEvent) => {
    if (e.button !== 0 || e.target !== renderer.domElement) return;
    drag.active = true;
    drag.x = drag.lastX = e.clientX;
    drag.lastT = performance.now();
    container.setPointerCapture(e.pointerId);
    container.dataset.grabbing = "true";
    wake();
  };
  const onMove = (e: PointerEvent) => {
    setNdc(e);
    tiltTarget.set(ndc.x, ndc.y);
    if (drag.active) {
      const r = container.getBoundingClientRect();
      const now = performance.now();
      const dx = (e.clientX - drag.lastX) / r.width;
      drag.yaw = THREE.MathUtils.clamp(drag.yaw + dx * 2.2, -0.6, 0.6);
      drag.yawVel = (dx * 2.2) / Math.max(0.001, (now - drag.lastT) / 1000);
      drag.lastX = e.clientX;
      drag.lastT = now;
    }
    wake();
  };
  const onUp = () => {
    if (!drag.active) return;
    drag.active = false;
    delete container.dataset.grabbing;
    if (Math.abs(drag.lastX - drag.x) > 6) holdAutoplay();
  };
  const onLeave = () => {
    if (!drag.active) {
      tiltTarget.set(0, 0);
      ndc.set(-9, -9);
      updateHover();
    }
  };
  container.addEventListener("pointerdown", onDown);
  container.addEventListener("pointermove", onMove);
  container.addEventListener("pointerup", onUp);
  container.addEventListener("pointercancel", onUp);
  container.addEventListener("pointerleave", onLeave);

  /* ───────────────────────── Sizing ───────────────────────── */
  let camZ = 14;
  function resize() {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Fit the whole composition (window + floating cards) with a small margin.
    const halfW = 4.45;
    const halfH = 2.9;
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camZ = Math.max(halfH / tanV, halfW / (tanV * camera.aspect));
    // On narrow (phone) stages the width decides the distance, leaving spare height:
    // use it to lift the composition clear of the product tabs at the bottom.
    const slack = 2 * camZ * tanV - 2 * halfH;
    lookAt.y = -0.75 - slack * 0.42;
    camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(() => {
    resize();
    step(0);
    renderer.render(scene, camera);
  });
  resizeObserver.observe(container);
  resize();

  /* ───────────────────────── Simulation ───────────────────────── */
  const motion = !opts.reducedMotion;
  const dirty = { dash: true, toast: true, mini: true };
  const AUTO_MS = 7000;
  let autoplayAt = performance.now() + AUTO_MS;
  let nextToastAt = performance.now() + 3200;
  let nextLiveAt = performance.now() + 2600;
  let nextRowAt = performance.now() + 5200;
  let pendingToast = false;
  let intro = motion ? 0 : 1;
  let elapsed = 0;
  let impulse = 0;

  function holdAutoplay() {
    autoplayAt = performance.now() + AUTO_MS * 2.5;
  }

  function show(index: number) {
    if (!products.length) return;
    const i = ((index % products.length) + products.length) % products.length;
    if (i === ui.index && ui.swap >= 1) return;
    ui.index = i;
    ui.swap = motion ? 0 : 1;
    ui.toastIdx = 0;
    ui.rows = 0;
    ui.rowIn = 1;
    impulse = motion ? 1 : 0;
    toast.showTarget = 1;
    dirty.dash = dirty.toast = dirty.mini = true;
    opts.onProductChange(i);
  }

  const tmp = new THREE.Vector3();
  function step(dt: number) {
    const now = performance.now();
    elapsed += dt;
    const t = elapsed;

    // Pointer tilt + drag yaw (springs back when released)
    tilt.lerp(tiltTarget, Math.min(1, dt * 4));
    if (!drag.active) {
      drag.yawVel += -drag.yaw * 30 * dt;
      drag.yawVel *= Math.pow(0.02, dt);
      drag.yaw += drag.yawVel * dt;
    }
    impulse *= Math.pow(0.03, dt);
    intro = Math.min(1, intro + dt / 1.4);
    const ie = easeOut(intro);

    rig.rotation.y = tilt.x * 0.14 + drag.yaw;
    rig.rotation.x = -tilt.y * 0.07;
    rig.position.y = (1 - ie) * -0.6 + (motion ? Math.sin(t * 0.7) * 0.05 : 0);
    rig.scale.setScalar(0.94 + 0.06 * ie);

    camera.position.set(tilt.x * 0.4, 0.45 + tilt.y * 0.25, camZ);
    camera.lookAt(lookAt);

    win.rotation.y = -0.26 + Math.sin(impulse * Math.PI) * 0.08;
    win.position.z = -impulse * 0.35;

    floaters.forEach((f) => {
      f.lift += ((f === hoveredFloater ? 1 : 0) - f.lift) * Math.min(1, dt * 8);
      f.show += (f.showTarget - f.show) * Math.min(1, dt * (f.showTarget ? 6 : 10));
      const bob = motion ? Math.sin(t * 0.9 + f.phase) * 0.08 : 0;
      f.group.position.set(f.base.x, f.base.y + bob + (1 - f.show) * -0.35 + f.lift * 0.08, f.base.z + f.lift * 0.35);
      f.group.scale.setScalar((0.9 + 0.1 * f.show) * (1 + f.lift * 0.04) * ie);
    });

    // Links from window anchors to cards, with a pulse travelling along each
    links.forEach((l) => {
      win.localToWorld(tmp.copy(l.anchor));
      rig.worldToLocal(tmp);
      l.curve.v0.copy(tmp);
      // End just behind the card's face, so the card hides the line's tip.
      l.curve.v2.copy(l.f.group.position).setZ(l.f.group.position.z - 0.06);
      l.curve.v1.set((tmp.x + l.f.group.position.x) / 2, (tmp.y + l.f.group.position.y) / 2 + 0.45, (tmp.z + l.f.group.position.z) / 2);
      l.line.geometry.setFromPoints(l.curve.getPoints(31));
      l.t = (l.t + dt * 0.45) % 1;
      l.pulse.position.copy(l.curve.getPoint(l.t));
      l.pulse.material.opacity = Math.sin(l.t * Math.PI) * l.f.show * ie;
    });
    linkMat.opacity = 0.3 * ie;

    if (motion) {
      const arr = dustGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < dustCount; i++) {
        arr[i * 3 + 1] += dt * 0.08;
        if (arr[i * 3 + 1] > 3.5) arr[i * 3 + 1] = -3.5;
      }
      dustGeo.attributes.position.needsUpdate = true;
    }

    // Product transition and live updates
    if (ui.swap < 1) {
      ui.swap = Math.min(1, ui.swap + dt / 1.1);
      dirty.dash = dirty.mini = true;
    }
    if (ui.rowIn < 1) {
      ui.rowIn = Math.min(1, ui.rowIn + dt / 0.6);
      dirty.dash = true;
    }
    if (!paused && motion) {
      if (now > autoplayAt && !drag.active && ui.hoverIdx < 0) {
        autoplayAt = now + AUTO_MS;
        show(ui.index + 1);
      }
      if (now > nextLiveAt) {
        nextLiveAt = now + 2600;
        const d = dashFor(ui.index);
        const kv = liveKpi[ui.index];
        d.kpis.forEach((k, i) => {
          if (k.live && kv) kv[i] += k.live;
        });
        const cv = liveChart[ui.index];
        if (cv) cv[cv.length - 1] = d.chart.cur[cv.length - 1] * (1 + (Math.random() * 0.05 - 0.01));
        dirty.dash = true;
      }
      if (now > nextRowAt) {
        nextRowAt = now + 5200;
        ui.rows = (ui.rows + dashFor(ui.index).activity.length - 1) % dashFor(ui.index).activity.length;
        ui.rowIn = 0;
      }
      if (now > nextToastAt) {
        nextToastAt = now + 4200;
        toast.showTarget = 0;
        pendingToast = true;
      }
    }
    if (pendingToast && toast.show < 0.05) {
      pendingToast = false;
      ui.toastIdx = (ui.toastIdx + 1) % dashFor(ui.index).toasts.length;
      dirty.toast = true;
      toast.showTarget = 1;
    }

    if (dirty.dash) drawDashboard();
    if (dirty.toast) drawToast();
    if (dirty.mini) drawMini();
    dirty.dash = dirty.toast = dirty.mini = false;
  }

  /* ───────────────────────── Loop control ───────────────────────── */
  const timer = new THREE.Timer();
  let running = false;
  let visible = true;
  let paused = opts.reducedMotion;
  let raf = 0;
  let sleepAfter = 0;
  let destroyed = false;
  let hoverCheck = 0;

  function loop(ts?: number) {
    if (!running || destroyed) return;
    timer.update(ts);
    const dt = THREE.MathUtils.clamp(timer.getDelta(), 0, 0.05);
    if (++hoverCheck % 2 === 0) updateHover();
    step(dt);
    renderer.render(scene, camera);
    const settling = ui.swap < 1 || ui.rowIn < 1 || intro < 1 || Math.abs(drag.yaw) > 0.002 || tilt.distanceTo(tiltTarget) > 0.002;
    if (paused && performance.now() > sleepAfter && !drag.active && !settling) {
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
    sleepAfter = performance.now() + 1500;
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

  // First frame: a settled, fully drawn pose (even with reduced motion).
  opts.onProductChange(0);
  step(0);
  renderer.render(scene, camera);
  sync();
  // Fonts can finish loading after boot; redraw the UI once they have.
  void document.fonts?.ready.then(() => {
    if (destroyed) return;
    dirty.dash = dirty.toast = dirty.mini = true;
    step(0);
    renderer.render(scene, camera);
  });

  return {
    setPaused(v) {
      paused = v;
      if (!v) {
        autoplayAt = performance.now() + AUTO_MS;
        sync();
      } else wake();
    },
    setProduct(i) {
      holdAutoplay();
      show(i);
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
      disposables.forEach((d) => d.dispose());
      timer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
