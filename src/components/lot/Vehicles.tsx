import { useMemo } from "react";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { ThreeElements } from "@react-three/fiber";
import {
  BoxGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Shape,
  type BufferGeometry,
  type Material,
} from "three";
import { LogoDecal } from "../garage/Equipment";
import { DK } from "../garage/textures";
import type { Body } from "./layout";

/* ------------------------------------------------------------- shared kit */

/** Lamp materials every car shares; the scene drives their glow once a frame. */
export const sharedLights = {
  head: new MeshStandardMaterial({ color: "#f4f7ff", emissive: "#dbe8ff", emissiveIntensity: 0.1, toneMapped: false }),
  tail: new MeshStandardMaterial({ color: "#5a0b0b", emissive: "#ff2a1a", emissiveIntensity: 0.3, toneMapped: false }),
};
export const glassMat = new MeshPhysicalMaterial({ color: "#0d1117", metalness: 0.9, roughness: 0.08, clearcoat: 1 });
const tireMat = new MeshStandardMaterial({ color: "#121316", roughness: 0.9 });
const hubMat = new MeshStandardMaterial({ color: "#b9bec6", metalness: 0.9, roughness: 0.3 });
const trimMat = new MeshStandardMaterial({ color: "#16171a", roughness: 0.7 });
const bedMat = new MeshStandardMaterial({ color: "#17181b", roughness: 0.95 });

const paints = new Map<string, MeshPhysicalMaterial>();
export function paintFor(color: string) {
  let m = paints.get(color);
  if (!m) {
    m = new MeshPhysicalMaterial({ color, metalness: 0.55, roughness: 0.32, clearcoat: 0.85, clearcoatRoughness: 0.12 });
    paints.set(color, m);
  }
  return m;
}
export const newPaint = (color: string) =>
  new MeshPhysicalMaterial({ color, metalness: 0.55, roughness: 0.32, clearcoat: 0.85, clearcoatRoughness: 0.12 });

/* ------------------------------------------------------------------- cars */

interface Dims {
  L: number; W: number; H: number; gc: number;
  hb: number; hf: number; ht: number;
  cf: number; cr: number; tf: number; tr: number;
  wb: number; wr: number;
}
const DIMS: Record<Body, Dims> = {
  sedan: { L: 4.75, W: 1.86, H: 1.44, gc: 0.2, hb: 0.98, hf: 0.74, ht: 0.94, cf: 0.78, cr: -1.2, tf: 0.15, tr: -0.72, wb: 2.8, wr: 0.34 },
  hatch: { L: 4.1, W: 1.8, H: 1.5, gc: 0.2, hb: 0.96, hf: 0.74, ht: 1.0, cf: 0.66, cr: -1.7, tf: 0.0, tr: -1.6, wb: 2.5, wr: 0.33 },
  suv: { L: 4.85, W: 1.96, H: 1.78, gc: 0.28, hb: 1.12, hf: 0.9, ht: 1.14, cf: 0.86, cr: -2.2, tf: 0.2, tr: -2.1, wb: 2.9, wr: 0.38 },
  pickup: { L: 5.4, W: 2.0, H: 1.86, gc: 0.3, hb: 1.14, hf: 0.92, ht: 1.04, cf: 0.5, cr: -0.45, tf: -0.1, tr: -0.3, wb: 3.3, wr: 0.4 },
};
export const bodyDims = (b: Body) => DIMS[b];

function extrude(shape: Shape, depth: number, bevel: number) {
  const g = new ExtrudeGeometry(shape, {
    depth: depth - bevel * 2,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 6,
  });
  g.translate(0, 0, -(depth - bevel * 2) / 2);
  return g;
}

