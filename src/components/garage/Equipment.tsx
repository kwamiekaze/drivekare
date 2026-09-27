import { useFrame, useLoader, type ThreeElements } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  InstancedMesh,
  Object3D,
  CanvasTexture,
  SRGBColorSpace,
  TextureLoader,
  type Mesh,
} from "three";
import { BRAND_LOGO } from "./brand";
import { Wheel, tireGeometry, tireMaterial } from "./Car";
import { batteryLabel, DK, labelTexture, pegboardTexture } from "./textures";
import { LugWrench, Screwdriver, Socket, Wrench } from "./tools";

type G = ThreeElements["group"];

function LogoDecal({ size = 0.2, ...props }: { size?: number } & ThreeElements["mesh"]) {
  const tex = useLoader(TextureLoader, BRAND_LOGO);
  tex.colorSpace = SRGBColorSpace;
  return (
    <mesh {...props}>
      <planeGeometry args={[size * 1.07, size]} />
      <meshStandardMaterial map={tex} alphaTest={0.4} roughness={0.5} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
    </mesh>
  );
}

const navyPaint = { color: DK.navy, metalness: 0.35, roughness: 0.4 } as const;
const orangePaint = { color: DK.orange, metalness: 0.25, roughness: 0.4 } as const;

/** Tall rolling tool chest with a top box, in DriveKare navy and orange. */
export function ToolChest({ width = 1.4, height = 1.6, ...props }: { width?: number; height?: number } & G) {
  const drawers = 7;
  const d = 0.62;
  const baseH = height * 0.62;
  const topH = height - baseH - 0.1;
  return (
    <group {...props}>
      {/* casters */}
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <mesh key={`${x}${z}`} position={[x * (width / 2 - 0.08), 0.06, z * (d / 2 - 0.08)]}>
            <cylinderGeometry args={[0.06, 0.06, 0.05, 16]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.12 + baseH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, baseH, d]} />
        <meshStandardMaterial {...navyPaint} />
      </mesh>
      {Array.from({ length: drawers }).map((_, i) => {
        const h = (baseH - 0.06) / drawers;
        const y = 0.15 + h * i + h / 2;
        return (
          <group key={i} position={[0, y, d / 2 + 0.01]}>
            <mesh>
              <boxGeometry args={[width - 0.06, h - 0.018, 0.012]} />
              <meshStandardMaterial color="#232d52" metalness={0.4} roughness={0.35} />
            </mesh>
            <mesh position={[0, h * 0.28, 0.02]}>
              <boxGeometry args={[width - 0.16, 0.022, 0.03]} />
              <meshStandardMaterial color="#c9ced6" metalness={1} roughness={0.2} />
            </mesh>
          </group>
        );
      })}
      {/* worktop */}
      <mesh position={[0, 0.12 + baseH + 0.02, 0]} castShadow>
        <boxGeometry args={[width + 0.04, 0.04, d + 0.04]} />
        <meshStandardMaterial color="#15171c" roughness={0.8} />
      </mesh>
      {/* top box */}
      <mesh position={[0, 0.12 + baseH + 0.08 + topH / 2, -0.05]} castShadow>
        <boxGeometry args={[width, topH, d - 0.12]} />
        <meshStandardMaterial {...orangePaint} />
      </mesh>
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={i} position={[0, 0.12 + baseH + 0.12 + (topH / 3.3) * i + 0.04, (d - 0.12) / 2 - 0.05 + 0.01]}>
          <boxGeometry args={[width - 0.08, topH / 3.6, 0.012]} />
          <meshStandardMaterial color="#d8661a" metalness={0.3} roughness={0.35} />
        </mesh>
      ))}
      <LogoDecal size={0.26} position={[width / 2 + 0.006, 0.12 + baseH * 0.6, 0]} rotation={[0, Math.PI / 2, 0]} />
      <LogoDecal size={0.26} position={[-width / 2 - 0.006, 0.12 + baseH * 0.6, 0]} rotation={[0, -Math.PI / 2, 0]} />
    </group>
  );
}

