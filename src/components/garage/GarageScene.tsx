import { Environment, Lightformer, MeshReflectorMaterial, Sparkles } from "@react-three/drei";
import { useLoader, useThree, type ThreeElements } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { Color, InstancedMesh, Matrix4, Quaternion, SRGBColorSpace, TextureLoader, Vector3 } from "three";
import { DkBear } from "./DkBear";
import { Outdoor } from "./Outdoor";
import { WallCalendar } from "./WallCalendar";
import { WallClock } from "./WallClock";
import { LiftWithCar } from "./Car";
import {
  Battery,
  Bucket,
  Creeper,
  DetailShelf,
  DrainPan,
  OilShelf,
  Polisher,
  PressureWasher,
  DiagCart,
  Extinguisher,
  FloorJack,
  HardCase,
  HoseCoil,
  JackStand,
  JumpPack,
  LogoDecal,
  LugWrench,
  OilDrum,
  OpenToolbox,
  Pegboard,
  Scanner,
  Socket,
  Tire,
  TireChanger,
  TireRack,
  TireStack,
  ToolChest,
  TrafficCone,
  WheelBalancer,
  Workbench,
} from "./Equipment";
import {
  DK,
  floorTexture,
  hazardTexture,
  neonTexture,
  woodTexture,
  ribTexture,
  stencilTexture,
  wordmarkTexture,
} from "./textures";

const W = 24; // x span
const D = 18; // z span
const H = 7; // height
const DOOR_W = 12;
const DOOR_H = 5.6;

/** Honeycomb LED grid on the ceiling, one instanced draw. */
function HexLights({ y = H - 0.35, edge = 0.95, cols = 9, rows = 7 }) {
  const ref = useRef<InstancedMesh>(null);
  const edges = useMemo(() => {
    const out: Array<[Vector3, Vector3]> = [];
    const seen = new Set<string>();
    const hw = Math.sqrt(3) * edge;
    const key = (v: Vector3) => `${v.x.toFixed(2)},${v.z.toFixed(2)}`;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const cx = (c - (cols - 1) / 2) * hw + (r % 2 ? hw / 2 : 0);
        const cz = (r - (rows - 1) / 2) * edge * 1.5 - 1.2;
        const pts = Array.from({ length: 6 }).map((_, i) => {
          const a = (Math.PI / 3) * i + Math.PI / 6;
          return new Vector3(cx + edge * Math.cos(a), y, cz + edge * Math.sin(a));
        });
        for (let i = 0; i < 6; i += 1) {
          const a = pts[i]!;
          const b = pts[(i + 1) % 6]!;
          const k = [key(a), key(b)].sort().join("|");
          if (seen.has(k)) continue;
          seen.add(k);
          out.push([a, b]);
        }
      }
    }
    return out;
  }, [y, edge, cols, rows]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new Matrix4();
    const q = new Quaternion();
    const s = new Vector3();
    const dir = new Vector3();
    const x = new Vector3(1, 0, 0);
    edges.forEach(([a, b], i) => {
      dir.subVectors(b, a);
      const len = dir.length();
      q.setFromUnitVectors(x, dir.normalize());
      s.set(len * 0.94, 1, 1);
      m.compose(a.clone().add(b).multiplyScalar(0.5), q, s);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [edges]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, edges.length]} frustumCulled={false}>
      <boxGeometry args={[1, 0.05, 0.07]} />
      <meshBasicMaterial color={new Color(2.5, 2.2, 1.75)} toneMapped={false} />
    </instancedMesh>
  );
}

function Poster({ url, w, h, ...props }: { url: string; w: number; h: number } & ThreeElements["group"]) {
  const tex = useLoader(TextureLoader, url);
  tex.colorSpace = SRGBColorSpace;
  return (
    <group {...props}>
      <mesh position={[0, 0, -0.03]} castShadow>
        <boxGeometry args={[w + 0.14, h + 0.14, 0.05]} />
        <meshStandardMaterial color="#3a2616" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.55} />
      </mesh>
      {/* picture light */}
      <mesh position={[0, h / 2 + 0.16, 0.12]}>
        <boxGeometry args={[w * 0.6, 0.04, 0.06]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
      </mesh>
      <spotLight position={[0, h / 2 + 0.2, 0.45]} angle={0.7} penumbra={0.9} intensity={6} distance={3.5} color="#ffd6a0" target-position={[0, -0.4, 0]} />
    </group>
  );
}

