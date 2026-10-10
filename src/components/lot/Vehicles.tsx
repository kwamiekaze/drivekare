import { useMemo } from "react";
import type { ThreeElements } from "@react-three/fiber";
import { BufferGeometry, Group, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, type Material } from "three";
import { LogoDecal } from "../garage/Equipment";
import { DK } from "../garage/textures";
import type { Body } from "./layout";
import { carParts, SPECS } from "./carGeometry";

/* ------------------------------------------------------------- shared kit */

/** Lamp materials every car shares; the scene drives their glow once a frame. */
export const sharedLights = {
  head: new MeshStandardMaterial({ color: "#f4f7ff", emissive: "#dbe8ff", emissiveIntensity: 0.1, toneMapped: false }),
  tail: new MeshStandardMaterial({ color: "#5a0b0b", emissive: "#ff2a1a", emissiveIntensity: 0.3, toneMapped: false }),
};
/** Glass reflects the sky: dark, glossy, and let the HDRI do the rest. */
export const glassMat = new MeshPhysicalMaterial({ color: "#0b1016", metalness: 0.2, roughness: 0.04, clearcoat: 1, envMapIntensity: 1.6 });
const tireMat = new MeshStandardMaterial({ color: "#101114", roughness: 0.92 });
const rimMat = new MeshStandardMaterial({ color: "#c7ccd4", metalness: 1, roughness: 0.22 });
const trimMat = new MeshStandardMaterial({ color: "#16181c", roughness: 0.55, metalness: 0.1 });
const bedMat = new MeshStandardMaterial({ color: "#17181b", roughness: 0.95 });

const PAINT = { metalness: 0.7, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.25 } as const;
const paints = new Map<string, MeshPhysicalMaterial>();
export function paintFor(color: string) {
  let m = paints.get(color);
  if (!m) {
    m = new MeshPhysicalMaterial({ color, ...PAINT });
    paints.set(color, m);
  }
  return m;
}
export const newPaint = (color: string) => new MeshPhysicalMaterial({ color, ...PAINT });
export const instancedPaint = new MeshPhysicalMaterial({ color: "#ffffff", ...PAINT });
export const carMaterials = { tire: tireMat, rim: rimMat, trim: trimMat, bed: bedMat };

/* ------------------------------------------------------------------- cars */

/** Handy measurements of a body style, for props and effects placed around a car. */
export function bodyDims(b: Body) {
  const sp = SPECS[b];
  const t = sp.top;
  return {
    L: sp.L, W: sp.W, H: sp.H, gc: sp.gc, wb: sp.wb, wr: sp.wr,
    hb: t[Math.floor(t.length / 2)]![1],
    hf: t[t.length - 3]![1],
    ht: t[1]![1],
  };
}

export interface MergedCar {
  paint: BufferGeometry; trim: BufferGeometry; glass: BufferGeometry; tires: BufferGeometry;
  rims: BufferGeometry; heads: BufferGeometry; tails: BufferGeometry; bed?: BufferGeometry;
}
export const mergedCar = (body: Body): MergedCar => carParts(body);

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
  body, color, paint, lights, handles, ...props
}: {
  body: Body;
  color?: string;
  paint?: Material;
  /** kept for callers that open the hood; the lofted body has a fixed bonnet */
  hoodCut?: boolean;
  lights?: CarLights;
  handles?: CarHandles;
} & ThreeElements["group"]) {
  const parts = useMemo(() => carParts(body), [body]);
  const { L, W, wb, wr } = parts.spec;
  const mat = paint ?? paintFor(color ?? "#888");
  const lo = L / 2;
  return (
    <group {...props} ref={(g) => { if (handles) handles.root = g; }}>
      <mesh geometry={parts.paint} material={mat} castShadow receiveShadow />
      <mesh geometry={parts.trim} material={trimMat} castShadow />
      <mesh geometry={parts.glass} material={glassMat} castShadow />
      <mesh geometry={parts.heads} material={lights?.head ?? sharedLights.head} />
      <mesh geometry={parts.tails} material={lights?.tail ?? sharedLights.tail} />
      {parts.bed && <mesh geometry={parts.bed} material={bedMat} />}
      {lights?.hazard &&
        ([-1, 1] as const).flatMap((s) => [
          <mesh key={`f${s}`} position={[lo - 0.35, 0.58, s * W * 0.4]} material={lights.hazard}>
            <sphereGeometry args={[0.06, 8, 6]} />
          </mesh>,
          <mesh key={`r${s}`} position={[-lo + 0.3, 0.7, s * W * 0.42]} material={lights.hazard}>
            <sphereGeometry args={[0.06, 8, 6]} />
          </mesh>,
        ])}
      {[wb / 2, -wb / 2].flatMap((x, xi) =>
        ([-1, 1] as const).map((s, si) => (
          <group key={`${x}${s}`} position={[x, wr, s * (W / 2 - 0.2)]} rotation={[0, s === -1 ? Math.PI : 0, 0]} ref={(g) => { if (handles) handles.wheels[xi * 2 + si] = g; }}>
            <mesh geometry={parts.tire1} material={tireMat} castShadow />
            <mesh geometry={parts.rim1} material={rimMat} />
          </group>
        )),
      )}
    </group>
  );
}