/** The open toolbox from the figure: navy tray, orange trim, tools standing. */
export function OpenToolbox(props: G) {
  const w = 0.62;
  const d = 0.3;
  const h = 0.26;
  return (
    <group {...props}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial {...navyPaint} />
      </mesh>
      <mesh position={[0, h - 0.012, 0]}>
        <boxGeometry args={[w + 0.02, 0.034, d + 0.02]} />
        <meshStandardMaterial {...orangePaint} />
      </mesh>
      {/* lid, swung open */}
      <group position={[0, h, -d / 2]} rotation={[-1.9, 0, 0]}>
        <mesh position={[0, 0.0, d / 2 - 0.02]} castShadow>
          <boxGeometry args={[w + 0.02, 0.04, d]} />
          <meshStandardMaterial {...orangePaint} />
        </mesh>
      </group>
      <LogoDecal size={0.15} position={[0, h * 0.45, d / 2 + 0.006]} />
      {[-0.22, -0.13, -0.04].map((x, i) => (
        <Wrench key={x} length={0.28 + i * 0.03} position={[x, h + 0.08, 0]} rotation={[0, 0, 0.08 * i]} />
      ))}
      {[0.06, 0.12, 0.18, 0.24].map((x) => (
        <Screwdriver key={x} length={0.24} position={[x, h + 0.06, 0.02]} rotation={[0.1, 0, 0]} />
      ))}
    </group>
  );
}

export function Tire({ ...props }: G) {
  return <Wheel radius={0.34} width={0.24} brakes={false} rimColor="#2b2e35" {...props} />;
}

/**
 * Bare tires, all drawn as one instanced mesh: a rack of thirty tires costs a
 * single draw call, which keeps the tire bay cheap on phones.
 */
export function InstancedTires({
  items,
  radius = 0.34,
  width = 0.23,
}: {
  items: Array<{ p: [number, number, number]; r: [number, number, number] }>;
  radius?: number;
  width?: number;
}) {
  const ref = useRef<InstancedMesh>(null);
  const geo = useMemo(() => tireGeometry(radius, width), [radius, width]);
  const mat = useMemo(() => tireMaterial(), []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    items.forEach((it, i) => {
      o.position.set(...it.p);
      o.rotation.set(...it.r);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={ref} args={[geo, mat, items.length]} castShadow receiveShadow />;
}

/** Tires stacked flat, the way a shop keeps them. */
export function TireStack({ count = 4, ...props }: { count?: number } & G) {
  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        p: [Math.sin(i * 2.1) * 0.02, 0.12 + i * 0.235, Math.cos(i * 1.7) * 0.02] as [number, number, number],
        r: [0, i * 0.7, Math.PI / 2] as [number, number, number],
      })),
    [count],
  );
  return (
    <group {...props}>
      <InstancedTires items={items} radius={0.33} />
    </group>
  );
}

/** Wall rack with tires standing on edge on three shelves. */
export function TireRack({ length = 3.2, ...props }: { length?: number } & G) {
  const levels = [0.05, 0.95, 1.85];
  const per = Math.floor(length / 0.3);
  const items = useMemo(
    () =>
      levels.flatMap((y) =>
        Array.from({ length: per }).map((_, i) => ({
          p: [-length / 2 + 0.2 + (i * (length - 0.3)) / Math.max(per - 1, 1), y + 0.4, 0] as [number, number, number],
          r: [0, 0, 0] as [number, number, number],
        })),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [length, per],
  );
  return (
    <group {...props}>
      {[-length / 2, 0, length / 2].map((x) =>
        [-0.28, 0.28].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 1.35, z]} castShadow>
            <boxGeometry args={[0.06, 2.7, 0.06]} />
            <meshStandardMaterial {...orangePaint} />
          </mesh>
        )),
      )}
      {levels.map((y) =>
        [-0.28, 0.28].map((z) => (
          <mesh key={`${y}${z}`} position={[0, y + 0.04, z]}>
            <boxGeometry args={[length + 0.06, 0.06, 0.05]} />
            <meshStandardMaterial {...navyPaint} />
          </mesh>
        )),
      )}
      <InstancedTires items={items} radius={0.34} width={0.22} />
    </group>
  );
}

/** Hydraulic floor jack, orange, with the DK stencil. */
export function FloorJack(props: G) {
  return (
    <group {...props}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[0.72, 0.1, 0.3]} />
        <meshStandardMaterial {...orangePaint} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 0.16, s * 0.15]} castShadow>
          <boxGeometry args={[0.72, 0.16, 0.03]} />
          <meshStandardMaterial {...orangePaint} />
        </mesh>
      ))}
      {[
        [-0.3, 0.2],
        [0.3, 0.16],
      ].map(([x, zz]) =>
        [-1, 1].map((s) => (
          <mesh key={`${x}${s}`} position={[x!, 0.06, s * zz!]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.05, 18]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        )),
      )}
      {/* lift arm and saddle */}
      <mesh position={[0.36, 0.26, 0]} rotation={[0, 0, 0.35]} castShadow>
        <boxGeometry args={[0.3, 0.06, 0.12]} />
        <meshStandardMaterial {...orangePaint} />
      </mesh>
      <mesh position={[0.49, 0.33, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.04, 20]} />
        <meshStandardMaterial color="#222" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* handle */}
      <mesh position={[-0.62, 0.42, 0]} rotation={[0, 0, 0.9]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.8, 10]} />
        <meshStandardMaterial color="#c9ced6" metalness={1} roughness={0.25} />
      </mesh>
      <LogoDecal size={0.1} position={[0, 0.17, 0.171]} />
    </group>
  );
}

