import { QuadraticBezierCurve3, Vector3 } from "three";
import { CUSTOMERS } from "@/content/lot";

/**
 * The lot, in metres. North is -z and the road runs down the east edge.
 * Three planter islands, each with a column of head-in bays on both sides,
 * and a drive aisle between them, as in the overhead photo the scene follows.
 */
export const SW = 3.0; // bay width, along z
export const SL = 5.4; // bay length, along x
export const SLOTS = 12;
export const PLANTER_W = 1.8;
export const AISLE_W = 6;
export const GROUP_W = SL * 2 + PLANTER_W;
export const PLANTER_X = [-18.6, 0, 18.6] as const;
export const AISLE_X = [-27.9, -9.3, 9.3, 27.9] as const;
export const Z0 = -(SLOTS * SW) / 2; // north end of the bays
export const Z1 = (SLOTS * SW) / 2;
export const LOT = { x0: -30.9, x1: 30.9, z0: -24, z1: 24 };
export const CROSS_SOUTH_Z = 21;
export const CROSS_NORTH_Z = -21;
/** Road lanes, west to east: two southbound, two northbound. */
export const LANES = [43, 46.5, 51.5, 55] as const;
export const ROAD = { x0: 41, x1: 58 };
/** Accessible bays: west column, south end. */
export const ACCESS = { col: 0, slots: [8, 9, 10] as const };

/** Six bay columns, west to east: [x of bay centre, facing]. facing +1 = nose east. */
export const COLUMNS = PLANTER_X.flatMap((px) => [
  { x: px - (PLANTER_W / 2 + SL / 2), facing: 1 as const, aisle: px - GROUP_W / 2 - AISLE_W / 2, side: -1 as const },
  { x: px + (PLANTER_W / 2 + SL / 2), facing: -1 as const, aisle: px + GROUP_W / 2 + AISLE_W / 2, side: 1 as const },
]);

export const slotZ = (slot: number) => Z0 + SW * (slot + 0.5);

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export type Body = "sedan" | "hatch" | "suv" | "pickup";
export interface Parked {
  key: string;
  x: number;
  z: number;
  yaw: number;
  body: Body;
  color: string;
}

const PAINTS = [
  "#f2f3f5", "#f2f3f5", "#f2f3f5", "#e4e6ea", "#18191c", "#18191c", "#26282d", "#8b9099", "#a9aeb6",
  "#1f3a63", "#3b64a8", "#a62b2b", "#5a1a22", "#2d4a3a", "#6b6f76", "#d7c9a6",
];
const BODIES: Body[] = ["sedan", "sedan", "sedan", "suv", "suv", "hatch", "pickup"];

/** Bays the bear's van needs next to each customer, so nobody parks in them. */
export function customerSlots() {
  return CUSTOMERS.map((c) => {
    const col = COLUMNS[c.col]!;
    // The van takes the neighbouring bay on the side with more room.
    const vanSlot = c.slot < SLOTS / 2 ? c.slot + 1 : c.slot - 1;
    return { id: c.id, col, slot: c.slot, vanSlot };
  });
}

export function parkedCars(): Parked[] {
  const r = rng(7);
  const taken = new Set<string>();
  customerSlots().forEach((c) => {
    taken.add(`${c.col.x}:${c.slot}`);
    taken.add(`${c.col.x}:${c.vanSlot}`);
  });
  const out: Parked[] = [];
  COLUMNS.forEach((col) => {
    for (let s = 0; s < SLOTS; s += 1) {
      const k = `${col.x}:${s}`;
      const roll = r();
      if (taken.has(k) || roll > 0.52) continue;
      if (col === COLUMNS[ACCESS.col] && (ACCESS.slots as readonly number[]).includes(s)) continue;
      out.push({
        key: k,
        x: col.x + col.facing * (r() * 0.35 - 0.1) - col.facing * 0.1,
        z: slotZ(s) + (r() - 0.5) * 0.28,
        yaw: col.facing === 1 ? (r() - 0.5) * 0.035 : Math.PI + (r() - 0.5) * 0.035,
        body: BODIES[Math.floor(r() * BODIES.length)]!,
        color: PAINTS[Math.floor(r() * PAINTS.length)]!,
      });
    }
  });
  return out;
}