interface CarGeo { body: BufferGeometry; hood?: BufferGeometry; glass: BufferGeometry; roof: BufferGeometry; bed?: BufferGeometry; }
const geoCache = new Map<string, CarGeo>();
function carGeo(body: Body, hoodCut: boolean): CarGeo {
  const key = `${body}:${hoodCut}`;
  const hit = geoCache.get(key);
  if (hit) return hit;
  const d = DIMS[body];
  const lo = d.L / 2;
  const cut = hoodCut ? 0.1 : 0;
  const s = new Shape();
  s.moveTo(-lo, d.gc);
  s.lineTo(lo, d.gc);
  s.lineTo(lo, d.gc + 0.3);
  s.lineTo(lo - 0.1, d.hf - cut);
  s.lineTo(d.cf, d.hb - cut * (body === "pickup" ? 0.5 : 1));
  s.lineTo(d.cf - 0.02, d.hb);
  s.lineTo(d.cr, d.hb);
  if (body === "pickup") {
    s.lineTo(d.cr - 0.05, d.ht);
    s.lineTo(-lo, d.ht);
  } else {
    s.lineTo(-lo + 0.26, d.ht);
  }
  s.lineTo(-lo, d.ht - 0.12);
  s.closePath();
  const bodyG = extrude(s, d.W, 0.08);

  const gl = new Shape();
  gl.moveTo(d.cf - 0.02, d.hb - 0.02);
  gl.lineTo(d.tf, d.H - 0.06);
  gl.lineTo(d.tr, d.H - 0.06);
  gl.lineTo(d.cr + 0.04, d.hb - 0.02);
  gl.closePath();
  const glass = extrude(gl, d.W * 0.9, 0);

  const roof = new BoxGeometry(d.tf - d.tr + 0.02, 0.06, d.W * 0.91);
  roof.translate((d.tf + d.tr) / 2, d.H - 0.03, 0);

  const out: CarGeo = { body: bodyG, glass, roof };
  if (hoodCut) {
    const h = new Shape();
    h.moveTo(0, 0);
    h.lineTo(lo - 0.1 - d.cf, d.hf - d.hb);
    h.lineTo(lo - 0.1 - d.cf, d.hf - d.hb - 0.06);
    h.lineTo(0, -0.06);
    h.closePath();
    const hg = extrude(h, d.W * 0.97, 0.02);
    hg.translate(0, 0, 0);
    out.hood = hg;
  }
  if (body === "pickup") {
    const bed = new BoxGeometry(d.cr + lo - 0.3, 0.02, d.W - 0.26);
    bed.translate((d.cr - lo) / 2, d.ht + 0.015, 0);
    out.bed = bed;
  }
  geoCache.set(key, out);
  return out;
}

const wheelGeo = new CylinderGeometry(1, 1, 1, 20).rotateX(Math.PI / 2);

/**
 * Every part of a body style, merged by material, so a whole lot of parked
 * cars can be drawn as a handful of instanced meshes instead of hundreds of meshes.
 */