export function JackStand(props: G) {
  return (
    <group {...props}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.16, 0.4, 4]} />
        <meshStandardMaterial {...orangePaint} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.25, 10]} />
        <meshStandardMaterial color="#aab1ba" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.63, 0]}>
        <boxGeometry args={[0.1, 0.04, 0.05]} />
        <meshStandardMaterial color="#aab1ba" metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Clamp({ color, ...props }: { color: string } & G) {
  return (
    <group {...props}>
      <mesh castShadow>
        <boxGeometry args={[0.035, 0.16, 0.05]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[0.03, 0.05, 0.03]} />
        <meshStandardMaterial color="#b8bec6" metalness={1} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Portable jump starter with clamps hanging off it. */
export function JumpPack(props: G) {
  return (
    <group {...props}>
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.36, 0.3, 0.22]} />
        <meshStandardMaterial {...navyPaint} />
      </mesh>
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <mesh key={`${x}${z}`} position={[x * 0.17, 0.16, z * 0.1]}>
            <boxGeometry args={[0.04, 0.31, 0.04]} />
            <meshStandardMaterial {...orangePaint} />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.38, 0]} rotation={[0, 0, 0]} castShadow>
        <torusGeometry args={[0.09, 0.018, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0.06, 0.2, 0.115]}>
        <planeGeometry args={[0.1, 0.05]} />
        <meshStandardMaterial color="#8fffb4" emissive="#4dff8a" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      <LogoDecal size={0.09} position={[-0.08, 0.2, 0.116]} />
      <Clamp color="#d42a1c" position={[0.24, 0.12, 0.05]} rotation={[0, 0, -0.3]} />
      <Clamp color="#16171a" position={[0.28, 0.1, -0.05]} rotation={[0, 0, -0.5]} />
      {/* cables */}
      <mesh position={[0.2, 0.26, 0.05]} rotation={[0, 0, -0.8]}>
        <torusGeometry args={[0.08, 0.012, 8, 20, Math.PI]} />
        <meshStandardMaterial color="#d42a1c" roughness={0.5} />
      </mesh>
      <mesh position={[0.22, 0.24, -0.05]} rotation={[0, 0, -1]}>
        <torusGeometry args={[0.09, 0.012, 8, 20, Math.PI]} />
        <meshStandardMaterial color="#16171a" roughness={0.5} />
      </mesh>
    </group>
  );
}

export function Battery(props: G) {
  const label = useMemo(() => batteryLabel(), []);
  return (
    <group {...props}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.3, 0.2, 0.17]} />
        <meshStandardMaterial color="#121418" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.1, 0.089]}>
        <planeGeometry args={[0.3, 0.15]} />
        <meshStandardMaterial map={label} roughness={0.5} />
      </mesh>
      <mesh position={[0.1, 0.215, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.03, 12]} />
        <meshStandardMaterial color="#d42a1c" />
      </mesh>
      <mesh position={[-0.1, 0.215, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.03, 12]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
}

export function TrafficCone(props: G) {
  return (
    <group {...props}>
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.04, 0.4]} />
        <meshStandardMaterial color={DK.orange} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.34, 0]} castShadow>
        <coneGeometry args={[0.16, 0.62, 28, 1, true]} />
        <meshStandardMaterial color={DK.orange} roughness={0.45} side={2} />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.085, 0.108, 0.1, 28, 1, true]} />
        <meshStandardMaterial color="#f2eee6" roughness={0.3} emissive="#ffffff" emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}

export function HoseCoil({ color = "#1d4f8f", ...props }: { color?: string } & G) {
  return (
    <group {...props}>
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[0, 0.025 + i * 0.04, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.22 - i * 0.01, 0.022, 10, 48]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0.3, 0.03, 0.05]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.1, 10]} />
        <meshStandardMaterial color="#c9a441" metalness={1} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Handheld OBD scanner with a lit screen and its cable. */
export function Scanner(props: G) {
  return (
    <group {...props}>
      <mesh position={[0, 0.02, 0]} castShadow>
        <boxGeometry args={[0.18, 0.04, 0.3]} />
        <meshStandardMaterial {...orangePaint} />
      </mesh>
      <mesh position={[0, 0.046, -0.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.13, 0.1]} />
        <meshStandardMaterial color="#9fe7ff" emissive="#5fd4ff" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} position={[-0.045 + (i % 3) * 0.045, 0.046, 0.04 + Math.floor(i / 3) * 0.035]}>
          <boxGeometry args={[0.03, 0.01, 0.022]} />
          <meshStandardMaterial color={DK.navy} />
        </mesh>
      ))}
      <mesh position={[0, 0.02, -0.26]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.01, 8, 24, Math.PI * 1.4]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
}