/** Where a customer's car stands, and where the van and the bear go. */
export function customerPose(id: string) {
  const c = CUSTOMERS.find((x) => x.id === id)!;
  const info = customerSlots().find((x) => x.id === id)!;
  const col = info.col;
  const carPos = new Vector3(col.x - col.facing * 0.1, 0, slotZ(c.slot));
  const vanZ = slotZ(info.vanSlot);
  const vanPos = new Vector3(col.x - col.facing * 0.2, 0, vanZ);
  const yaw = col.facing === 1 ? 0 : Math.PI;
  // Bear works on the aisle-facing side of the pair, between car and van.
  const toVan = Math.sign(vanZ - carPos.z);
  return { carPos, vanPos, yaw, col, toVan, aisleX: col.aisle };
}

/** Heading to rotation.y for a model whose nose points +x. */
export const yawOf = (dx: number, dz: number) => Math.atan2(-dz, dx);

export interface PathData {
  curve: { getPointAt: (t: number, out: Vector3) => Vector3; getTangentAt: (t: number, out: Vector3) => Vector3 };
  length: number;
  /** distance along the path where the last corner (into the bay) begins */
  cornerStart: number;
}

/** Polyline with rounded corners, sampled by arc length. */
function rounded(points: Vector3[], radius: number): PathData {
  const parts: Array<{ len: number; at: (t: number, out: Vector3) => Vector3; tan: (t: number, out: Vector3) => Vector3 }> = [];
  let cursor = points[0]!.clone();
  const line = (a: Vector3, b: Vector3) => {
    const len = a.distanceTo(b);
    const dir = b.clone().sub(a).normalize();
    parts.push({ len, at: (t, o) => o.copy(a).lerp(b, t), tan: (_t, o) => o.copy(dir) });
  };
  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = points[i - 1]!;
    const p = points[i]!;
    const next = points[i + 1]!;
    const rin = Math.min(radius, prev.distanceTo(p) / 2, p.distanceTo(next) / 2);
    const a = p.clone().add(prev.clone().sub(p).normalize().multiplyScalar(rin));
    const b = p.clone().add(next.clone().sub(p).normalize().multiplyScalar(rin));
    line(cursor, a);
    const bez = new QuadraticBezierCurve3(a, p, b);
    parts.push({ len: bez.getLength(), at: (t, o) => bez.getPoint(t, o), tan: (t, o) => bez.getTangent(t, o) });
    cursor = b;
  }
  line(cursor, points[points.length - 1]!);
  const total = parts.reduce((s, p) => s + p.len, 0);
  const locate = (t: number) => {
    let d = Math.min(Math.max(t, 0), 1) * total;
    for (const p of parts) {
      if (d <= p.len || p === parts[parts.length - 1]) return { p, u: p.len ? Math.min(d / p.len, 1) : 0 };
      d -= p.len;
    }
    return { p: parts[0]!, u: 0 };
  };
  const n = parts.length;
  return {
    length: total,
    cornerStart: n >= 2 ? total - parts[n - 1]!.len - parts[n - 2]!.len : 0,
    curve: {
      getPointAt: (t, out) => {
        const { p, u } = locate(t);
        return p.at(u, out);
      },
      getTangentAt: (t, out) => {
        const { p, u } = locate(t);
        return p.tan(u, out).normalize();
      },
    },
  };
}

/** From the road, along the south cross-aisle, up the aisle, into the bay. */
export function arrivalPath(id: string): PathData {
  const { vanPos, aisleX } = customerPose(id);
  const z = vanPos.z;
  return rounded(
    [
      new Vector3(LANES[3], 0, 75),
      new Vector3(LANES[3], 0, CROSS_SOUTH_Z),
      new Vector3(aisleX, 0, CROSS_SOUTH_Z),
      new Vector3(aisleX, 0, z),
      new Vector3(vanPos.x, 0, z),
    ],
    4.2,
  );
}

/** After backing out: north up the aisle, east along the north cross-aisle, away. */
export function departurePath(id: string): PathData {
  const { vanPos, aisleX } = customerPose(id);
  return rounded(
    [
      new Vector3(aisleX, 0, vanPos.z + 4.2),
      new Vector3(aisleX, 0, CROSS_NORTH_Z),
      new Vector3(LANES[2], 0, CROSS_NORTH_Z),
      new Vector3(LANES[2], 0, -75),
    ],
    4.2,
  );
}

