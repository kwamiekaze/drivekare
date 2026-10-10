import {
  BoxGeometry, BufferAttribute, BufferGeometry, CylinderGeometry, SphereGeometry, Float32BufferAttribute,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { tireGeometry } from "../garage/Car";
import type { Body } from "./layout";

/**
 * Cars as lofted surfaces. The body is a smooth skin swept along the car's
 * length: at each station a rounded cross-section is sized from the plan
 * width, the body-top line and the floor line, with real wheel arches cut into
 * the floor. A second loft makes the glasshouse. Result: curved paint, tumblehome,
 * rounded noses and arches, instead of extruded boxes.
 */

type Keys = ReadonlyArray<readonly [number, number]>;

/** Cubic Hermite through the keys (tangents from neighbours), clamped at the ends. */
function curve(keys: Keys) {
  const n = keys.length;
  const m = keys.map((_, i) => {
    const a = keys[Math.max(0, i - 1)]!;
    const b = keys[Math.min(n - 1, i + 1)]!;
    return b[0] === a[0] ? 0 : (b[1] - a[1]) / (b[0] - a[0]);
  });
  return (x: number) => {
    if (x <= keys[0]![0]) return keys[0]![1];
    if (x >= keys[n - 1]![0]) return keys[n - 1]![1];
    let i = 0;
    while (keys[i + 1]![0] < x) i += 1;
    const [x0, y0] = keys[i]!;
    const [x1, y1] = keys[i + 1]!;
    const h = x1 - x0;
    const t = (x - x0) / h;
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * m[i]! + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * m[i + 1]!;
  };
}

export interface Spec {
  L: number; W: number; H: number; gc: number; wb: number; wr: number;
  /** body-top line (hood, belt, boot) as [x, y] */
  top: Keys;
  /** glasshouse roofline as [x, y]; ends sit on the belt */
  roof: Keys;
  /** how far the nose and tail are rounded in plan */
  noseR: number; tailR: number;
  /** width of the glasshouse at the belt relative to the body */
  cabinW: number;
}

export const SPECS: Record<Body | "van", Spec> = {
  sedan: {
    L: 4.8, W: 1.86, H: 1.44, gc: 0.17, wb: 2.85, wr: 0.34, noseR: 0.62, tailR: 0.5, cabinW: 0.86,
    top: [[-2.4, 0.84], [-2.25, 0.93], [-1.7, 0.97], [-1.0, 0.97], [0.95, 0.95], [1.4, 0.84], [2.0, 0.75], [2.4, 0.6]],
    roof: [[-1.45, 0.97], [-1.1, 1.3], [-0.6, 1.42], [0.0, 1.44], [0.45, 1.34], [0.95, 0.97]],
  },
  hatch: {
    L: 4.1, W: 1.8, H: 1.5, gc: 0.17, wb: 2.5, wr: 0.33, noseR: 0.55, tailR: 0.35, cabinW: 0.88,
    top: [[-2.05, 0.9], [-1.9, 0.95], [-1.0, 0.95], [0.75, 0.94], [1.25, 0.82], [1.7, 0.72], [2.05, 0.58]],
    roof: [[-1.88, 0.95], [-1.65, 1.3], [-1.1, 1.48], [-0.1, 1.5], [0.4, 1.36], [0.78, 0.96]],
  },
  suv: {
    L: 4.85, W: 1.96, H: 1.78, gc: 0.23, wb: 2.9, wr: 0.38, noseR: 0.6, tailR: 0.4, cabinW: 0.9,
    top: [[-2.42, 1.0], [-2.28, 1.1], [-1.5, 1.12], [0.9, 1.1], [1.4, 1.02], [2.0, 0.92], [2.42, 0.72]],
    roof: [[-2.3, 1.1], [-2.15, 1.55], [-1.7, 1.77], [-0.2, 1.78], [0.45, 1.68], [0.95, 1.12]],
  },
  pickup: {
    L: 5.4, W: 2.0, H: 1.86, gc: 0.26, wb: 3.3, wr: 0.4, noseR: 0.62, tailR: 0.2, cabinW: 0.9,
    top: [[-2.7, 1.04], [-0.75, 1.05], [-0.62, 1.12], [0.7, 1.13], [1.35, 1.06], [2.1, 0.95], [2.7, 0.75]],
    roof: [[-0.7, 1.13], [-0.55, 1.62], [-0.2, 1.85], [0.4, 1.86], [0.75, 1.55], [0.98, 1.13]],
  },
  van: {
    L: 6.0, W: 2.05, H: 2.55, gc: 0.3, wb: 3.4, wr: 0.4, noseR: 0.6, tailR: 0.2, cabinW: 0.9,
    top: [[-3.0, 2.45], [-2.9, 2.55], [1.35, 2.55], [1.6, 2.3], [2.1, 1.4], [2.5, 1.05], [3.0, 0.8]],
    roof: [],
  },
};

const sgnPow = (v: number, e: number) => Math.sign(v) * Math.pow(Math.abs(v), e);

interface LoftOpts {
  xs: number[];
  hw: (x: number) => number;
  yb: (x: number) => number;
  yt: (x: number) => number;
  /** superellipse exponent: 2 = ellipse, higher = squarer */
  n: number;
  /** how much narrower the top of the section is than the middle */
  shrink: number;
  /** half sections only start at the bottom edge and go over the top */
  half?: boolean;
  zone: (x: number, ring: number, rings: number, y: number, yb: number, yt: number) => number;
  zones: number;
  rings?: number;
}

/** Sweep a rounded section along x, one geometry per material zone (positions and normals are shared). */
function loft(o: LoftOpts): BufferGeometry[] {
  const M = o.rings ?? 36;
  const N = o.xs.length;
  const pos: number[] = [];
  for (let i = 0; i < N; i += 1) {
    const x = o.xs[i]!;
    const hw = o.hw(x), yb = o.yb(x), yt = o.yt(x);
    const ymid = o.half ? yb : (yb + yt) / 2;
    const hh = o.half ? yt - yb : (yt - yb) / 2;
    for (let j = 0; j < M; j += 1) {
      const a = o.half ? (j / (M - 1)) * Math.PI : (j / M) * Math.PI * 2;
      const c = sgnPow(Math.cos(a), 2 / o.n);
      const s = sgnPow(Math.sin(a), 2 / o.n);
      const z = hw * c * (1 - o.shrink * Math.max(0, s));
      pos.push(x, ymid + hh * s, z);
    }
  }
  const full = new BufferGeometry();
  full.setAttribute("position", new Float32BufferAttribute(pos, 3));
  const idx: number[] = [];
  const zoneIdx: number[][] = Array.from({ length: o.zones }, () => []);
  const jmax = o.half ? M - 1 : M;
  for (let i = 0; i < N - 1; i += 1) {
    for (let j = 0; j < jmax; j += 1) {
      const j2 = (j + 1) % M;
      const a = i * M + j, b = (i + 1) * M + j, c = (i + 1) * M + j2, d = i * M + j2;
      const x = (o.xs[i]! + o.xs[i + 1]!) / 2;
      const yb = o.yb(x), yt = o.yt(x);
      const py = pos[a * 3 + 1]!;
      const zn = o.zone(x, j, M, py, yb, yt);
      zoneIdx[zn]!.push(a, b, d, b, c, d);
      idx.push(a, b, d, b, c, d);
    }
  }
  full.setIndex(idx);
  full.computeVertexNormals();
  const normal = full.getAttribute("normal") as BufferAttribute;
  const position = full.getAttribute("position") as BufferAttribute;
  return zoneIdx.map((ix) => {
    const g = new BufferGeometry();
    g.setAttribute("position", position);
    g.setAttribute("normal", normal);
    g.setIndex(ix);
    return g;
  });
}

const spacing = (a: number, b: number, n: number) =>
  Array.from({ length: n }, (_, i) => (a + b) / 2 + ((b - a) / 2) * -Math.cos((Math.PI * i) / (n - 1)));

/** Plan-view taper: rounded nose and tail, so the section closes to a point. */
function plan(L: number, noseR: number, tailR: number) {
  const lo = L / 2;
  return (x: number) => {
    const r = x > 0 ? noseR : tailR;
    const u = Math.max(0, (Math.abs(x) - (lo - r)) / r);
    const p = x > 0 ? 2.4 : 3;
    return Math.pow(Math.max(0, 1 - Math.pow(Math.min(u, 1), p)), 1 / p);
  };
}

export interface CarParts {
  spec: Spec;
  paint: BufferGeometry;
  trim: BufferGeometry;
  glass: BufferGeometry;
  tires: BufferGeometry;
  rims: BufferGeometry;
  heads: BufferGeometry;
  tails: BufferGeometry;
  bed?: BufferGeometry;
  /** one tire and one rim, axis along z, for cars whose wheels move individually */
  tire1: BufferGeometry;
  rim1: BufferGeometry;
}

export function wheelParts(r: number, w: number) {
  const tire = tireGeometry(r, w).rotateY(Math.PI / 2);
  const rimR = r * 0.68;
  const bits: BufferGeometry[] = [];
  const barrel = new CylinderGeometry(rimR, rimR, w * 0.82, 20, 1, true).rotateX(Math.PI / 2);
  bits.push(barrel);
  const disc = new CylinderGeometry(rimR * 0.96, rimR * 0.96, 0.02, 20).rotateX(Math.PI / 2);
  disc.translate(0, 0, w * 0.34);
  bits.push(disc);
  for (let k = 0; k < 5; k += 1) {
    const sp = new BoxGeometry(rimR * 0.86, rimR * 0.2, 0.03);
    sp.translate(rimR * 0.46, 0, w * 0.37);
    sp.rotateZ((k / 5) * Math.PI * 2);
    bits.push(sp);
  }
  const cap = new CylinderGeometry(rimR * 0.2, rimR * 0.2, 0.05, 14).rotateX(Math.PI / 2);
  cap.translate(0, 0, w * 0.39);
  bits.push(cap);
  const rim = mergeGeometries(bits.map((b) => (b.index ? b : b)), false)!;
  return { tire, rim };
}

const cache = new Map<string, CarParts>();

export function carParts(body: Body | "van"): CarParts {
  const hit = cache.get(body);
  if (hit) return hit;
  const sp = SPECS[body];
  const { L, W, gc, wr, wb } = sp;
  const lo = L / 2;
  const top = curve(sp.top);
  const roof = sp.roof.length ? curve(sp.roof) : null;
  const pl = plan(L, sp.noseR, sp.tailR);
  const archR = wr + 0.1;
  const arches = (x: number) => {
    let a = 0;
    for (const xw of [wb / 2, -wb / 2]) {
      const d = Math.abs(x - xw);
      if (d < archR) a = Math.max(a, Math.sqrt(archR * archR - d * d));
    }
    return a;
  };
  const yb = (x: number) => Math.min(gc + arches(x) * 0.98, top(x) - 0.3);
  const hw = (x: number) => Math.max(0.001, (W / 2) * pl(x));

  // lower body: zone 0 paint, zone 1 dark plastic on the lowest band and the bumper ends
  const bodyG = loft({
    xs: spacing(-lo, lo, 52),
    hw, yb, yt: top, n: 3.4, shrink: 0.1, rings: 36, zones: 2,
    zone: (x, _j, _m, y, b, t) => (y < b + (t - b) * 0.2 || (Math.abs(x) > lo - 0.22 && y < b + (t - b) * 0.45) ? 1 : 0),
  });

  // glasshouse
  let cabinGlass: BufferGeometry | null = null;
  let cabinRoof: BufferGeometry | null = null;
  if (roof) {
    const xr = sp.roof[0]![0], xf = sp.roof[sp.roof.length - 1]![0];
    const xs = spacing(xr, xf, 34);
    const cw = (W / 2) * sp.cabinW;
    const [g, r] = loft({
      xs,
      hw: (x) => cw * (0.55 + 0.45 * Math.sin(((x - xr) / (xf - xr)) * Math.PI)) * 0.98 + 0.02,
      yb: (x) => top(x) - 0.01,
      yt: (x) => Math.max(top(x) + 0.02, roof(x)),
      n: 2.8, shrink: 0.34, half: true, rings: 22, zones: 2,
      zone: (_x, j, M) => (j > M * 0.38 && j < M * 0.62 ? 1 : 0),
    }) as [BufferGeometry, BufferGeometry];
    cabinGlass = g;
    cabinRoof = r;
  }

  // wheels
  const { tire, rim } = wheelParts(wr, 0.26);
  const place = (g: BufferGeometry) =>
    [wb / 2, -wb / 2].flatMap((x) => [-1, 1].map((s) => g.clone().rotateY(s === -1 ? Math.PI : 0).translate(x, wr, s * (W / 2 - 0.2))));
  const tires = mergeGeometries(place(tire), false)!;
  const rims = mergeGeometries(place(rim), false)!;

  // lamps and small parts
  const lamp = (x: number, y: number, z: number, sx: number, sy: number, sz: number) => new SphereGeometry(1, 10, 8).scale(sx, sy, sz).translate(x, y, z);
  const hx = lo - sp.noseR * 0.55;
  const heads = mergeGeometries([-1, 1].map((s) => lamp(hx, top(hx) - 0.12, s * hw(hx) * 0.72, 0.14, 0.06, 0.2)), false)!;
  const tx = -lo + sp.tailR * 0.5;
  const tails = mergeGeometries([-1, 1].map((s) => lamp(tx, top(tx) - 0.14, s * hw(tx) * 0.75, 0.08, 0.07, 0.22)), false)!;

  const paintBits: BufferGeometry[] = [bodyG[0]!];
  if (cabinRoof) paintBits.push(cabinRoof);
  const trimBits: BufferGeometry[] = [bodyG[1]!];
  const grille = new BoxGeometry(0.06, 0.16, W * 0.34).translate(lo - sp.noseR * 0.25, top(lo - sp.noseR * 0.25) - 0.22, 0);
  trimBits.push(grille.toNonIndexed());
  const mirX = sp.roof.length ? sp.roof[sp.roof.length - 1]![0] - 0.25 : 1.6;
  const mirY = sp.roof.length ? top(mirX) + 0.12 : 1.5;
  for (const s of [-1, 1]) trimBits.push(new BoxGeometry(0.12, 0.1, 0.18).translate(mirX, mirY, s * ((W / 2) * sp.cabinW + 0.12)).toNonIndexed());

  const out: CarParts = {
    spec: sp,
    paint: mergeGeometries(paintBits.map((b) => (b.index ? b.toNonIndexed() : b)), false)!,
    trim: mergeGeometries(trimBits.map((b) => (b.index ? b.toNonIndexed() : b)), false)!,
    glass: cabinGlass ?? new BufferGeometry(),
    tires, rims, heads, tails,
    ...(() => {
      const t = wheelParts(wr, 0.26);
      return { tire1: t.tire, rim1: t.rim };
    })(),
  };
  if (body === "pickup") out.bed = new BoxGeometry(-0.75 + lo - 0.4, 0.02, W - 0.3).translate((-lo + 0.12 + -0.78) / 2, 1.06, 0);
  cache.set(body, out);
  return out;
}