export function HardCase(props: G) {
  return (
    <group {...props}>
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.2, 0.36]} />
        <meshStandardMaterial {...navyPaint} roughness={0.7} />
      </mesh>
      {[-0.16, 0.16].map((x) => (
        <mesh key={x} position={[x, 0.12, 0.185]}>
          <boxGeometry args={[0.05, 0.05, 0.02]} />
          <meshStandardMaterial {...orangePaint} />
        </mesh>
      ))}
      <LogoDecal size={0.12} position={[0, 0.205, 0]} rotation={[-Math.PI / 2, 0, 0]} />
    </group>
  );
}

export function OilDrum({ color = DK.navy, ...props }: { color?: string } & G) {
  return (
    <group {...props}>
      <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.29, 0.29, 0.88, 36]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.45} />
      </mesh>
      {[0.3, 0.6].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.293, 0.012, 8, 40]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      <LogoDecal size={0.2} position={[0, 0.45, 0.297]} />
    </group>
  );
}

export function JerryCan({ color = "#c8321f", ...props }: { color?: string } & G) {
  return (
    <group {...props}>
      <mesh position={[0, 0.24, 0]} castShadow>
        <boxGeometry args={[0.34, 0.46, 0.16]} />
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.24, 0.085]}>
        <boxGeometry args={[0.28, 0.3, 0.005]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[-0.04, 0.5, 0]}>
        <boxGeometry args={[0.18, 0.05, 0.06]} />
        <meshStandardMaterial color={color} roughness={0.45} />
      </mesh>
      <mesh position={[0.12, 0.5, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.025, 0.025, 0.08, 12]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
}

/** Tire changer: base cabinet, turntable with a wheel, and the mount column. */
export function TireChanger(props: G) {
  return (
    <group {...props}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.9, 0.7]} />
        <meshStandardMaterial {...navyPaint} />
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.05, 32]} />
        <meshStandardMaterial color="#555b63" metalness={0.9} roughness={0.3} />
      </mesh>
      <Wheel radius={0.34} width={0.22} brakes={false} rimColor="#9aa1aa" position={[0, 1.07, 0]} rotation={[0, 0, Math.PI / 2]} />
      <mesh position={[0, 1.1, -0.45]} castShadow>
        <boxGeometry args={[0.14, 2.2, 0.14]} />
        <meshStandardMaterial {...orangePaint} />
      </mesh>
      <mesh position={[0, 2.1, -0.18]} castShadow>
        <boxGeometry args={[0.1, 0.1, 0.6]} />
        <meshStandardMaterial {...orangePaint} />
      </mesh>
      <mesh position={[0, 1.6, 0.1]}>
        <cylinderGeometry args={[0.02, 0.02, 1.0, 10]} />
        <meshStandardMaterial color="#c9ced6" metalness={1} roughness={0.2} />
      </mesh>
      <LogoDecal size={0.22} position={[0, 0.55, 0.356]} />
    </group>
  );
}

export function WheelBalancer(props: G) {
  return (
    <group {...props}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 1.0, 0.6]} />
        <meshStandardMaterial {...orangePaint} />
      </mesh>
      <mesh position={[0, 1.08, 0.1]} rotation={[-0.5, 0, 0]}>
        <boxGeometry args={[0.6, 0.16, 0.3]} />
        <meshStandardMaterial color="#15171c" />
      </mesh>
      <mesh position={[0, 1.12, 0.2]} rotation={[-0.5 - Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 0.1]} />
        <meshStandardMaterial color="#ff9b4a" emissive="#ff7a1a" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <mesh position={[0.55, 0.72, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 12]} />
        <meshStandardMaterial color="#c9ced6" metalness={1} roughness={0.25} />
      </mesh>
      <Wheel radius={0.33} width={0.22} brakes={false} rimColor="#2b2e35" position={[0.62, 0.72, 0]} rotation={[0, 0, 0]} />
      <mesh position={[0.62, 0.72, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.02, 0.02, 0.02]} />
      </mesh>
    </group>
  );
}

