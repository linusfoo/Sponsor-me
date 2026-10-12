// 3D stage: a life-size mannequin (or bike) on a turntable, with ad spots projected
// onto the surface as decals. Units are metres; the figure faces +z.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DecalGeometry } from "three/addons/geometries/DecalGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const RED = "#ef2b45";
const BASE = "#0e1015";
const BASE2 = "#11141b";
const DARK = "#090a0d";
const GLOW = 4; // multiplier that pushes open spots into the bloom range

// ── Geometry helpers ─────────────────────────────────────────

// Catmull-Rom sample a list of keyframes ({x,y,z,rx,rz}) into n smooth rings.
function sampleKeys(keys, n) {
  const out = [];
  for (let k = 0; k < n; k++) {
    const t = (k / (n - 1)) * (keys.length - 1);
    const i = Math.min(Math.floor(t), keys.length - 2);
    const f = t - i;
    const p0 = keys[Math.max(i - 1, 0)], p1 = keys[i], p2 = keys[i + 1], p3 = keys[Math.min(i + 2, keys.length - 1)];
    const cr = (a, b, c, d) =>
      0.5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f);
    const o = {};
    for (const key in p1) o[key] = cr(p0[key], p1[key], p2[key], p3[key]);
    out.push(o);
  }
  return out;
}

// Build a closed tube through rings. u runs around (0 = +x side, 0.25 = front, 0.5 = -x, 0.75 = back),
// v runs along the rings (0 → 1).
function tube(rings, seg = 56, scale = 1) {
  const n = rings.length;
  const pos = [], uv = [], idx = [];
  const X = new THREE.Vector3(1, 0, 0), Z = new THREE.Vector3(0, 0, 1);
  const centers = rings.map((r) => new THREE.Vector3(r.x, r.y, r.z));
  for (let i = 0; i < n; i++) {
    const r = rings[i];
    const t = centers[Math.min(i + 1, n - 1)].clone().sub(centers[Math.max(i - 1, 0)]).normalize();
    const a = X.clone().sub(t.clone().multiplyScalar(t.dot(X))).normalize();
    const b = Z.clone().sub(t.clone().multiplyScalar(t.dot(Z))).sub(a.clone().multiplyScalar(a.dot(Z))).normalize();
    for (let j = 0; j <= seg; j++) {
      const th = (j / seg) * Math.PI * 2;
      const p = centers[i].clone()
        .addScaledVector(a, Math.cos(th) * r.rx * scale)
        .addScaledVector(b, Math.sin(th) * r.rz * scale);
      pos.push(p.x, p.y, p.z);
      uv.push(j / seg, r.v ?? i / (n - 1));
    }
  }
  for (let i = 0; i < n - 1; i++)
    for (let j = 0; j < seg; j++) {
      const A = i * (seg + 1) + j, B = A + 1, C = A + seg + 1, D = C + 1;
      idx.push(A, C, B, B, C, D);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  // Make sure normals face outward; flip winding if they don't.
  const nrm = g.attributes.normal;
  const mid = Math.floor(n / 2) * (seg + 1);
  const out = new THREE.Vector3().fromBufferAttribute(g.attributes.position, mid).sub(centers[Math.floor(n / 2)]);
  if (out.dot(new THREE.Vector3().fromBufferAttribute(nrm, mid)) < 0) {
    for (let k = 0; k < idx.length; k += 3) [idx[k + 1], idx[k + 2]] = [idx[k + 2], idx[k + 1]];
    g.setIndex(idx);
    g.computeVertexNormals();
  }
  // Weld the normals along the u = 0 / 1 seam.
  for (let i = 0; i < n; i++) {
    const s = i * (seg + 1), e = s + seg;
    const v = new THREE.Vector3().fromBufferAttribute(nrm, s).add(new THREE.Vector3().fromBufferAttribute(nrm, e)).normalize();
    nrm.setXYZ(s, v.x, v.y, v.z);
    nrm.setXYZ(e, v.x, v.y, v.z);
  }
  return g;
}

// Rings along a straight limb from p0 to p1. keys: [{s, rx, rz, dz}]
function limbRings(p0, p1, keys, n, s0 = 0, s1 = 1) {
  const full = sampleKeys(keys.map((k) => ({ s: k.s, rx: k.rx, rz: k.rz, dz: k.dz || 0 })), 80);
  const radiusAt = (s) => {
    let best = full[0];
    for (const k of full) if (Math.abs(k.s - s) < Math.abs(best.s - s)) best = k;
    return best;
  };
  const rings = [];
  for (let i = 0; i < n; i++) {
    const s = s0 + ((s1 - s0) * i) / (n - 1);
    const k = radiusAt(Math.min(Math.max(s, 0), 1));
    rings.push({
      x: p0[0] + (p1[0] - p0[0]) * s,
      y: p0[1] + (p1[1] - p0[1]) * s,
      z: p0[2] + (p1[2] - p0[2]) * s + k.dz,
      rx: k.rx, rz: k.rz, v: i / (n - 1),
    });
  }
  return rings;
}

function ellipsoid(sx, sy, sz, x, y, z, mat, opts = {}) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32, 0, Math.PI * 2, 0, opts.theta ?? Math.PI), mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  return m;
}

