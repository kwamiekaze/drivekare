import { Environment, Lightformer, MeshReflectorMaterial, Sparkles } from "@react-three/drei";
import { useFrame, useLoader, useThree, type ThreeElements } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import {
  Color,
  InstancedMesh,
  Matrix4,
  Quaternion,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type Mesh,
  type PointLight,
} from "three";
import { DkBear } from "./DkBear";
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
  ServiceVan,
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
      <meshBasicMaterial color={new Color(2.6, 2.6, 2.7)} toneMapped={false} />
    </instancedMesh>
  );
}

function Poster({ url, w, h, ...props }: { url: string; w: number; h: number } & ThreeElements["group"]) {
  const tex = useLoader(TextureLoader, url);
  tex.colorSpace = SRGBColorSpace;
  return (
    <group {...props}>
      <mesh position={[0, 0, -0.02]} castShadow>
        <boxGeometry args={[w + 0.14, h + 0.14, 0.05]} />
        <meshStandardMaterial color="#0c0f18" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.55} />
      </mesh>
    </group>
  );
}

function NeonSign() {
  const neon = useMemo(() => neonTexture(), []);
  const word = useMemo(() => wordmarkTexture(), []);
  const flick = useRef<Mesh>(null);
  const light = useRef<PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // An occasional flutter, like a real tube warming up.
    const f = Math.sin(t * 37) > 0.97 && Math.sin(t * 0.7) > 0.6 ? 0.55 : 1;
    const mat = flick.current?.material as { color?: Color } | undefined;
    mat?.color?.setRGB(2.6 * f, 1.35 * f, 0.6 * f);
    if (light.current) light.current.intensity = 14 * f;
  });
  return (
    <group position={[0, 5.15, -D / 2 + 0.08]}>
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[8.6, 1.9, 0.06]} />
        <meshStandardMaterial color="#0a0e1a" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh ref={flick} position={[0, 0.2, 0.02]}>
        <planeGeometry args={[8, 2]} />
        <meshBasicMaterial map={neon} transparent toneMapped={false} color={new Color(2.6, 1.35, 0.6)} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.72, 0.02]}>
        <planeGeometry args={[2.6, 0.65]} />
        <meshBasicMaterial map={word} transparent toneMapped={false} color={new Color(1.3, 1.3, 1.3)} depthWrite={false} />
      </mesh>
      <pointLight ref={light} position={[0, 0, 1.2]} color="#ff8a3a" intensity={14} distance={6} decay={2} />
    </group>
  );
}