/** Rolling diagnostic cart with a live-data monitor. */
export function DiagCart(props: G & { reducedMotion?: boolean }) {
  const { reducedMotion, ...rest } = props;
  const screen = useRef<Mesh>(null);
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 768;
    c.height = 432;
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, []);
  const last = useRef(-1);
  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    if (reducedMotion && last.current >= 0) return;
    if (now - last.current < 1 / 15) return;
    last.current = now;
    const c = tex.image as HTMLCanvasElement;
    const ctx = c.getContext("2d")!;
    const w = c.width;
    const h = c.height;
    ctx.fillStyle = "#07101f";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#e8741e";
    ctx.fillRect(0, 0, w, 44);
    ctx.fillStyle = "#07101f";
    ctx.font = "700 24px 'Unbounded', Arial, sans-serif";
    ctx.fillText("DK SCAN  LIVE DATA", 18, 31);
    const rows = [
      { name: "RPM", v: 820 + Math.sin(now * 2) * 40, max: 3000, col: "#5fd4ff" },
      { name: "COOLANT °F", v: 196 + Math.sin(now * 0.3) * 2, max: 260, col: "#ffb070" },
      { name: "VOLTS", v: 14.2 + Math.sin(now * 1.3) * 0.08, max: 16, col: "#8fffb4" },
    ];
    rows.forEach((r, i) => {
      const y = 70 + i * 60;
      ctx.fillStyle = "#9fb3d6";
      ctx.font = "600 20px 'Instrument Sans', Arial, sans-serif";
      ctx.fillText(r.name, 18, y + 18);
      ctx.fillStyle = "#16233f";
      ctx.fillRect(170, y, 420, 24);
      ctx.fillStyle = r.col;
      ctx.fillRect(170, y, (420 * r.v) / r.max, 24);
      ctx.fillStyle = "#e6edf8";
      ctx.fillText(r.v.toFixed(r.max < 20 ? 1 : 0), 610, y + 19);
    });
    // waveform
    ctx.strokeStyle = "#5fd4ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x < w - 36; x += 4) {
      const t = x / 60 + now * 3;
      const y = 330 + Math.sin(t) * 26 + Math.sin(t * 2.7) * 10 + (Math.sin(t * 0.5) > 0.96 ? -40 : 0);
      if (x === 0) ctx.moveTo(18 + x, y);
      else ctx.lineTo(18 + x, y);
    }
    ctx.stroke();
    ctx.fillStyle = "#8fffb4";
    ctx.font = "700 22px 'Instrument Sans', Arial, sans-serif";
    ctx.fillText("NO ACTIVE FAULTS", 18, 412);
    tex.needsUpdate = true;
  });
  return (
    <group {...rest}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.8, 0.55]} />
        <meshStandardMaterial {...navyPaint} />
      </mesh>
      {[0.25, 0.5, 0.72].map((y) => (
        <mesh key={y} position={[0, y, 0.281]}>
          <boxGeometry args={[0.66, 0.02, 0.02]} />
          <meshStandardMaterial color="#c9ced6" metalness={1} roughness={0.2} />
        </mesh>
      ))}
      <mesh position={[0, 1.3, -0.1]} castShadow>
        <boxGeometry args={[0.08, 0.9, 0.08]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <group position={[0, 1.62, -0.02]} rotation={[-0.08, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.08, 0.64, 0.05]} />
          <meshStandardMaterial color="#0c0d10" roughness={0.4} />
        </mesh>
        <mesh ref={screen} position={[0, 0, 0.027]}>
          <planeGeometry args={[1.0, 0.5625]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      </group>
      <mesh position={[0, 0.87, 0.06]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[0.5, 0.02, 0.18]} />
        <meshStandardMaterial color="#1a1c20" />
      </mesh>
      <Scanner position={[0.3, 0.86, 0.12]} rotation={[0, -0.4, 0]} scale={0.8} />
    </group>
  );
}

/** Workbench with a vise and a few tools laid out. */
export function Workbench({ length = 2.6, ...props }: { length?: number } & G) {
  return (
    <group {...props}>
      <mesh position={[0, 0.92, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, 0.06, 0.75]} />
        <meshStandardMaterial color="#6b4a2e" roughness={0.75} />
      </mesh>
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <mesh key={`${x}${z}`} position={[x * (length / 2 - 0.08), 0.45, z * 0.3]} castShadow>
            <boxGeometry args={[0.06, 0.9, 0.06]} />
            <meshStandardMaterial {...navyPaint} />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[length - 0.1, 0.03, 0.66]} />
        <meshStandardMaterial {...navyPaint} />
      </mesh>
      {/* vise */}
      <group position={[length / 2 - 0.35, 0.95, 0.2]}>
        <mesh position={[0, 0.07, 0]} castShadow>
          <boxGeometry args={[0.24, 0.14, 0.16]} />
          <meshStandardMaterial color={DK.orange} roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.07, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.26, 10]} />
          <meshStandardMaterial color="#c9ced6" metalness={1} roughness={0.25} />
        </mesh>
      </group>
      <Wrench length={0.3} position={[-0.6, 0.97, 0.1]} rotation={[-Math.PI / 2, 0, 0.6]} />
      <Wrench length={0.26} position={[-0.4, 0.97, 0.15]} rotation={[-Math.PI / 2, 0, 0.3]} />
      <Socket position={[-0.1, 0.99, 0.2]} />
      <Socket position={[0.0, 0.99, 0.18]} scale={0.8} />
      <Screwdriver position={[0.25, 0.97, 0.12]} rotation={[0, 0.5, Math.PI / 2]} />
      <HardCase position={[-1.0, 0.95, -0.1]} rotation={[0, 0.2, 0]} />
    </group>
  );
}