/** Steady neon: no flutter. The glow comes from bloom, not from animating it. */
function NeonSign() {
  const neon = useMemo(() => neonTexture(), []);
  const word = useMemo(() => wordmarkTexture(), []);
  const wood = useMemo(() => woodTexture(), []);
  return (
    <group position={[0, 5.0, -D / 2 + 0.11]}>
      {/* warm plank feature wall behind the sign */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[9.4, 2.9, 0.04]} />
        <meshStandardMaterial map={wood} roughness={0.7} color="#c9a07a" />
      </mesh>
      <mesh position={[0, 0.2, 0.05]}>
        <planeGeometry args={[8, 2]} />
        <meshBasicMaterial map={neon} transparent toneMapped={false} color={new Color(2.4, 1.3, 0.6)} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.78, 0.05]}>
        <planeGeometry args={[2.6, 0.65]} />
        <meshBasicMaterial map={word} transparent toneMapped={false} color={new Color(1.2, 1.15, 1.1)} depthWrite={false} />
      </mesh>
      <pointLight position={[0, 0, 1.4]} color="#ff9a4a" intensity={12} distance={6} decay={2} />
    </group>
  );
}

/** Warm filament pendants over the bench and the lift, the cosy note in a working shop. */
function Pendants() {
  const spots: Array<[number, number]> = [
    [-6.8, -7.4],
    [-5.2, -7.4],
    [-3.6, -7.4],
    [6.0, -2.6],
    [7.6, -2.6],
  ];
  return (
    <group>
      {spots.map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position={[0, 5.6, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 2.4, 6]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[0, 4.35, 0]}>
            <coneGeometry args={[0.26, 0.24, 24, 1, true]} />
            <meshStandardMaterial color="#1a1d24" metalness={0.6} roughness={0.35} side={2} />
          </mesh>
          <mesh position={[0, 4.2, 0]}>
            <sphereGeometry args={[0.07, 16, 12]} />
            <meshBasicMaterial color={new Color(3.2, 2.1, 1.0)} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <pointLight position={[-5.2, 4.0, -7.2]} intensity={16} distance={7} color="#ffc27a" />
      <pointLight position={[6.8, 4.0, -2.6]} intensity={14} distance={7} color="#ffc27a" />
    </group>
  );
}

function Building({ mobile }: { mobile: boolean }) {
  const floorMap = useMemo(() => floorTexture(), []);
  const sideRib = useMemo(() => ribTexture("#2c2622", [6, 1]), []);
  const backRib = useMemo(() => ribTexture("#2a2420", [8, 1]), []);
  const wood = useMemo(() => woodTexture(), []);
  const outsideRib = useMemo(() => ribTexture("#3b4252", [10, 1]), []);
  const hazard = useMemo(() => hazardTexture(), []);
  const bay = useMemo(() => stencilTexture("DK BAY 01"), []);
  const wallMat = { roughness: 0.62, metalness: 0.3 } as const;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <MeshReflectorMaterial
          map={floorMap}
          blur={mobile ? [100, 30] : [260, 80]}
          resolution={mobile ? 256 : 768}
          mixBlur={0.8}
          mixStrength={mobile ? 2.2 : 3.2}
          roughness={0.55}
          depthScale={0.8}
          minDepthThreshold={0.5}
          maxDepthThreshold={1.2}
          color="#3a3a3e"
          metalness={0.5}
          mirror={0}
        />
      </mesh>
      {[-5.8, -0.6].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.006, -3.9]}>
          <planeGeometry args={[0.1, 9]} />
          <meshStandardMaterial color={DK.orange} roughness={0.6} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.2, 0.008, -0.2]}>
        <planeGeometry args={[4.2, 1.05]} />
        <meshBasicMaterial map={bay} transparent opacity={0.8} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 2.6]}>
        <ringGeometry args={[1.75, 1.83, 96]} />
        <meshBasicMaterial color={new Color(2.0, 1.0, 0.4)} toneMapped={false} />
      </mesh>

      {/* walls cast shadows too, so the sun stays outside */}
      <mesh position={[0, H / 2, -D / 2 - 0.1]} receiveShadow castShadow>
        <boxGeometry args={[W, H, 0.2]} />
        <meshStandardMaterial map={backRib} {...wallMat} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (W / 2 + 0.1), H / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.2, H, D]} />
          <meshStandardMaterial map={sideRib} {...wallMat} />
        </mesh>
      ))}
      {/* warm timber wainscot with an orange cap rail, all the way round */}
      {[
        { p: [0, 0, -D / 2], r: 0, l: W },
        { p: [-W / 2, 0, 0], r: Math.PI / 2, l: D },
        { p: [W / 2, 0, 0], r: -Math.PI / 2, l: D },
      ].map((b, i) => (
        <group key={i} position={b.p as [number, number, number]} rotation={[0, b.r, 0]}>
          <mesh position={[0, 0.62, 0.012]} receiveShadow>
            <planeGeometry args={[b.l, 1.24]} />
            <meshStandardMaterial map={wood} color="#b98a62" roughness={0.75} />
          </mesh>
          <mesh position={[0, 1.27, 0.03]}>
            <boxGeometry args={[b.l, 0.07, 0.04]} />
            <meshStandardMaterial color={DK.orange} roughness={0.45} />
          </mesh>
        </group>
      ))}
      {/* front wall around the door: navy inside, lighter cladding outside */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (DOOR_W / 2 + (W / 2 - DOOR_W / 2) / 2), H / 2, D / 2 + 0.15]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[W / 2 - DOOR_W / 2, H, 0.3]} />
            <meshStandardMaterial map={sideRib} {...wallMat} />
          </mesh>
          <mesh position={[0, 0, 0.152]}>
            <planeGeometry args={[W / 2 - DOOR_W / 2, H]} />
            <meshStandardMaterial map={outsideRib} roughness={0.7} metalness={0.3} />
          </mesh>
        </group>
      ))}
      <group position={[0, DOOR_H + (H - DOOR_H) / 2, D / 2 + 0.15]}>
        <mesh castShadow>
          <boxGeometry args={[DOOR_W, H - DOOR_H, 0.3]} />
          <meshStandardMaterial map={sideRib} {...wallMat} />
        </mesh>
        <mesh position={[0, 0, 0.152]}>
          <planeGeometry args={[DOOR_W, H - DOOR_H]} />
          <meshStandardMaterial map={outsideRib} roughness={0.7} metalness={0.3} />
        </mesh>
      </group>
      {/* roof with parapet */}
      <mesh position={[0, H + 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[W + 0.4, 0.2, D + 0.6]} />
        <meshStandardMaterial color="#0b0f1c" roughness={0.9} />
      </mesh>
      <mesh position={[0, H + 0.45, D / 2 + 0.32]} castShadow>
        <boxGeometry args={[W + 0.4, 0.5, 0.2]} />
        <meshStandardMaterial color="#2b303b" roughness={0.8} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (DOOR_W / 2 - 0.08), DOOR_H / 2, D / 2 - 0.04]}>
          <boxGeometry args={[0.16, DOOR_H, 0.06]} />
          <meshStandardMaterial map={hazard} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, DOOR_H + 0.35, D / 2 - 0.45]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.42, 0.42, DOOR_W, 40]} />
        <meshStandardMaterial color="#141b30" roughness={0.5} metalness={0.5} />
      </mesh>
      {[-7.5, -4.5, -1.5, 1.5, 4.5, 7.5].map((z) => (
        <mesh key={z} position={[0, H - 0.5, z]}>
          <boxGeometry args={[W, 0.34, 0.12]} />
          <meshStandardMaterial color="#1b2340" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <HexLights />
    </group>
  );
}

function Lights({ mobile }: { mobile: boolean }) {
  return (
    <>
      <ambientLight intensity={0.3} color="#ffe2c4" />
      {/* key on the bear, warm */}
      <spotLight
        position={[3.5, 6.6, 7.5]}
        angle={0.42}
        penumbra={0.8}
        intensity={170}
        distance={22}
        decay={2}
        color="#ffe2c0"
        castShadow
        shadow-mapSize={mobile ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.03}
        target-position={[0, 1.1, 2.6]}
      />
      <spotLight position={[-3, 6, -2]} angle={0.5} penumbra={0.8} intensity={55} distance={16} color="#b9c8ff" target-position={[0, 1.8, 2.6]} />
      {/* spot for the car on the lift */}
      <spotLight position={[-3.2, 6.6, -1]} angle={0.55} penumbra={0.9} intensity={110} distance={14} color="#fff4e6" target-position={[-3.2, 1.6, -4.6]} />
      {[
        [-8, 5.8, -1.5],
        [8, 5.8, -1.5],
        [-8, 5.8, 4.5],
        [8, 5.8, 4.5],
        [0, 5.8, 5],
      ].map((p, i) => (
        <pointLight key={i} position={p as [number, number, number]} intensity={20} distance={12} decay={2} color="#ffe4c4" />
      ))}
    </>
  );
}

function Hero({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <group position={[0, 0, 2.6]}>
      <DkBear reducedMotion={reducedMotion} height={2.15} />
      <OpenToolbox position={[-1.15, 0, 0.25]} rotation={[0, 0.35, 0]} scale={1.3} />
      <Tire position={[1.25, 0.34, -0.05]} rotation={[0, -0.5, 0]} />
      <JumpPack position={[0.95, 0, 0.55]} rotation={[0, -0.4, 0]} scale={1.2} />
      <TrafficCone position={[1.65, 0, 0.45]} />
      {[-0.95, -0.82, -0.69, -0.56].map((x, i) => (
        <Socket key={x} position={[x, 0.04, 0.95 + (i % 2) * 0.06]} />
      ))}
      <LugWrench position={[-0.55, 0.015, 1.35]} rotation={[0, 0.4, 0]} />
      <FloorJack position={[-0.1, 0, 1.2]} rotation={[0, -0.25, 0]} />
      <HoseCoil position={[0.35, 0, 1.0]} />
      <Scanner position={[0.8, 0, 1.15]} rotation={[0, 0.3, 0]} />
      <HardCase position={[1.35, 0, 1.2]} rotation={[0, -0.3, 0]} />
    </group>
  );
}

/**
 * Bays run left to right in the order the tour visits them:
 * tires, battery (with the calendar corner), oil, the lift, diagnostics, detailing.
 */
function Zones({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <group>
      {/* 1. tires: left wall, rear */}
      <TireRack position={[-W / 2 + 0.55, 0, -3.4]} rotation={[0, Math.PI / 2, 0]} length={5} />
      <TireChanger position={[-9.0, 0, -1.4]} rotation={[0, 0.7, 0]} />
      <WheelBalancer position={[-9.2, 0, -4.8]} rotation={[0, 0.9, 0]} />
      <TireStack position={[-8.4, 0, 0.9]} count={5} />
      <TireStack position={[-9.3, 0, 1.4]} count={3} />
      <Extinguisher position={[-W / 2 + 0.3, 0.9, 1.9]} />

      {/* 2. battery: left wall, front, with the calendar and clock in the corner */}
      <group position={[-W / 2 + 0.6, 0, 4.4]} rotation={[0, Math.PI / 2, 0]}>
        {[0.1, 0.75, 1.4].map((y) => (
          <group key={y}>
            <mesh position={[0, y, 0]} receiveShadow>
              <boxGeometry args={[2.4, 0.05, 0.6]} />
              <meshStandardMaterial color={DK.navy} metalness={0.4} roughness={0.4} />
            </mesh>
            {[-0.85, -0.45, -0.05, 0.35, 0.75].map((x) => (
              <Battery key={x} position={[x, y + 0.025, 0.05]} />
            ))}
          </group>
        ))}
        {[-1.18, 1.18].map((x) =>
          [-0.27, 0.27].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 1.0, z]}>
              <boxGeometry args={[0.05, 2.0, 0.05]} />
              <meshStandardMaterial color={DK.orange} roughness={0.4} />
            </mesh>
          )),
        )}
        <LogoDecal size={0.5} position={[0, 2.35, -0.25]} />
      </group>
      <group position={[-7.8, 0, 4.2]} rotation={[0, 0.5, 0]}>
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.05, 0.6]} />
          <meshStandardMaterial color="#15171c" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[1.2, 0.04, 0.6]} />
          <meshStandardMaterial color="#15171c" metalness={0.5} roughness={0.4} />
        </mesh>
        {[-0.55, 0.55].map((x) =>
          [-0.26, 0.26].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 0.3, z]}>
              <boxGeometry args={[0.04, 0.55, 0.04]} />
              <meshStandardMaterial color={DK.orange} />
            </mesh>
          )),
        )}
        <JumpPack position={[-0.3, 0.58, 0]} />
        <JumpPack position={[0.25, 0.58, 0.02]} rotation={[0, 0.3, 0]} />
        <Battery position={[-0.25, 0.225, 0]} />
        <Battery position={[0.2, 0.225, 0]} />
      </group>
      <group position={[-W / 2 + 0.02, 0, 7.2]} rotation={[0, Math.PI / 2, 0]}>
        <WallCalendar position={[0, 2.35, 0]} />
        <WallClock position={[0, 3.95, 0]} />
      </group>
      <TrafficCone position={[-6.2, 0, 5.8]} />

      {/* 3. oil and fluids: back wall, left */}
      <OilShelf position={[-8.5, 0, -D / 2 + 0.4]} />
      <Workbench position={[-5.2, 0, -8.35]} length={3.2} />
      <Pegboard position={[-5.2, 2.35, -D / 2 + 0.03]} width={3.2} height={1.5} />
      <OilDrum position={[-2.2, 0, -8.1]} color={DK.orange} />
      <OilDrum position={[-1.5, 0, -8.35]} />
      <DrainPan position={[-4.0, 0, -4.6]} />

      {/* 4. the lift */}
      <LiftWithCar position={[-3.2, 0, -4.6]} />
      <JackStand position={[-4.8, 0, -2.6]} />
      <JackStand position={[-1.5, 0, -2.6]} />
      <Creeper position={[-2.4, 0, -2.3]} rotation={[0, 1.3, 0]} />

      {/* 5. diagnostics: right, rear */}
      <Suspense fallback={null}>
        <Poster url="/brand/nuhome/poster-toolkit.jpg" w={1.6} h={2.0} position={[4.6, 2.7, -D / 2 + 0.03]} />
        <Poster url="/brand/nuhome/poster-portrait.jpg" w={2.3} h={1.6} position={[8.0, 2.7, -D / 2 + 0.03]} />
      </Suspense>
      <DiagCart position={[7.0, 0, -2.8]} rotation={[0, -0.7, 0]} reducedMotion={reducedMotion} />
      <ToolChest position={[W / 2 - 0.5, 0, -2.4]} rotation={[0, -Math.PI / 2, 0]} width={2.0} height={1.75} />
      <ToolChest position={[W / 2 - 0.5, 0, -5.0]} rotation={[0, -Math.PI / 2, 0]} width={1.4} />
      <ToolChest position={[10.4, 0, -8.35]} width={1.8} height={1.7} />
      <Creeper position={[9.0, 0, 0.6]} rotation={[0, 0.3, 0]} />

      {/* 6. detailing: right, front */}
      <DetailShelf position={[W / 2 - 0.4, 0, 4.6]} rotation={[0, -Math.PI / 2, 0]} />
      <PressureWasher position={[8.6, 0, 4.0]} rotation={[0, -0.9, 0]} />
      <Bucket position={[7.7, 0, 5.0]} />
      <Bucket position={[8.1, 0, 5.5]} color={DK.navy} />
      <Polisher position={[7.4, 0, 3.6]} rotation={[0, 0.8, 0]} />
      <TrafficCone position={[6.2, 0, 6.2]} />
    </group>
  );
}