function Building({ mobile }: { mobile: boolean }) {
  const floorMap = useMemo(() => floorTexture(), []);
  const sideRib = useMemo(() => ribTexture("#1a2342", [6, 1]), []);
  const backRib = useMemo(() => ribTexture("#172039", [8, 1]), []);
  const hazard = useMemo(() => hazardTexture(), []);
  const bay = useMemo(() => stencilTexture("DK BAY 01"), []);

  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <MeshReflectorMaterial
          map={floorMap}
          blur={mobile ? [100, 30] : [260, 80]}
          resolution={mobile ? 256 : 768}
          mixBlur={0.8}
          mixStrength={mobile ? 2.5 : 3.5}
          roughness={0.55}
          depthScale={0.8}
          minDepthThreshold={0.5}
          maxDepthThreshold={1.2}
          color="#2f343e"
          metalness={0.55}
          mirror={0}
        />
      </mesh>
      {/* bay lines */}
      {[-6.6, 0.2].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.004, -3.6]}>
          <planeGeometry args={[0.1, 9.5]} />
          <meshStandardMaterial color={DK.orange} roughness={0.6} emissive={DK.orange} emissiveIntensity={0.12} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.2, 0.005, -0.4]}>
        <planeGeometry args={[4.2, 1.05]} />
        <meshBasicMaterial map={bay} transparent opacity={0.8} depthWrite={false} />
      </mesh>
      {/* hero ring under the bear */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 2.6]}>
        <ringGeometry args={[1.75, 1.83, 96]} />
        <meshBasicMaterial color={new Color(2.2, 1.0, 0.35)} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 2.6]}>
        <ringGeometry args={[1.95, 1.97, 96]} />
        <meshBasicMaterial color={DK.orange} transparent opacity={0.5} />
      </mesh>

      {/* walls */}
      <mesh position={[0, H / 2, -D / 2]} receiveShadow>
        <boxGeometry args={[W, H, 0.2]} />
        <meshStandardMaterial map={backRib} roughness={0.6} metalness={0.35} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * W) / 2, H / 2, 0]} receiveShadow>
          <boxGeometry args={[0.2, H, D]} />
          <meshStandardMaterial map={sideRib} roughness={0.6} metalness={0.35} />
        </mesh>
      ))}
      {/* orange wainscot band */}
      {[
        { p: [0, 1.25, -D / 2 + 0.11], r: 0, l: W },
        { p: [-W / 2 + 0.11, 1.25, 0], r: Math.PI / 2, l: D },
        { p: [W / 2 - 0.11, 1.25, 0], r: -Math.PI / 2, l: D },
      ].map((b, i) => (
        <mesh key={i} position={b.p as [number, number, number]} rotation={[0, b.r, 0]}>
          <planeGeometry args={[b.l, 0.12]} />
          <meshStandardMaterial color={DK.orange} roughness={0.5} />
        </mesh>
      ))}
      {/* front wall with the door opening */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (DOOR_W / 2 + (W / 2 - DOOR_W / 2) / 2), H / 2, D / 2]}>
          <boxGeometry args={[W / 2 - DOOR_W / 2, H, 0.3]} />
          <meshStandardMaterial map={sideRib} roughness={0.6} metalness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, DOOR_H + (H - DOOR_H) / 2, D / 2]}>
        <boxGeometry args={[DOOR_W, H - DOOR_H, 0.3]} />
        <meshStandardMaterial map={sideRib} roughness={0.6} metalness={0.35} />
      </mesh>
      {/* door frame hazard edges and the rolled-up door drum */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (DOOR_W / 2 - 0.08), DOOR_H / 2, D / 2 - 0.16]}>
          <boxGeometry args={[0.16, DOOR_H, 0.06]} />
          <meshStandardMaterial map={hazard} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, DOOR_H + 0.35, D / 2 - 0.45]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.42, 0.42, DOOR_W, 40]} />
        <meshStandardMaterial color="#141b30" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* ceiling and trusses */}
      <mesh position={[0, H, 0]}>
        <boxGeometry args={[W, 0.2, D]} />
        <meshStandardMaterial color="#0b1020" roughness={0.9} />
      </mesh>
      {[-7.5, -4.5, -1.5, 1.5, 4.5, 7.5].map((z) => (
        <group key={z} position={[0, H - 0.5, z]}>
          <mesh>
            <boxGeometry args={[W, 0.34, 0.12]} />
            <meshStandardMaterial color="#1b2340" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.18, 0]}>
            <boxGeometry args={[W, 0.03, 0.28]} />
            <meshStandardMaterial color="#1b2340" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}
      <HexLights />

      {/* outside: wet apron and night */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, D / 2 + 12]} receiveShadow>
        <planeGeometry args={[60, 24]} />
        <meshStandardMaterial color="#07090e" roughness={0.35} metalness={0.4} />
      </mesh>
    </group>
  );
}

function Lights({ mobile }: { mobile: boolean }) {
  return (
    <>
      <ambientLight intensity={0.12} />
      <hemisphereLight args={["#b9c6ff", "#10131c", 0.35]} />
      {/* key light on the bear */}
      <spotLight
        position={[3.5, 6.6, 7.5]}
        angle={0.42}
        penumbra={0.7}
        intensity={180}
        distance={22}
        decay={2}
        color="#fff1e0"
        castShadow
        shadow-mapSize={mobile ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0004}
        target-position={[0, 1.1, 2.4]}
      />
      {/* rim light from behind */}
      <spotLight position={[-3, 6, -2]} angle={0.5} penumbra={0.8} intensity={70} distance={16} color="#9fb6ff" target-position={[0, 1.8, 2.4]} />
      {/* bay fills under the hex grid */}
      {[
        [0, 6, -3.5],
        [-8, 5.8, -1.5],
        [8, 5.8, -1.5],
        [-8, 5.8, 4.5],
        [8, 5.8, 4.5],
        [0, 5.8, 5],
      ].map((p, i) => (
        <pointLight key={i} position={p as [number, number, number]} intensity={22} distance={12} decay={2} color="#eef2ff" />
      ))}
      {/* orange glow from the door side, outside */}
      <pointLight position={[0, 3.5, 12]} intensity={8} distance={10} color="#9fb6ff" />
    </>
  );
}