/** Pegboard with a shadow board of wrenches and drivers. */
export function Pegboard({ width = 3, height = 1.4, ...props }: { width?: number; height?: number } & G) {
  const tex = useMemo(() => pegboardTexture(), []);
  return (
    <group {...props}>
      <mesh receiveShadow>
        <boxGeometry args={[width, height, 0.03]} />
        <meshStandardMaterial map={tex} roughness={0.8} />
      </mesh>
      <mesh position={[0, height / 2 + 0.02, 0.01]}>
        <boxGeometry args={[width + 0.04, 0.04, 0.05]} />
        <meshStandardMaterial {...orangePaint} />
      </mesh>
      {Array.from({ length: 9 }).map((_, i) => (
        <Wrench
          key={i}
          length={0.2 + i * 0.03}
          position={[-width / 2 + 0.25 + i * 0.16, 0.2 - i * 0.012, 0.04]}
          rotation={[0, 0, 0]}
        />
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <Screwdriver key={i} length={0.26} position={[0.35 + i * 0.13, 0.22, 0.05]} />
      ))}
      <LugWrench position={[width / 2 - 0.45, -0.3, 0.06]} rotation={[Math.PI / 2, 0, 0.3]} scale={0.8} />
      {Array.from({ length: 8 }).map((_, i) => (
        <Socket key={i} position={[-width / 2 + 0.3 + i * 0.12, -0.42, 0.06]} rotation={[Math.PI / 2, 0, 0]} scale={0.8 + i * 0.04} />
      ))}
    </group>
  );
}

export function Creeper(props: G) {
  return (
    <group {...props}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.5, 0.05, 1.1]} />
        <meshStandardMaterial color="#15171c" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.13, -0.42]} castShadow>
        <boxGeometry args={[0.4, 0.04, 0.22]} />
        <meshStandardMaterial {...orangePaint} />
      </mesh>
      {[-1, 1].map((x) =>
        [-0.45, 0, 0.45].map((z) => (
          <mesh key={`${x}${z}`} position={[x * 0.2, 0.04, z]}>
            <sphereGeometry args={[0.04, 12, 8]} />
            <meshStandardMaterial color="#222" />
          </mesh>
        )),
      )}
    </group>
  );
}

export function Extinguisher(props: G) {
  return (
    <group {...props}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.52, 20]} />
        <meshStandardMaterial color="#c21d12" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.03, 0.05, 0.08, 12]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
}

/** Fuel caddy: a small tank on wheels with a hose and nozzle. */
export function FuelCaddy(props: G) {
  return (
    <group {...props}>
      <mesh position={[0, 0.38, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.24, 0.6, 8, 28]} />
        <meshStandardMaterial color="#d6a21a" roughness={0.35} metalness={0.3} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.3, 0.14, s * 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.06, 20]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      <mesh position={[-0.55, 0.7, 0]} rotation={[0, 0, 0.6]}>
        <cylinderGeometry args={[0.015, 0.015, 0.7, 8]} />
        <meshStandardMaterial color="#c9ced6" metalness={1} roughness={0.25} />
      </mesh>
      <HoseCoil color="#16171a" position={[0, 0.63, 0]} scale={0.7} />
    </group>
  );
}

/** Lockout kit on a board: air wedge and long reach tool. */
export function LockoutBoard(props: G) {
  const tex = useMemo(() => labelTexture("LOCKOUT", DK.navy, DK.orange), []);
  return (
    <group {...props}>
      <mesh receiveShadow>
        <boxGeometry args={[1.2, 0.9, 0.03]} />
        <meshStandardMaterial color="#22294a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.34, 0.021]}>
        <planeGeometry args={[0.6, 0.15]} />
        <meshStandardMaterial map={tex} />
      </mesh>
      <mesh position={[0, 0.0, 0.03]} rotation={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.01, 0.01, 1.0, 8]} />
        <meshStandardMaterial color="#e8ecf0" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-0.35, -0.2, 0.04]} scale={[1, 1.6, 0.4]}>
        <sphereGeometry args={[0.08, 16, 12]} />
        <meshStandardMaterial color="#111" roughness={0.5} />
      </mesh>
      <mesh position={[0.35, -0.22, 0.04]}>
        <boxGeometry args={[0.2, 0.08, 0.03]} />
        <meshStandardMaterial color={DK.orange} />
      </mesh>
    </group>
  );
}