function rod(a, b, r, mat, name) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(r, r, len, 32, 1);
  const m = new THREE.Mesh(g, mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  if (name) m.name = name;
  return m;
}

// ── Textures ─────────────────────────────────────────────────

function canvasTex(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Draw in (u, v) space with horizontal wrap-around. v = 0 is the bottom.
function uvPainter(g, W, H) {
  const P = (u, v) => [u * W, (1 - v) * H];
  return {
    wrap(fn) { for (const off of [-1, 0, 1]) fn(off); },
    poly(points, off = 0) {
      g.beginPath();
      points.forEach(([u, v], i) => { const [x, y] = P(u + off, v); i ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.closePath();
    },
    ellipse(u, v, ru, rv, off = 0) {
      g.beginPath();
      const [x, y] = P(u + off, v);
      g.ellipse(x, y, ru * W, rv * H, 0, 0, Math.PI * 2);
    },
    hline(v, width) {
      g.lineWidth = width;
      g.beginPath();
      const [, y] = P(0, v);
      g.moveTo(0, y); g.lineTo(W, y); g.stroke();
    },
    rect(u0, v0, u1, v1) { const [x0, y0] = P(u0, v1); g.fillRect(x0, y0, (u1 - u0) * W, (v1 - v0) * H); },
  };
}

function fabricGrain(g, W, H) {
  g.save();
  g.globalAlpha = 0.05;
  g.strokeStyle = "#ffffff";
  g.lineWidth = 1;
  for (let x = -H; x < W; x += 6) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + H, 0); g.stroke(); }
  g.restore();
}

// Torso texture: colour + alpha (neck/arm cut-outs) and a matching glow map for piping.
// Torso v: 0 = y 0.84, 1 = y 1.50
const tv = (y) => (y - 0.84) / 0.66;

function torsoTextures(outfit) {
  const W = 1024, H = 1024;
  const sidePanel = (P, off, u0, v0, v1, wBottom, wWaist, wTop) =>
    P.poly([[u0 - wBottom, v0], [u0 - wWaist, (v0 + v1) / 2], [u0 - wTop, v1], [u0 + wTop, v1], [u0 + wWaist, (v0 + v1) / 2], [u0 + wBottom, v0]], off);

  const color = canvasTex(W, H, (g) => {
    const P = uvPainter(g, W, H);
    g.fillStyle = outfit === "cyc" ? BASE2 : BASE;
    g.fillRect(0, 0, W, H);
    if (outfit === "cyc" || outfit === "run") {
      g.fillStyle = DARK;
      P.rect(0, 0, 1, tv(outfit === "cyc" ? 0.98 : 0.985));
    }
    g.fillStyle = RED;
    for (const u0 of [0, 0.5]) P.wrap((off) => {
      if (outfit === "run") sidePanel(P, off, u0, tv(0.99), 0.7, 0.025, 0.018, 0.03);
      else if (outfit === "cyc") sidePanel(P, off, u0, tv(0.99), 0.84, 0.03, 0.022, 0.05);
      else sidePanel(P, off, u0, 0, 0.84, 0.05, 0.032, 0.06);
      g.fill();
    });
    if (outfit === "cyc") { g.fillStyle = RED; P.rect(0, 0.88, 1, 0.915); }
    if (outfit === "tri" || outfit === "helm") {
      // Red shoulder yoke that sweeps down into the side panels
      g.fillStyle = RED;
      P.wrap((off) => { P.poly([[-0.06, 0.84], [0.06, 0.84], [0.17, 0.97], [0.12, 0.99], [-0.12, 0.99], [-0.17, 0.97]], off); g.fill(); });
      P.wrap((off) => { P.poly([[0.44, 0.84], [0.56, 0.84], [0.67, 0.97], [0.62, 0.99], [0.38, 0.99], [0.33, 0.97]], off); g.fill(); });
      // Thin white pinstripe under the yoke
      g.strokeStyle = "#e9edf2";
      g.lineWidth = 3;
      for (const [a0, a1] of [[0.07, 0.18], [0.32, 0.43], [0.57, 0.68], [0.82, 0.93]]) {
        g.beginPath();
        const y0 = (1 - 0.86) * H, y1 = (1 - 0.975) * H;
        if (a0 % 0.5 < 0.25) { g.moveTo(a0 * W, y0); g.lineTo(a1 * W, y1); } else { g.moveTo(a0 * W, y1); g.lineTo(a1 * W, y0); }
        g.stroke();
      }
    }
    fabricGrain(g, W, H);
    // Zip
    if (outfit !== "run") {
      g.strokeStyle = "#3b4350";
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(0.25 * W, (1 - (outfit === "cyc" ? 0.25 : 0.5)) * H);
      g.lineTo(0.25 * W, 0);
      g.stroke();
    }
    // Cut-outs
    g.globalCompositeOperation = "destination-out";
    if (outfit === "run") {
      for (const u0 of [0, 0.5]) P.wrap((off) => { P.ellipse(u0, 1.02, 0.085, 0.3, off); g.fill(); });
      P.ellipse(0.25, 1.0, 0.075, 0.13); g.fill();
      P.ellipse(0.75, 1.0, 0.07, 0.07); g.fill();
    } else {
      P.ellipse(0.25, 1.0, 0.05, outfit === "cyc" ? 0.035 : 0.06); g.fill();
      P.ellipse(0.75, 1.0, 0.045, 0.025); g.fill();
    }
  });

  const glow = canvasTex(W, H, (g) => {
    const P = uvPainter(g, W, H);
    g.fillStyle = "#000";
    g.fillRect(0, 0, W, H);
    g.strokeStyle = RED;
    g.lineWidth = 3;
    for (const u0 of [0, 0.5]) P.wrap((off) => {
      if (outfit === "run") { P.ellipse(u0, 1.02, 0.088, 0.305, off); g.stroke(); }
      else if (outfit === "cyc") { sidePanel(P, off, u0, tv(0.99), 0.84, 0.03, 0.022, 0.05); g.stroke(); }
      else { sidePanel(P, off, u0, 0, 0.84, 0.05, 0.032, 0.06); g.stroke(); }
    });
    if (outfit === "cyc") { g.strokeStyle = RED; P.hline(tv(0.98), 3); }
    if (outfit === "run") { g.strokeStyle = RED; P.hline(tv(0.985), 3); }
  });
  return { color, glow };
}

// Limb fabric (sleeve or leg). outerU: which u faces outward (0 for +x limbs, 0.5 for -x).
function limbTextures(kind, outerU, outfit) {
  const W = 512, H = 256;
  const base = kind === "leg" && outfit !== "tri" && outfit !== "helm" ? DARK : outfit === "cyc" ? BASE2 : BASE;
  const color = canvasTex(W, H, (g) => {
    const P = uvPainter(g, W, H);
    g.fillStyle = base;
    g.fillRect(0, 0, W, H);
    g.fillStyle = RED;
    if (kind === "leg") P.wrap((off) => { P.poly([[outerU - 0.04, 1], [outerU + 0.04, 1], [outerU + 0.02, 0], [outerU - 0.02, 0]], off); g.fill(); });
    else P.rect(0, 0.0, 1, 0.12);
    fabricGrain(g, W, H);
  });
  const glow = canvasTex(W, H, (g) => {
    const P = uvPainter(g, W, H);
    g.fillStyle = "#000";
    g.fillRect(0, 0, W, H);
    g.strokeStyle = RED;
    P.hline(0.06, 4);
  });
  return { color, glow };
}

function fabricMaterial({ color, glow }) {
  return new THREE.MeshPhysicalMaterial({
    map: color,
    emissiveMap: glow,
    emissive: new THREE.Color(1, 1, 1),
    emissiveIntensity: 2.4,
    roughness: 0.72,
    metalness: 0.0,
    envMapIntensity: 0.25,
    sheen: 0.3,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color("#9aa4b2"),
    alphaTest: 0.5,
    side: THREE.DoubleSide,
  });
}

// ── Figure ───────────────────────────────────────────────────

const TORSO_KEYS = [
  { x: 0, y: 0.84, z: 0, rx: 0.12, rz: 0.085 },
  { x: 0, y: 0.9, z: -0.005, rx: 0.165, rz: 0.11 },
  { x: 0, y: 0.96, z: -0.01, rx: 0.178, rz: 0.118 },
  { x: 0, y: 1.03, z: 0, rx: 0.165, rz: 0.11 },
  { x: 0, y: 1.1, z: 0.005, rx: 0.148, rz: 0.1 },
  { x: 0, y: 1.18, z: 0.01, rx: 0.155, rz: 0.108 },
  { x: 0, y: 1.26, z: 0.015, rx: 0.172, rz: 0.122 },
  { x: 0, y: 1.34, z: 0.01, rx: 0.182, rz: 0.122 },
  { x: 0, y: 1.41, z: 0, rx: 0.186, rz: 0.108 },
  { x: 0, y: 1.46, z: -0.005, rx: 0.15, rz: 0.088 },
  { x: 0, y: 1.5, z: 0, rx: 0.07, rz: 0.06 },
];
const ARM_KEYS = [
  { s: 0, rx: 0.056, rz: 0.058 }, { s: 0.2, rx: 0.05, rz: 0.054 }, { s: 0.45, rx: 0.038, rz: 0.04 },
  { s: 0.52, rx: 0.037, rz: 0.039 }, { s: 0.62, rx: 0.04, rz: 0.04 }, { s: 0.82, rx: 0.032, rz: 0.03 }, { s: 1, rx: 0.024, rz: 0.022 },
];
const LEG_KEYS = [
  { s: 0, rx: 0.095, rz: 0.1, dz: 0 }, { s: 0.15, rx: 0.085, rz: 0.09, dz: 0.005 }, { s: 0.35, rx: 0.066, rz: 0.07, dz: 0.01 },
  { s: 0.5, rx: 0.05, rz: 0.052, dz: 0.012 }, { s: 0.62, rx: 0.052, rz: 0.058, dz: -0.008 },
  { s: 0.8, rx: 0.04, rz: 0.042, dz: -0.004 }, { s: 1, rx: 0.03, rz: 0.032, dz: 0 },
];
const OUTFITS = {
  tri: { sleeve: 0.2, leg: 0.3 },
  helm: { sleeve: 0.2, leg: 0.3, helmet: true, belt: true },
  cyc: { sleeve: 0.36, leg: 0.42 },
  run: { sleeve: 0, leg: 0.2, cap: true },
};

function buildFigure(outfitId, skin) {
  const o = OUTFITS[outfitId];
  const group = new THREE.Group();
  const parts = {};
  const add = (m, name) => { if (name) { m.name = name; parts[name] = m; } group.add(m); return m; };

  const torsoRings = sampleKeys(TORSO_KEYS, 44).map((r) => ({ ...r, v: tv(r.y) }));
  const torsoTex = torsoTextures(outfitId);
  const fabricTorso = fabricMaterial(torsoTex);

  add(new THREE.Mesh(tube(torsoRings, 64, 0.975), skin));
  add(new THREE.Mesh(tube(torsoRings, 64), fabricTorso), "torso");
  add(ellipsoid(0.12, 0.07, 0.085, 0, 0.85, -0.003, new THREE.MeshPhysicalMaterial({ color: outfitId === "tri" || outfitId === "helm" ? BASE : DARK, roughness: 0.6, sheen: 0.5, sheenColor: new THREE.Color("#9aa4b2") })));

  // Neck and head
  add(new THREE.Mesh(tube(sampleKeys([
    { x: 0, y: 1.44, z: 0, rx: 0.058, rz: 0.054 }, { x: 0, y: 1.53, z: 0.005, rx: 0.05, rz: 0.048 }, { x: 0, y: 1.62, z: 0.01, rx: 0.048, rz: 0.048 },
  ], 10), 32), skin));
  add(ellipsoid(0.085, 0.108, 0.1, 0, 1.67, 0.012, skin));

  // Arms
  for (const side of [1, -1]) {
    const S = [0.205 * side, 1.42, -0.005], Wr = [0.355 * side, 0.83, 0.03];
    add(new THREE.Mesh(tube(limbRings(S, Wr, ARM_KEYS, 40), 40), skin));
    add(ellipsoid(0.03, 0.065, 0.045, 0.372 * side, 0.765, 0.035, skin));
    const shoulderMat = o.sleeve ? fabricMaterial(limbTextures("sleeve", side > 0 ? 0 : 0.5, outfitId)) : skin;
    add(ellipsoid(0.064, 0.064, 0.062, 0.196 * side, 1.415, -0.005, o.sleeve ? new THREE.MeshPhysicalMaterial({ color: outfitId === "cyc" ? BASE2 : BASE, roughness: 0.6, sheen: 0.5, sheenColor: new THREE.Color("#9aa4b2") }) : skin));
    if (o.sleeve) {
      const rings = limbRings(S, Wr, ARM_KEYS, 16, -0.03, o.sleeve);
      add(new THREE.Mesh(tube(rings, 40, 1.08), shoulderMat), side > 0 ? "sleeveL" : "sleeveR");
    }
  }

  // Legs
  for (const side of [1, -1]) {
    const Hp = [0.09 * side, 0.93, 0], A = [0.105 * side, 0.09, 0];
    add(new THREE.Mesh(tube(limbRings(Hp, A, LEG_KEYS, 50), 40), skin));
    add(ellipsoid(0.045, 0.042, 0.115, 0.108 * side, 0.045, 0.045, skin));
    const rings = limbRings(Hp, A, LEG_KEYS, 16, -0.04, o.leg);
    add(new THREE.Mesh(tube(rings, 40, 1.05), fabricMaterial(limbTextures("leg", side > 0 ? 0 : 0.5, outfitId))), side > 0 ? "legL" : "legR");
  }

  if (o.cap) {
    const capMat = new THREE.MeshPhysicalMaterial({ color: "#9aa2ad", roughness: 0.9, sheen: 0.3, envMapIntensity: 0.3 });
    add(ellipsoid(0.094, 0.085, 0.108, 0, 1.69, 0.012, capMat, { theta: Math.PI / 2 }), "cap");
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 48, 1, false, -Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ color: RED, roughness: 0.5 }));
    brim.scale.set(0.09, 0.006, 0.08);
    brim.rotation.y = Math.PI / 2;
    brim.position.set(0, 1.69, 0.09);
    add(brim);
  }

  if (o.helmet) {
    const shell = new THREE.MeshPhysicalMaterial({ color: "#aeb5bf", roughness: 0.4, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.25, envMapIntensity: 0.25 });
    const h = add(ellipsoid(0.112, 0.1, 0.2, 0, 1.712, -0.06, shell), "helmet");
    h.rotation.x = 0.18;
    const visor = ellipsoid(0.098, 0.05, 0.06, 0, 1.655, 0.075, new THREE.MeshPhysicalMaterial({ color: "#3a0a12", metalness: 0.9, roughness: 0.12, clearcoat: 1 }));
    add(visor);
  }

  if (o.belt) {
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.168, 0.013, 16, 96), new THREE.MeshStandardMaterial({ color: "#0b0c10", roughness: 0.8 }));
    belt.rotation.x = Math.PI / 2;
    belt.scale.set(1, 0.72, 1);
    belt.position.set(0, 1.06, 0.004);
    add(belt, "belt");
    const bib = new THREE.Mesh(
      new THREE.PlaneGeometry(0.16, 0.11),
      new THREE.MeshBasicMaterial({
        map: canvasTex(320, 220, (g, W, H) => {
          g.fillStyle = "#f2f4f7"; g.fillRect(0, 0, W, H);
          g.fillStyle = RED; g.fillRect(0, 0, W, 36);
          g.fillStyle = "#0d0f13"; g.font = "800 120px Archivo, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
          g.fillText("27", W / 2, H / 2 + 20);
        }),
        color: new THREE.Color(0.55, 0.55, 0.55),
      })
    );
    bib.position.set(0, 1.03, 0.132);
    bib.rotation.x = -0.08;
    add(bib);
  }
  return { group, parts };
}