function Hero({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <group position={[0, 0, 2.6]}>
      <DkBear reducedMotion={reducedMotion} height={2.15} />
      {/* the kit from the figure, laid out around his boots */}
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

function Zones({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <group>
      {/* lift bay */}
      <LiftWithCar position={[-3.2, 0, -4.6]} />
      <JackStand position={[-4.8, 0, -2.6]} />
      <JackStand position={[-1.5, 0, -2.6]} />
      <Creeper position={[-2.4, 0, -2.3]} rotation={[0, 1.3, 0]} />
      <OilDrum position={[-2.8, 0, -7.9]} color={DK.orange} />
      <OilDrum position={[-2.1, 0, -8.2]} />

      {/* repair wall */}
      <Workbench position={[-5.6, 0, -8.35]} length={3.2} />
      <Pegboard position={[-5.6, 2.35, -D / 2 + 0.14]} width={3.2} height={1.5} />
      <Suspense fallback={null}>
        <Poster url="/brand/nuhome/poster-toolkit.jpg" w={1.6} h={2.0} position={[4.6, 2.6, -D / 2 + 0.14]} />
        <Poster url="/brand/nuhome/poster-portrait.jpg" w={2.3} h={1.6} position={[7.6, 2.6, -D / 2 + 0.14]} />
      </Suspense>
      <ToolChest position={[3.9, 0, -8.35]} width={1.3} />
      <ToolChest position={[9.8, 0, -8.35]} width={1.8} height={1.7} />

      {/* tires, left rear */}
      <TireRack position={[-W / 2 + 0.55, 0, -3.4]} rotation={[0, Math.PI / 2, 0]} length={5} />
      <TireChanger position={[-9.0, 0, -1.4]} rotation={[0, 0.7, 0]} />
      <WheelBalancer position={[-9.2, 0, -4.8]} rotation={[0, 0.9, 0]} />
      <TireStack position={[-8.4, 0, 0.9]} count={5} />
      <TireStack position={[-9.3, 0, 1.4]} count={3} />
      <TireStack position={[-7.6, 0, 1.6]} count={4} />
      <Extinguisher position={[-W / 2 + 0.3, 0.9, 1.9]} />

      {/* jump starts, left front */}
      <group position={[-W / 2 + 0.6, 0, 4.6]} rotation={[0, Math.PI / 2, 0]}>
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
        <Battery position={[-0.25, 0.22, 0]} />
        <Battery position={[0.2, 0.22, 0]} />
      </group>
      <TrafficCone position={[-6.2, 0, 5.8]} />
      <TrafficCone position={[-5.6, 0, 6.4]} rotation={[0, 0.6, 0]} />

      {/* diagnostics, right */}
      <DiagCart position={[8.4, 0, -1.2]} rotation={[0, -0.95, 0]} reducedMotion={reducedMotion} />
      <ToolChest position={[W / 2 - 0.5, 0, -2.2]} rotation={[0, -Math.PI / 2, 0]} width={2.0} height={1.75} />
      <ToolChest position={[W / 2 - 0.5, 0, -4.6]} rotation={[0, -Math.PI / 2, 0]} width={1.4} />
      <Creeper position={[9.4, 0, 1.1]} rotation={[0, 0.3, 0]} />

      {/* detailing, right front */}
      <DetailShelf position={[W / 2 - 0.4, 0, 4.6]} rotation={[0, -Math.PI / 2, 0]} />
      <PressureWasher position={[8.6, 0, 4.0]} rotation={[0, -0.9, 0]} />
      <Bucket position={[7.7, 0, 5.0]} />
      <Bucket position={[8.1, 0, 5.5]} color={DK.navy} />
      <Polisher position={[7.4, 0, 3.6]} rotation={[0, 0.8, 0]} />
      <TrafficCone position={[6.2, 0, 6.2]} />

      {/* oil bay, back left beside the bench */}
      <OilShelf position={[-9.4, 0, -D / 2 + 0.4]} />
      <DrainPan position={[-4.0, 0, -4.6]} />

      {/* the service van on the apron outside */}
      <ServiceVan position={[8.8, 0, 13.4]} rotation={[0, 0.35, 0]} />
      <TrafficCone position={[5.6, 0, 11.6]} />
      <pointLight position={[11, 4.2, 19]} intensity={45} distance={16} color="#dfe6ff" />
      <pointLight position={[5, 3, 15]} intensity={12} distance={8} color="#ff8a3a" />
    </group>
  );
}

export function GarageScene({ reducedMotion }: { reducedMotion: boolean }) {
  const { size } = useThree();
  const mobile = size.width < 768;
  return (
    <>
      <color attach="background" args={[DK.night]} />
      <fog attach="fog" args={[DK.night, 18, 46]} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 6.5, 0]} rotation-x={Math.PI / 2} scale={[14, 10, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#ff9a4a" position={[0, 3, -9]} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#8aa4ff" position={[-11, 3, 0]} rotation-y={Math.PI / 2} scale={[14, 4, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#ffffff" position={[11, 3, 0]} rotation-y={-Math.PI / 2} scale={[14, 4, 1]} />
      </Environment>
      <Lights mobile={mobile} />
      <Building mobile={mobile} />
      <NeonSign />
      <Suspense fallback={null}>
        <Hero reducedMotion={reducedMotion} />
        <Zones reducedMotion={reducedMotion} />
      </Suspense>
      {!reducedMotion && (
        <Sparkles count={mobile ? 60 : 140} scale={[20, 6, 16]} position={[0, 3.2, 0]} size={2.2} speed={0.18} opacity={0.35} color="#ffd9b0" />
      )}
      <EffectComposer multisampling={mobile ? 0 : 4}>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={mobile ? 0.7 : 1.0} />
        <Vignette eskil={false} offset={0.22} darkness={0.72} />
      </EffectComposer>
    </>
  );
}