/* -------------------------------------------------------------------- van */

export const VAN = { L: 6.0, W: 2.05, H: 2.55 };

const vanPaint = new MeshPhysicalMaterial({ color: "#16203d", metalness: 0.5, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.2 });
const orangeMat = new MeshStandardMaterial({ color: DK.orange, roughness: 0.4, metalness: 0.2 });
const steelMat = new MeshStandardMaterial({ color: "#aab1ba", metalness: 0.9, roughness: 0.35 });
export const beaconMat = new MeshBasicMaterial({ color: "#ff8a2a", toneMapped: false });

export interface VanHandles {
  root?: Group | null;
  door?: Group | null;
  wheels: Array<Group | null>;
}

/** The DriveKare Sprinter: navy, orange stripe, bear emblem, roof beacon. */
export function SprinterVan({ doorSide = 1, handles, ...props }: { doorSide?: 1 | -1; handles?: VanHandles } & ThreeElements["group"]) {
  const parts = useMemo(() => carParts("van"), []);
  const { wb, wr, W } = parts.spec;
  return (
    <group {...props} ref={(g) => { if (handles) handles.root = g; }}>
      <mesh geometry={parts.paint} material={vanPaint} castShadow receiveShadow />
      <mesh geometry={parts.trim} material={trimMat} castShadow />
      {/* windscreen and side glass */}
      <mesh position={[1.88, 1.86, 0]} rotation={[0, 0, 0.5]} material={glassMat}>
        <boxGeometry args={[0.04, 1.02, 1.8]} />
      </mesh>
      {([-1, 1] as const).map((s) => (
        <group key={s}>
          <mesh position={[1.75, 1.78, s * 1.02]} material={glassMat}>
            <boxGeometry args={[0.85, 0.5, 0.02]} />
          </mesh>
          <mesh position={[0, 0.82, s * 1.036]} material={orangeMat}>
            <boxGeometry args={[5.2, 0.2, 0.01]} />
          </mesh>
          <mesh position={[-0.15, 0.58, s * 1.036]} material={steelMat}>
            <boxGeometry args={[5.2, 0.04, 0.01]} />
          </mesh>
          <LogoDecal size={1.15} position={[-0.7, 1.7, s * 1.04]} rotation={[0, s === 1 ? 0 : Math.PI, 0]} />
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
      <mesh geometry={parts.heads} material={sharedLights.head} />
      <mesh position={[-3.0, 1.0, 0]} material={sharedLights.tail}>
        <boxGeometry args={[0.04, 0.5, 1.6]} />
      </mesh>
      {[-1.9, -0.6, 0.7].map((x) => (
        <mesh key={x} position={[x, 2.6, 0]} material={steelMat}>
          <boxGeometry args={[0.05, 0.05, 1.7]} />
        </mesh>
      ))}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[-0.6, 2.6, s * 0.8]} material={steelMat}>
          <boxGeometry args={[2.9, 0.04, 0.04]} />
        </mesh>
      ))}
      <mesh position={[1.0, 2.62, 0]} material={beaconMat}>
        <boxGeometry args={[0.25, 0.1, 0.9]} />
      </mesh>
      {[wb / 2, -wb / 2].map((x, xi) =>
        ([-1, 1] as const).map((s, si) => (
          <group key={`${x}${s}`} position={[x, wr, s * (W / 2 - 0.2)]} rotation={[0, s === -1 ? Math.PI : 0, 0]} ref={(g) => { if (handles) handles.wheels[xi * 2 + si] = g; }}>
            <mesh geometry={parts.tire1} material={tireMat} castShadow />
            <mesh geometry={parts.rim1} material={rimMat} />
          </group>
        )),
      )}
    </group>
  );
}