export { LogoDecal, LugWrench, Socket };

/** Pressure washer cart with its hose and foam cannon. */
export function PressureWasher(props: G) {
  return (
    <group {...props}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.55, 0.5, 0.45]} />
        <meshStandardMaterial {...navyPaint} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.12, 24]} />
        <meshStandardMaterial {...orangePaint} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-0.2, 0.14, s * 0.26]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.06, 20]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      <mesh position={[0.3, 0.9, 0]} rotation={[0, 0, -0.25]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 1.1, 8]} />
        <meshStandardMaterial color="#c9ced6" metalness={1} roughness={0.25} />
      </mesh>
      <HoseCoil color="#16171a" position={[0, 0.18, 0.45]} scale={0.8} />
      {/* foam cannon */}
      <group position={[0.1, 0.72, 0.36]} rotation={[0.3, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.2, 18]} />
          <meshStandardMaterial color="#e8f4ff" transparent opacity={0.75} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.08, 12]} />
          <meshStandardMaterial {...orangePaint} />
        </mesh>
      </group>
      <LogoDecal size={0.16} position={[0, 0.42, 0.23]} />
    </group>
  );
}

export function Bucket({ color = DK.orange, ...props }: { color?: string } & G) {
  return (
    <group {...props}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.13, 0.38, 24, 1, true]} />
        <meshStandardMaterial color={color} roughness={0.5} side={2} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.13, 24]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.33, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 24]} />
        <meshStandardMaterial color="#eef6ff" emissive="#cfe6ff" emissiveIntensity={0.2} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.4, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.16, 0.007, 6, 24, Math.PI]} />
        <meshStandardMaterial color="#c9ced6" metalness={1} />
      </mesh>
    </group>
  );
}

/** Shelf of detailing chemicals and folded microfiber towels. */
export function DetailShelf(props: G) {
  const colors = ["#e8741e", "#2f7bd8", "#e6dccb", "#b21e8a", "#27c07a", "#e8741e", "#2f7bd8"];
  return (
    <group {...props}>
      {[0.5, 1.1, 1.7].map((y, row) => (
        <group key={y}>
          <mesh position={[0, y, 0]} receiveShadow castShadow>
            <boxGeometry args={[2.2, 0.04, 0.45]} />
            <meshStandardMaterial {...navyPaint} />
          </mesh>
          {row < 2
            ? colors.map((c, i) => (
                <group key={i} position={[-0.9 + i * 0.3, y + 0.02, 0]}>
                  <mesh position={[0, 0.14, 0]} castShadow>
                    <boxGeometry args={[0.12, 0.28, 0.08]} />
                    <meshStandardMaterial color={c} roughness={0.3} />
                  </mesh>
                  <mesh position={[0, 0.31, 0]}>
                    <cylinderGeometry args={[0.02, 0.025, 0.06, 10]} />
                    <meshStandardMaterial color="#111" />
                  </mesh>
                </group>
              ))
            : [0, 1, 2, 3].map((i) => (
                <group key={i} position={[-0.75 + i * 0.5, y + 0.02, 0]}>
                  {[0, 1, 2, 3].map((k) => (
                    <mesh key={k} position={[0, 0.03 + k * 0.05, 0]} castShadow>
                      <boxGeometry args={[0.36, 0.045, 0.3]} />
                      <meshStandardMaterial color={k % 2 ? DK.orange : "#e6dccb"} roughness={0.95} />
                    </mesh>
                  ))}
                </group>
              ))}
        </group>
      ))}
      {[-1.08, 1.08].map((x) => (
        <mesh key={x} position={[x, 1.0, 0]}>
          <boxGeometry args={[0.04, 2.0, 0.45]} />
          <meshStandardMaterial {...orangePaint} />
        </mesh>
      ))}
    </group>
  );
}

/** Dual action polisher resting on its pad. */
export function Polisher(props: G) {
  return (
    <group {...props}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.05, 24]} />
        <meshStandardMaterial color={DK.orange} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.14, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.14, 16]} />
        <meshStandardMaterial color="#1a1b1e" />
      </mesh>
      <mesh position={[0.14, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.045, 0.22, 6, 14]} />
        <meshStandardMaterial color={DK.navy} />
      </mesh>
    </group>
  );
}