// ── Bike ─────────────────────────────────────────────────────

function buildBike() {
  const group = new THREE.Group();
  const parts = {};
  const carbon = new THREE.MeshPhysicalMaterial({ color: "#101318", roughness: 0.28, metalness: 0.4, clearcoat: 1, clearcoatRoughness: 0.15 });
  const metal = new THREE.MeshStandardMaterial({ color: "#8a94a3", roughness: 0.3, metalness: 0.9 });
  const tyre = new THREE.MeshStandardMaterial({ color: "#0a0b0d", roughness: 0.9 });
  const add = (m, name) => { if (name) { m.name = name; parts[name] = m; } group.add(m); return m; };

  const RH = [-0.52, 0.34, 0], FH = [0.52, 0.34, 0], BB = [-0.05, 0.3, 0], SC = [-0.18, 0.86, 0], HT = [0.4, 0.84, 0], HB = [0.43, 0.68, 0];
  add(rod(BB, HB, 0.03, carbon), "downtube");
  add(rod(SC, HT, 0.022, carbon), "toptube");
  add(rod(BB, SC, 0.026, carbon), "seattube");
  add(rod(HB, [0.408, 0.88, 0], 0.03, carbon));
  for (const z of [0.04, -0.04]) {
    add(rod([BB[0], BB[1], z * 0.6], [RH[0], RH[1], z], 0.012, carbon));
    add(rod([SC[0] + 0.01, SC[1] - 0.06, z * 0.4], [RH[0], RH[1], z], 0.011, carbon));
    add(rod([HB[0], HB[1], z * 0.5], [FH[0], FH[1], z], 0.014, carbon));
  }
  add(rod(SC, [-0.215, 1.0, 0], 0.016, carbon));
  const saddle = ellipsoid(0.13, 0.018, 0.045, -0.215, 1.015, 0, carbon);
  saddle.scale.set(0.13, 0.018, 0.04);
  add(saddle);
  // Aero bars
  add(rod([0.408, 0.88, 0], [0.47, 0.9, 0], 0.016, carbon));
  for (const z of [0.07, -0.07]) {
    add(rod([0.44, 0.9, z], [0.66, 0.93, z * 0.5], 0.011, carbon));
    add(rod([0.44, 0.9, z * 2.2], [0.44, 0.9, -z * 2.2], 0.012, carbon));
  }
  // Rear disc
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.325, 0.325, 0.028, 96), new THREE.MeshPhysicalMaterial({ color: "#14171d", roughness: 0.35, metalness: 0.3, clearcoat: 0.8 }));
  disc.rotation.x = Math.PI / 2;
  disc.position.set(...RH);
  add(disc, "disc");
  // Front deep rim
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.03, 16, 96), carbon);
  rim.scale.set(1, 1, 0.45);
  rim.position.set(...FH);
  add(rim);
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    add(rod(FH, [FH[0] + Math.cos(a) * 0.27, FH[1] + Math.sin(a) * 0.27, (k % 2 ? 0.012 : -0.012)], 0.0025, metal));
  }
  for (const H of [RH, FH]) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.338, 0.016, 16, 96), tyre);
    t.position.set(...H);
    add(t);
    const glow = new THREE.Mesh(new THREE.TorusGeometry(0.318, 0.0025, 8, 160), new THREE.MeshBasicMaterial({ color: new THREE.Color(RED).multiplyScalar(GLOW), toneMapped: false }));
    glow.position.set(H[0], H[1], 0.018);
    add(glow);
  }
  // Crank
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.008, 8, 64), metal);
  ring.position.set(BB[0], BB[1], 0.05);
  add(ring);
  add(rod([BB[0], BB[1], 0.06], [BB[0] + 0.06, BB[1] - 0.16, 0.06], 0.012, carbon));
  return { group, parts };
}