export interface MergedCar {
  paint: BufferGeometry;
  glass: BufferGeometry;
  tires: BufferGeometry;
  hubs: BufferGeometry;
  heads: BufferGeometry;
  tails: BufferGeometry;
  bed?: BufferGeometry;
}
const mergedCache = new Map<Body, MergedCar>();
export function mergedCar(body: Body): MergedCar {
  const hit = mergedCache.get(body);
  if (hit) return hit;
  const d = DIMS[body];
  const g = carGeo(body, false);
  const lo = d.L / 2;
  const wx = d.wb / 2;
  const wz = d.W / 2 - 0.1;
  const at = (geo: BufferGeometry, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => {
    const c = geo.clone().scale(sx, sy, sz).translate(x, y, z);
    return c;
  };
  const wheels = (r: number, w: number) =>
    [wx, -wx].flatMap((x) => [-1, 1].map((s) => at(wheelGeo, x, d.wr, s * wz, r, r, w)));
  const lamp = (x: number, y: number, sx: number, sz: number, z: number) => at(new BoxGeometry(sx, 0.1, sz), x, y, z);
  const merged: MergedCar = {
    paint: mergeGeometries([g.body.clone(), g.roof.clone().toNonIndexed()], false)!,
    glass: g.glass.clone(),
    tires: mergeGeometries(wheels(d.wr, 0.26), false)!,
    hubs: mergeGeometries(wheels(d.wr * 0.62, 0.27), false)!,
    heads: mergeGeometries([-1, 1].map((s) => lamp(lo - 0.04, d.hf - 0.12, 0.06, 0.4, s * d.W * 0.32)), false)!,
    tails: mergeGeometries([-1, 1].map((s) => lamp(-lo + 0.02, d.ht - 0.2, 0.05, 0.42, s * d.W * 0.34)), false)!,
  };
  if (g.bed) merged.bed = g.bed.clone();
  mergedCache.set(body, merged);
  return merged;
}
export const carMaterials = { tire: tireMat, hub: hubMat, bed: bedMat };
export const instancedPaint = new MeshPhysicalMaterial({ color: "#ffffff", metalness: 0.55, roughness: 0.32, clearcoat: 0.85, clearcoatRoughness: 0.12 });

export interface CarHandles {
  root?: Group | null;
  hood?: Group | null;
  wheels: Array<Group | null>;
}

export interface CarLights {
  head: Material;
  tail: Material;
  hazard?: Material;
}

export function ParkedCar({
  body,
  color,
  paint,
  hoodCut = false,
  lights,
  handles,
  ...props
}: {
  body: Body;
  color?: string;
  paint?: Material;
  hoodCut?: boolean;
  lights?: CarLights;
  handles?: CarHandles;
} & ThreeElements["group"]) {
  const d = DIMS[body];
  const geo = useMemo(() => carGeo(body, hoodCut), [body, hoodCut]);
  const mat = paint ?? paintFor(color ?? "#888");
  const head = lights?.head ?? sharedLights.head;
  const tail = lights?.tail ?? sharedLights.tail;
  const lo = d.L / 2;
  const wx = d.wb / 2;
  const wz = d.W / 2 - 0.1;
  return (
    <group {...props} ref={(g) => { if (handles) handles.root = g; }}>
      <mesh geometry={geo.body} material={mat} castShadow receiveShadow />
      {geo.hood && (
        <group position={[d.cf, d.hb, 0]} ref={(g) => { if (handles) handles.hood = g; }}>
          <mesh geometry={geo.hood} material={mat} castShadow />
        </group>
      )}
      {hoodCut && (
        <mesh position={[(d.cf + lo - 0.1) / 2, d.hb - 0.11, 0]} material={trimMat}>
          <boxGeometry args={[lo - 0.1 - d.cf - 0.1, 0.04, d.W * 0.8]} />
        </mesh>
      )}
      <mesh geometry={geo.glass} material={glassMat} castShadow />
      <mesh geometry={geo.roof} material={mat} castShadow />
      {geo.bed && <mesh geometry={geo.bed} material={bedMat} />}
      {([-1, 1] as const).map((s) => (
        <group key={s}>
          <mesh position={[lo - 0.04, d.hf - 0.12, s * d.W * 0.32]} material={head}>
            <boxGeometry args={[0.06, 0.1, 0.4]} />
          </mesh>
          <mesh position={[-lo + 0.02, d.ht - 0.2, s * d.W * 0.34]} material={tail}>
            <boxGeometry args={[0.05, 0.1, 0.42]} />
          </mesh>
          {lights?.hazard && (
            <>
              <mesh position={[lo - 0.03, d.hf - 0.2, s * d.W * 0.44]} material={lights.hazard}>
                <boxGeometry args={[0.06, 0.07, 0.1]} />
              </mesh>
              <mesh position={[-lo + 0.02, d.ht - 0.3, s * d.W * 0.44]} material={lights.hazard}>
                <boxGeometry args={[0.05, 0.07, 0.1]} />
              </mesh>
            </>
          )}
        </group>
      ))}
      {[wx, -wx].flatMap((x, xi) =>
        ([-1, 1] as const).map((s, si) => (
          <group
            key={`${x}${s}`}
            position={[x, d.wr, s * wz]}
            ref={(g) => { if (handles) handles.wheels[xi * 2 + si] = g; }}
          >
            <mesh geometry={wheelGeo} material={tireMat} scale={[d.wr, d.wr, 0.26]} castShadow />
            <mesh geometry={wheelGeo} material={hubMat} scale={[d.wr * 0.62, d.wr * 0.62, 0.27]} />
          </group>
        )),
      )}
    </group>
  );
}

/* -------------------------------------------------------------------- van */

export const VAN = { L: 6.0, W: 2.05, H: 2.55 };

let vanBody: ExtrudeGeometry | null = null;
function vanGeo() {
  if (vanBody) return vanBody;
  const s = new Shape();
  s.moveTo(-3.0, 0.3);
  s.lineTo(3.0, 0.3);
  s.lineTo(3.0, 0.95);
  s.lineTo(2.78, 1.18);
  s.lineTo(2.2, 1.38);
  s.lineTo(1.55, 2.3);
  s.lineTo(1.35, 2.5);
  s.lineTo(-2.95, 2.55);
  s.lineTo(-3.0, 2.4);
  s.closePath();
  vanBody = extrude(s, VAN.W, 0.07);
  return vanBody;
}
const vanPaint = new MeshPhysicalMaterial({ color: "#16203d", metalness: 0.45, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 });
const orangeMat = new MeshStandardMaterial({ color: DK.orange, roughness: 0.4, metalness: 0.2 });
const steelMat = new MeshStandardMaterial({ color: "#aab1ba", metalness: 0.9, roughness: 0.35 });
export const beaconMat = new MeshBasicMaterial({ color: "#ff8a2a", toneMapped: false });

export interface VanHandles {
  root?: Group | null;
  door?: Group | null;
  wheels: Array<Group | null>;
}

/** The DriveKare Sprinter: navy, orange stripe, bear emblem, roof beacon. */
export function SprinterVan({
  doorSide = 1,
  handles,
  ...props
}: { doorSide?: 1 | -1; handles?: VanHandles } & ThreeElements["group"]) {
  const geo = useMemo(vanGeo, []);
  return (
    <group {...props} ref={(g) => { if (handles) handles.root = g; }}>
      <mesh geometry={geo} material={vanPaint} castShadow receiveShadow />
      {/* windscreen and side glass */}
      <mesh position={[1.88, 1.86, 0]} rotation={[0, 0, -0.9]} material={glassMat}>
        <boxGeometry args={[0.04, 1.0, 1.82]} />
      </mesh>
      {([-1, 1] as const).map((s) => (
        <group key={s}>
          <mesh position={[1.9, 1.78, s * 1.035]} material={glassMat}>
            <boxGeometry args={[0.85, 0.5, 0.02]} />
          </mesh>
          <mesh position={[0, 0.78, s * 1.04]} material={orangeMat}>
            <boxGeometry args={[5.4, 0.2, 0.01]} />
          </mesh>
          <mesh position={[-0.15, 0.55, s * 1.04]} material={steelMat}>
            <boxGeometry args={[5.4, 0.04, 0.01]} />
          </mesh>
          <LogoDecal size={1.15} position={[-0.7, 1.7, s * 1.045]} rotation={[0, s === 1 ? 0 : Math.PI, 0]} />
        </group>
      ))}
      {/* sliding door on the working side */}
      <group position={[0.5, 1.45, doorSide * 1.045]} ref={(g) => { if (handles) handles.door = g; }}>
        <mesh material={vanPaint} castShadow>
          <boxGeometry args={[1.25, 1.55, 0.03]} />
        </mesh>
        <mesh position={[0, 0, doorSide * 0.02]} material={glassMat}>
          <boxGeometry args={[0.9, 0.55, 0.01]} />
        </mesh>
      </group>
      {/* lights */}
      <mesh position={[2.98, 0.8, 0]} material={sharedLights.head}>
        <boxGeometry args={[0.05, 0.12, 1.5]} />
      </mesh>
      <mesh position={[-3.0, 1.0, 0]} material={sharedLights.tail}>
        <boxGeometry args={[0.04, 0.5, 1.6]} />
      </mesh>
      {/* roof: rack and amber beacon */}
      {[-1.9, -0.6, 0.7].map((x) => (
        <mesh key={x} position={[x, 2.62, 0]} material={steelMat}>
          <boxGeometry args={[0.05, 0.05, 1.7]} />
        </mesh>
      ))}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[-0.6, 2.62, s * 0.8]} material={steelMat}>
          <boxGeometry args={[2.9, 0.04, 0.04]} />
        </mesh>
      ))}
      <mesh position={[1.0, 2.62, 0]} material={beaconMat}>
        <boxGeometry args={[0.25, 0.1, 0.9]} />
      </mesh>
      {[1.7, -1.7].map((x, xi) =>
        ([-1, 1] as const).map((s, si) => (
          <group key={`${x}${s}`} position={[x, 0.4, s * 0.92]} ref={(g) => { if (handles) handles.wheels[xi * 2 + si] = g; }}>
            <mesh geometry={wheelGeo} material={tireMat} scale={[0.4, 0.4, 0.28]} castShadow />
            <mesh geometry={wheelGeo} material={hubMat} scale={[0.25, 0.25, 0.29]} />
          </group>
        )),
      )}
    </group>
  );
}