export function GarageScene({ reducedMotion }: { reducedMotion: boolean }) {
  const { size } = useThree();
  const mobile = size.width < 768;
  return (
    <>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.6} color="#fff0dc" position={[0, 6.5, 0]} rotation-x={Math.PI / 2} scale={[14, 10, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#ff9a4a" position={[0, 3, -9]} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={0.7} color="#9fb2ff" position={[-11, 3, 0]} rotation-y={Math.PI / 2} scale={[14, 4, 1]} />
        <Lightformer form="rect" intensity={0.9} color="#ffe6cc" position={[11, 3, 0]} rotation-y={-Math.PI / 2} scale={[14, 4, 1]} />
      </Environment>
      <Lights mobile={mobile} />
      <Building mobile={mobile} />
      <NeonSign />
      <Pendants />
      <Suspense fallback={null}>
        <Outdoor mobile={mobile} />
        <Hero reducedMotion={reducedMotion} />
        <Zones reducedMotion={reducedMotion} />
      </Suspense>
      {!reducedMotion && (
        <Sparkles count={mobile ? 50 : 110} scale={[20, 6, 16]} position={[0, 3.2, 0]} size={2.4} speed={0.12} opacity={0.3} color="#ffd9b0" />
      )}
      <EffectComposer multisampling={mobile ? 2 : 4}>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.25} intensity={mobile ? 0.6 : 0.85} />
        <Vignette eskil={false} offset={0.24} darkness={0.6} />
      </EffectComposer>
    </>
  );
}