/** Shelf of oil quarts and filters for the oil bay. */
export function OilShelf(props: G) {
  return (
    <group {...props}>
      {[0.4, 1.0, 1.6].map((y) => (
        <group key={y}>
          <mesh position={[0, y, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.6, 0.04, 0.42]} />
            <meshStandardMaterial {...navyPaint} />
          </mesh>
          {Array.from({ length: 7 }).map((_, i) => (
            <group key={i} position={[-0.66 + i * 0.22, y + 0.02, 0]}>
              {y < 1.5 ? (
                <mesh position={[0, 0.13, 0]} castShadow>
                  <boxGeometry args={[0.13, 0.26, 0.07]} />
                  <meshStandardMaterial color={i % 2 ? "#e6c21a" : DK.orange} roughness={0.35} />
                </mesh>
              ) : (
                <mesh position={[0, 0.07, 0]} castShadow>
                  <cylinderGeometry args={[0.05, 0.05, 0.14, 16]} />
                  <meshStandardMaterial color={DK.orange} metalness={0.4} roughness={0.35} />
                </mesh>
              )}
            </group>
          ))}
        </group>
      ))}
      {[-0.8, 0.8].map((x) => (
        <mesh key={x} position={[x, 1.0, 0]}>
          <boxGeometry args={[0.04, 2.0, 0.42]} />
          <meshStandardMaterial {...orangePaint} />
        </mesh>
      ))}
    </group>
  );
}

export function DrainPan(props: G) {
  return (
    <group {...props}>
      <mesh position={[0, 0.07, 0]} castShadow>
        <cylinderGeometry args={[0.36, 0.3, 0.14, 32, 1, true]} />
        <meshStandardMaterial color="#1a1b1e" roughness={0.6} side={2} />
      </mesh>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.33, 32]} />
        <meshStandardMaterial color="#1a0f05" metalness={0.3} roughness={0.08} />
      </mesh>
    </group>
  );
}

/** The DriveKare service van: how the garage actually comes to you. */
export function ServiceVan(props: G) {
  const stripe = useMemo(() => labelTexture("drivekare.com", DK.orange, "#0d1326"), []);
  return (
    <group {...props}>
      {/* body, running along x */}
      <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.6, 2.1, 2.0]} />
        <meshPhysicalMaterial color="#141a2e" metalness={0.5} roughness={0.35} clearcoat={1} clearcoatRoughness={0.1} />
      </mesh>
      {/* sloped nose */}
      <mesh position={[2.7, 1.0, 0]} rotation={[0, 0, -0.35]} castShadow>
        <boxGeometry args={[1.1, 1.4, 1.96]} />
        <meshPhysicalMaterial color="#141a2e" metalness={0.5} roughness={0.35} clearcoat={1} clearcoatRoughness={0.1} />
      </mesh>
      <mesh position={[2.55, 1.85, 0]} rotation={[0, 0, -0.62]}>
        <boxGeometry args={[0.9, 0.05, 1.8]} />
        <meshPhysicalMaterial color="#05070b" roughness={0.05} clearcoat={1} />
      </mesh>
      {[1, -1].map((s) => (
        <group key={s}>
          <mesh position={[0, 0.85, s * 1.008]} rotation={[0, s === 1 ? 0 : Math.PI, 0]}>
            <planeGeometry args={[4.4, 0.34]} />
            <meshStandardMaterial map={stripe} roughness={0.4} emissive={DK.orange} emissiveIntensity={0.15} />
          </mesh>
          <mesh position={[2.0, 1.75, s * 1.008]} rotation={[0, s === 1 ? 0 : Math.PI, 0]}>
            <planeGeometry args={[0.8, 0.55]} />
            <meshPhysicalMaterial color="#05070b" roughness={0.05} clearcoat={1} />
          </mesh>
          <LogoDecal size={0.9} position={[-0.7, 1.7, s * 1.012]} rotation={[0, s === 1 ? 0 : Math.PI, 0]} />
        </group>
      ))}
      {/* lights */}
      <mesh position={[3.12, 0.85, 0]}>
        <boxGeometry args={[0.05, 0.08, 1.6]} />
        <meshStandardMaterial color="#fff" emissive="#dfe9ff" emissiveIntensity={4} toneMapped={false} />
      </mesh>
      <mesh position={[0, 2.45, 0]}>
        <boxGeometry args={[1.2, 0.1, 0.3]} />
        <meshStandardMaterial color={DK.orange} emissive={DK.orange} emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      {[-1.5, 1.9].map((x) =>
        [-1, 1].map((s) => (
          <Wheel key={`${x}${s}`} radius={0.4} width={0.26} rimColor="#2b2e35" position={[x, 0.4, s * 0.92]} rotation={[0, Math.PI / 2, 0]} />
        )),
      )}
    </group>
  );
}