// ── Spot decal artwork ───────────────────────────────────────

const logoCache = new Map();
function loadLogo(src, onload) {
  if (logoCache.has(src)) return logoCache.get(src);
  const img = new Image();
  img.onload = onload;
  img.src = src;
  logoCache.set(src, img);
  return img;
}

function drawSpot(ctx, W, H, st, redraw) {
  ctx.clearRect(0, 0, W, H);
  const m = Math.max(3, Math.round(Math.min(W, H) * 0.05));
  if (st.status === "sold") {
    ctx.fillStyle = "rgba(236,239,244,0.96)";
    ctx.fillRect(0, 0, W, H);
    if (st.logo) {
      const img = loadLogo(st.logo, redraw);
      if (img.complete && img.naturalWidth) {
        const s = Math.min((W - m * 4) / img.naturalWidth, (H - m * 4) / img.naturalHeight);
        ctx.drawImage(img, (W - img.naturalWidth * s) / 2, (H - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
      }
    } else {
      ctx.fillStyle = "#0d0f13";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let fs = H * 0.5;
      ctx.font = `800 ${fs}px Archivo, sans-serif`;
      const tw = ctx.measureText(st.sponsor).width;
      if (tw > W * 0.86) fs *= (W * 0.86) / tw;
      ctx.font = `800 ${fs}px Archivo, sans-serif`;
      ctx.fillText(st.sponsor, W / 2, H / 2 + fs * 0.04);
    }
    return;
  }
  const picked = st.status === "picked";
  ctx.fillStyle = picked ? "rgba(239,43,69,0.92)" : st.hover ? "rgba(239,43,69,0.42)" : "rgba(239,43,69,0.14)";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = picked ? "#ffffff" : RED;
  ctx.lineWidth = m;
  ctx.setLineDash(picked || st.hover ? [] : [m * 3, m * 2]);
  ctx.strokeRect(m / 2, m / 2, W - m, H - m);
  ctx.setLineDash([]);
  // Corner ticks, like a viewfinder
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = m * 0.8;
  const t = Math.min(W, H) * 0.22;
  for (const [x, y, dx, dy] of [[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]]) {
    ctx.beginPath();
    ctx.moveTo(x + dx * m * 0.4, y + dy * t);
    ctx.lineTo(x + dx * m * 0.4, y + dy * m * 0.4);
    ctx.lineTo(x + dx * t, y + dy * m * 0.4);
    ctx.stroke();
  }
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${Math.round(Math.min(H * 0.55, W * 0.22))}px "Hanken Grotesk", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(picked ? `${st.code} ✓` : st.code, W / 2, H / 2);
}

// ── Stage ────────────────────────────────────────────────────

export function createStage(canvas, { getSpotState, onHover, onPick, onAngle }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  } catch (e) {
    return null;
  }
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#06080b");
  scene.fog = new THREE.Fog("#06080b", 5, 11);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  scene.environmentIntensity = 0.35;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 40);
  camera.position.set(0, 1.05, 4.2);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 1.2;
  controls.maxDistance = 6;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = 1.75;
  controls.autoRotate = !reduceMotion;
  controls.autoRotateSpeed = 0.9;
  controls.target.set(0, 0.95, 0);

  // Lights: soft front key, red and ice-blue rims from behind.
  scene.add(new THREE.HemisphereLight("#9fb4d0", "#0a0a0a", 0.35));
  const key = new THREE.DirectionalLight("#ffffff", 1.6);
  key.position.set(1.5, 3, 4);
  scene.add(key);
  const rimR = new THREE.DirectionalLight("#ff2d46", 2.4);
  rimR.position.set(-3, 2, -3);
  scene.add(rimR);
  const rimB = new THREE.DirectionalLight("#86b6ff", 2.2);
  rimB.position.set(3, 1.5, -2.5);
  scene.add(rimB);
  const fill = new THREE.DirectionalLight("#dfe6f0", 0.5);
  fill.position.set(-2, 0.5, 3);
  scene.add(fill);

  // Turntable
  const floor = new THREE.Group();
  const grid = new THREE.PolarGridHelper(1.4, 12, 6, 96, "#3a1a20", "#1a1e26");
  grid.material.transparent = true;
  grid.material.opacity = 0.7;
  floor.add(grid);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.79, 0.8, 128),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(RED).multiplyScalar(3.4), toneMapped: false, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.002;
  floor.add(ring);
  const ticks = new THREE.Group();
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const len = i % 6 ? 0.03 : 0.08;
    const tk = new THREE.Mesh(new THREE.PlaneGeometry(0.006, len), new THREE.MeshBasicMaterial({ color: "#5b6573", side: THREE.DoubleSide }));
    tk.rotation.x = -Math.PI / 2;
    tk.rotation.z = -a;
    tk.position.set(Math.sin(a) * (0.85 + len / 2), 0.002, Math.cos(a) * (0.85 + len / 2));
    ticks.add(tk);
  }
  floor.add(ticks);
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.7, 64),
    new THREE.MeshBasicMaterial({
      map: canvasTex(256, 256, (g, W, H) => {
        const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
        gr.addColorStop(0, "rgba(0,0,0,0.85)");
        gr.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = gr;
        g.fillRect(0, 0, W, H);
      }),
      transparent: true,
      depthWrite: false,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.001;
  floor.add(shadow);
  scene.add(floor);

  // Post-processing
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.6, 0.4, 1.0);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const skin = new THREE.MeshPhysicalMaterial({ color: "#4a525e", roughness: 0.3, metalness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2 });

  let model = null;
  let decals = []; // { id, mesh, ctx, tex, W, H, spot }
  let current = null;

  function disposeModel() {
    if (!model) return;
    scene.remove(model.group);
    model.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && o.material !== skin) {
        for (const k of ["map", "emissiveMap"]) if (o.material[k]) o.material[k].dispose();
        o.material.dispose();
      }
    });
    decals.forEach((d) => { d.mesh.geometry.dispose(); d.tex.dispose(); d.mesh.material.dispose(); scene.remove(d.mesh); });
    decals = [];
  }

  const helper = new THREE.Object3D();
  const ray = new THREE.Raycaster();

  function placeDecal(spot) {
    const target = model.parts[spot.on];
    if (!target) return;
    ray.set(new THREE.Vector3(...spot.from), new THREE.Vector3(...spot.dir).normalize());
    const hit = ray.intersectObject(target, false)[0];
    if (!hit) return;
    const n = hit.face.normal.clone().transformDirection(target.matrixWorld);
    // Use the inverse ray direction for a stable orientation on curved surfaces.
    const facing = new THREE.Vector3(...spot.dir).negate().normalize().lerp(n, 0.35).normalize();
    helper.position.copy(hit.point);
    helper.up.set(0, 1, 0);
    if (Math.abs(facing.y) > 0.9) helper.up.set(0, 0, -1);
    helper.lookAt(hit.point.clone().add(facing));
    helper.rotateZ(THREE.MathUtils.degToRad(spot.roll || 0));
    const depth = Math.max(spot.w, spot.h) * 0.9;
    const geo = new DecalGeometry(target, hit.point, helper.rotation.clone(), new THREE.Vector3(spot.w, spot.h, depth));

    const W = 512, H = Math.max(96, Math.round((512 * spot.h) / spot.w));
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, toneMapped: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.spotId = spot.id;
    mesh.renderOrder = 2;
    scene.add(mesh);
    const d = { id: spot.id, mesh, ctx: c.getContext("2d"), tex, W, H, spot, point: hit.point.clone() };
    decals.push(d);
    paint(d);
  }

  function paint(d) {
    const st = getSpotState(d.id);
    drawSpot(d.ctx, d.W, d.H, st, () => paint(d));
    d.mesh.material.color.setScalar(st.status === "sold" ? 0.62 : st.status === "picked" ? 1.6 : st.hover ? GLOW : GLOW * 0.75);
    d.tex.needsUpdate = true;
  }

  // Camera tween
  let tween = null;
  let idleTimer = null;
  function pauseAuto(ms = 5000) {
    controls.autoRotate = false;
    clearTimeout(idleTimer);
    if (!reduceMotion) idleTimer = setTimeout(() => (controls.autoRotate = true), ms);
  }
  function flyTo({ theta, phi, radius, targetY }, ms = 1000) {
    const off = camera.position.clone().sub(controls.target);
    const sph = new THREE.Spherical().setFromVector3(off);
    let dTheta = ((theta - sph.theta + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    const from = { theta: sph.theta, phi: sph.phi, radius: sph.radius, y: controls.target.y };
    const to = { theta: sph.theta + dTheta, phi: phi ?? sph.phi, radius: radius ?? sph.radius, y: targetY ?? controls.target.y };
    tween = { from, to, start: performance.now(), ms: reduceMotion ? 1 : ms };
  }

  const FRAMING = {
    suit: { y: 0.95, radius: 4.1, phi: 1.45 },
    bike: { y: 0.55, radius: 3.9, phi: 1.42 },
  };

  function setTab(tab, spots, { intro = false } = {}) {
    disposeModel();
    current = tab;
    model = tab.scene === "bike" ? buildBike() : buildFigure(tab.outfit, skin);
    scene.add(model.group);
    model.group.updateMatrixWorld(true);
    spots.forEach(placeDecal);
    const f = FRAMING[tab.scene];
    if (intro && !reduceMotion) {
      camera.position.set(0, f.y + 0.4, -f.radius - 1.5);
      controls.target.set(0, f.y, 0);
      flyTo({ theta: 0.5, phi: f.phi, radius: f.radius, targetY: f.y }, 2200);
    } else {
      flyTo({ theta: Math.atan2(camera.position.x, camera.position.z), phi: f.phi, radius: f.radius, targetY: f.y }, 700);
    }
  }

  function refresh(id) {
    decals.filter((d) => !id || d.id === id).forEach(paint);
  }

  function focusSpot(id) {
    const d = decals.find((x) => x.id === id);
    if (!d) return;
    const dir = new THREE.Vector3(...d.spot.from).sub(d.point);
    const f = FRAMING[current.scene];
    const top = Math.abs(d.spot.dir[1]) > 0.9;
    pauseAuto(6000);
    flyTo({
      theta: top ? Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z) : Math.atan2(dir.x, dir.z),
      phi: top ? 0.5 : 1.5,
      radius: current.scene === "bike" ? 2.8 : 2.3,
      targetY: current.scene === "bike" ? f.y : THREE.MathUtils.clamp(d.point.y, 0.7, 1.6),
    }, 900);
  }

  function setView(name) {
    const f = FRAMING[current.scene];
    const theta = { front: 0, side: Math.PI / 2, back: Math.PI }[name];
    pauseAuto(6000);
    flyTo({ theta, phi: f.phi, radius: f.radius, targetY: f.y }, 900);
  }

  function nudge(rad) {
    if (tween || !controls.autoRotate) return;
    const off = camera.position.clone().sub(controls.target);
    off.applyAxisAngle(new THREE.Vector3(0, 1, 0), rad);
    camera.position.copy(controls.target).add(off);
  }

  // Interaction
  const pointer = new THREE.Vector2();
  let hoverId = null, downAt = null, needsPick = false;
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    needsPick = true;
  });
  canvas.addEventListener("pointerleave", () => { setHoverInternal(null); });
  canvas.addEventListener("pointerdown", (e) => { downAt = [e.clientX, e.clientY]; });
  canvas.addEventListener("pointerup", (e) => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
    downAt = null;
    if (moved > 6) return;
    const r = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const id = pickAt();
    if (id) { pauseAuto(6000); onPick(id); }
  });
  controls.addEventListener("start", () => { tween = null; pauseAuto(5000); });

  const pickRay = new THREE.Raycaster();
  function pickAt() {
    pickRay.setFromCamera(pointer, camera);
    const occluders = model ? [model.group] : [];
    const hits = pickRay.intersectObjects([...decals.map((d) => d.mesh), ...occluders], true);
    const first = hits[0];
    if (!first || first.object.userData.spotId == null) {
      // A decal sits on top of its surface; accept it if it's within a hair of the first hit.
      const dec = hits.find((h) => h.object.userData.spotId != null);
      if (dec && first && dec.distance - first.distance < 0.02) return dec.object.userData.spotId;
      return null;
    }
    return first.object.userData.spotId;
  }

  function setHoverInternal(id) {
    if (id === hoverId) return;
    hoverId = id;
    canvas.style.cursor = id && getSpotState(id).status !== "sold" ? "pointer" : "grab";
    onHover(id);
  }

  // Render loop
  const clock = new THREE.Clock();
  let lastAngle = 0;
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  renderer.setAnimationLoop(() => {
    const dt = clock.getDelta();
    if (!visible) return;
    if (tween) {
      const k = Math.min(1, (performance.now() - tween.start) / tween.ms);
      const e = 1 - Math.pow(1 - k, 3);
      const L = (a, b) => a + (b - a) * e;
      controls.target.y = L(tween.from.y, tween.to.y);
      const sph = new THREE.Spherical(L(tween.from.radius, tween.to.radius), L(tween.from.phi, tween.to.phi), L(tween.from.theta, tween.to.theta));
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph));
      if (k >= 1) tween = null;
    }
    if (!tween) controls.update(dt);
    else camera.lookAt(controls.target);
    if (needsPick && !downAt) { needsPick = false; setHoverInternal(pickAt()); }
    ticks.rotation.y += dt * 0.05;
    const now = performance.now();
    if (now - lastAngle > 100) {
      lastAngle = now;
      const a = THREE.MathUtils.radToDeg(Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z));
      onAngle((a + 360) % 360);
    }
    composer.render();
  });

  return { setTab, refresh, focusSpot, setView, nudge };
}
