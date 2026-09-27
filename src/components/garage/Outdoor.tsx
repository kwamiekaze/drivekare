import { Sparkles } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { BRAND_LOGO } from "./brand";
import { ServiceVan, TrafficCone } from "./Equipment";
import { GrassField, RealisticShrubs, RealisticTrees, type ShrubSpec, type TreeSpec } from "./Foliage";
import { asphaltTexture, DK, signTexture } from "./textures";

/**
 * The world outside the roll-up door, lit by the visitor's own clock the way
 * the Fixing365 street is: a business lot with the DriveKare van in its bay,
 * a curb and sidewalk, trees and planting, lamps that come on in the evening,
 * neighbouring units and a painted horizon under a live sky.
 */

export function localHour() {
  if (typeof window !== "undefined") {
    const o = new URLSearchParams(window.location.search).get("time");
    if (o !== null && !Number.isNaN(Number(o))) return Number(o);
  }
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}
/** 0 at night, 1 at midday, smooth dawn and dusk. */
export function daylight(hour = localHour()) {
  const x = Math.sin(((hour - 6) / 12) * Math.PI);
  return THREE.MathUtils.clamp(x * 1.6 + 0.15, 0, 1);
}
export function useClockHour() {
  const [h, setH] = useState(localHour);
  useEffect(() => {
    const id = window.setInterval(() => setH(localHour()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return h;
}
export const isEvening = (hour: number) => hour >= 19 || hour < 7;

// Building front sits at z = 9. The lot runs from there to the curb at z = 30.
const CURB_Z = 30;

const TREES: TreeSpec[] = [
  [-17, 12, 1.1],
  [-21, 20, 1.2],
  [-16, 27, 1],
  [17, 11.5, 1.05],
  [22, 19, 1.25],
  [17, 27.5, 1],
  [-8, 33.5, 0.9],
  [8, 33.5, 0.95],
  [-26, 33, 1.1],
  [26, 33, 1.05],
];
const SHRUBS: ShrubSpec[] = [
  ...[-10.8, -9.6, -8.4, -7.2].map((x, i): ShrubSpec => [x, 10.1, 1.0 + (i % 2) * 0.15, 0.8, 0.85]),
  ...[7.2, 8.4, 9.6, 10.8].map((x, i): ShrubSpec => [x, 10.1, 1.0 + (i % 2) * 0.15, 0.8, 0.85]),
];

function Sky({ day }: { day: number }) {
  const mat = useMemo(() => {
    const top = new THREE.Color("#050a18").lerp(new THREE.Color("#3f7fc4"), day);
    const horizon = new THREE.Color("#1a2238").lerp(new THREE.Color("#f3d9b5"), day);
    const dusk = 1 - Math.abs(day - 0.45) * 2.2;
    if (dusk > 0) horizon.lerp(new THREE.Color("#ff9a5a"), dusk * 0.55);
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { top: { value: top }, horizon: { value: horizon } },
      vertexShader:
        "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader:
        "uniform vec3 top; uniform vec3 horizon; varying vec3 vP; void main(){ float h = clamp(vP.y*1.6+0.05,0.0,1.0); gl_FragColor = vec4(mix(horizon, top, pow(h,0.7)),1.0); }",
    });
  }, [day]);
  return (
    <mesh material={mat} renderOrder={-2} position={[0, 0, 10]}>
      <sphereGeometry args={[150, 24, 16]} />
    </mesh>
  );
}

/** Painted panoramic horizon (the Fixing365 backdrop), blended into the live sky. */
function Backdrop({ day }: { day: number }) {
  const mat = useMemo(() => {
    const top = new THREE.Color("#050a18").lerp(new THREE.Color("#3f7fc4"), day);
    const horizon = new THREE.Color("#1a2238").lerp(new THREE.Color("#f3d9b5"), day);
    const tint = new THREE.Color("#3b4666").lerp(new THREE.Color("#ffffff"), Math.min(1, day * 2.2));
    const uMap = { value: null as THREE.Texture | null };
    const uHas = { value: 0 };
    const m = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        map: uMap,
        hasMap: uHas,
        top: { value: top },
        horizon: { value: horizon },
        tint: { value: tint },
        skyMix: { value: THREE.MathUtils.smoothstep(day, 0.45, 0.85) },
      },
      vertexShader:
        "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: [
        "uniform sampler2D map; uniform float hasMap; uniform vec3 top; uniform vec3 horizon; uniform vec3 tint; uniform float skyMix;",
        "varying vec2 vUv;",
        "void main(){",
        "  vec3 sky = mix(horizon, top, pow(clamp((vUv.y-0.18)*1.4,0.0,1.0),0.7));",
        "  vec3 img = texture2D(map, vUv).rgb * tint;",
        "  float band = 1.0 - smoothstep(0.34, 0.62, vUv.y);",
        "  float keep = hasMap * max(band, 1.0 - skyMix);",
        "  gl_FragColor = vec4(mix(sky, img, keep), 1.0);",
        "  #include <tonemapping_fragment>",
        "  #include <colorspace_fragment>",
        "}",
      ].join("\n"),
    });
    new THREE.TextureLoader().load("/brand/nuhome/backdrop.webp", (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = THREE.MirroredRepeatWrapping;
      t.repeat.set(3, 1);
      uMap.value = t;
      uHas.value = 1;
    });
    return m;
  }, [day]);
  return (
    <mesh material={mat} position={[0, 15, 10]} renderOrder={-1}>
      <cylinderGeometry args={[125, 125, 40, 48, 1, true]} />
    </mesh>
  );
}

const beamMat = new THREE.MeshBasicMaterial({
  color: "#ffd9a0",
  transparent: true,
  opacity: 0.06,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
});
const poolMat = new THREE.MeshBasicMaterial({
  color: "#ffcf8a",
  transparent: true,
  opacity: 0.22,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
});

function StreetLamp({ x, z, on, face = 0 }: { x: number; z: number; on: boolean; face?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, face, 0]}>
      <mesh position={[0, 2.6, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 5.2, 10]} />
        <meshStandardMaterial color="#1b1f28" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 5.2, 0.45]}>
        <boxGeometry args={[0.14, 0.08, 0.9]} />
        <meshStandardMaterial color="#1b1f28" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 5.14, 0.8]}>
        <boxGeometry args={[0.3, 0.05, 0.34]} />
        {on ? (
          <meshBasicMaterial color={new THREE.Color(3, 2.5, 1.8)} toneMapped={false} />
        ) : (
          <meshStandardMaterial color="#d9dde3" />
        )}
      </mesh>
      {on && (
        <group position={[0, 0, 0.8]}>
          <pointLight position={[0, 4.9, 0]} intensity={26} distance={14} decay={1.6} color="#ffd9a0" />
          <mesh material={beamMat} position={[0, 2.5, 0]}>
            <coneGeometry args={[1.9, 5, 24, 1, true]} />
          </mesh>
          <mesh material={poolMat} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[2.4, 32]} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/** Neighbouring business units along the lot, windows lit after dark. */
function Unit({ x, z, w, d, h, color, lit, face }: { x: number; z: number; w: number; d: number; h: number; color: string; lit: boolean; face: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, face, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, h + 0.2, 0]}>
        <boxGeometry args={[w + 0.3, 0.4, d + 0.3]} />
        <meshStandardMaterial color="#20242c" roughness={0.7} />
      </mesh>
      {Array.from({ length: Math.floor(w / 2.2) }).map((_, i) => (
        <mesh key={i} position={[-w / 2 + 1.3 + i * 2.2, h * 0.45, d / 2 + 0.02]}>
          <planeGeometry args={[1.6, h * 0.45]} />
          {lit ? (
            <meshBasicMaterial color={new THREE.Color(1.6, 1.3, 0.9)} toneMapped={false} />
          ) : (
            <meshStandardMaterial color="#1c2733" metalness={0.6} roughness={0.08} />
          )}
        </mesh>
      ))}
    </group>
  );
}

/** Parking stall lines, painted once into one texture on the lot. */
function lotLinesTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 1024, 1024);
  g.strokeStyle = "rgba(240,236,226,0.85)";
  g.lineWidth = 6;
  // Two rows of angled stalls either side of the drive lane, plus a hatch box.
  const stall = 1024 / 16;
  for (let i = 0; i <= 5; i += 1) {
    for (const side of [-1, 1]) {
      const x = side < 0 ? 40 + i * stall : 1024 - 40 - i * stall;
      g.beginPath();
      g.moveTo(x, 180);
      g.lineTo(x, 420);
      g.stroke();
    }
  }
  g.fillStyle = "rgba(232,116,30,0.8)";
  g.font = "800 44px 'Anton', 'Arial Black', sans-serif";
  g.textAlign = "center";
  g.fillText("DRIVEKARE", 1024 - 40 - 2.5 * stall, 470);
  g.fillText("SERVICE", 1024 - 40 - 2.5 * stall, 515);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function Pylon({ lit }: { lit: boolean }) {
  const sign = useMemo(() => signTexture(), []);
  const logo = useLoader(THREE.TextureLoader, BRAND_LOGO);
  logo.colorSpace = THREE.SRGBColorSpace;
  return (
    <group position={[-13.5, 0, CURB_Z - 2.2]} rotation={[0, 0.35, 0]}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.6, 0.6, 0.8]} />
        <meshStandardMaterial color="#3a3f48" roughness={0.9} />
      </mesh>
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} position={[x, 2.2, 0]} castShadow>
          <boxGeometry args={[0.18, 3.8, 0.18]} />
          <meshStandardMaterial color="#1b1f28" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 4.2, 0]} castShadow>
        <boxGeometry args={[2.6, 2.1, 0.35]} />
        <meshStandardMaterial color={DK.navyDeep} roughness={0.5} />
      </mesh>
      {[1, -1].map((s) => (
        <group key={s} rotation={[0, s === 1 ? 0 : Math.PI, 0]}>
          <mesh position={[0, 4.55, 0.18]}>
            <planeGeometry args={[1.1, 1.0]} />
            <meshStandardMaterial map={logo} transparent alphaTest={0.3} emissiveMap={logo} emissive={lit ? "#ffffff" : "#000000"} emissiveIntensity={lit ? 1.1 : 0} />
          </mesh>
          <mesh position={[0, 3.62, 0.18]}>
            <planeGeometry args={[2.3, 0.56]} />
            <meshStandardMaterial map={sign} emissiveMap={sign} emissive={lit ? "#ffffff" : "#000000"} emissiveIntensity={lit ? 1 : 0} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Lit DRIVEKARE letters over the roll-up door. */
function FacadeSign({ lit }: { lit: boolean }) {
  const sign = useMemo(() => signTexture(), []);
  return (
    <group position={[0, 6.3, 9.55]}>
      <mesh>
        <boxGeometry args={[6.6, 1.5, 0.12]} />
        <meshStandardMaterial color={DK.navyDeep} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.065]}>
        <planeGeometry args={[6.2, 1.4]} />
        <meshStandardMaterial map={sign} emissiveMap={sign} emissive="#ffffff" emissiveIntensity={lit ? 1.4 : 0.35} />
      </mesh>
      {[-4, 4].map((x) => (
        <group key={x} position={[x, -0.9, 0.2]}>
          <mesh>
            <boxGeometry args={[0.3, 0.4, 0.2]} />
            <meshStandardMaterial color="#1b1f28" />
          </mesh>
          <mesh position={[0, -0.21, 0]}>
            <boxGeometry args={[0.22, 0.02, 0.14]} />
            <meshBasicMaterial color={new THREE.Color(2.6, 2.2, 1.6)} toneMapped={false} />
          </mesh>
          {lit && <pointLight position={[0, -0.5, 0.4]} intensity={8} distance={6} color="#ffd9a0" />}
        </group>
      ))}
    </group>
  );
}

export function Outdoor({ mobile }: { mobile: boolean }) {
  const hour = useClockHour();
  const day = useMemo(() => daylight(hour), [hour]);
  const evening = isEvening(hour);
  const night = day < 0.35;
  const asphalt = useMemo(() => asphaltTexture(), []);
  const lines = useMemo(() => lotLinesTexture(), []);
  const sun = useMemo(() => {
    const a = ((hour - 6) / 12) * Math.PI;
    return new THREE.Vector3(Math.cos(a) * 26 + 6, Math.max(6, Math.sin(a) * 30), 34);
  }, [hour]);
  const golden = 1 - Math.abs(day - 0.5) * 2;
  const sunColor = new THREE.Color("#9fb6ff")
    .lerp(new THREE.Color("#fff1dc"), day)
    .lerp(new THREE.Color("#ffb877"), Math.max(0, golden) * 0.6);
  const haze = new THREE.Color("#141c33").lerp(new THREE.Color("#ecd9bf"), day);

  return (
    <group>
      <fog attach="fog" args={[haze.getStyle(), 40, 120]} />
      <Sky day={day} />
      <Backdrop day={day} />
      <hemisphereLight args={[night ? "#51659a" : "#dcebff", "#6b5238", 0.25 + day * 0.55]} />
      <directionalLight
        position={night ? [-14, 26, 30] : sun.toArray()}
        intensity={night ? 0.5 : 1.2 + day * 1.6}
        color={sunColor}
        castShadow
        shadow-mapSize={mobile ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-22}
        shadow-camera-far={110}
        target-position={[0, 0, 12]}
      />

      {/* lot, curb, sidewalk, street */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 19.5]} receiveShadow>
        <planeGeometry args={[70, 21]} />
        <meshStandardMaterial map={asphalt} roughness={0.85} color="#8a8d94" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 19.5]}>
        <planeGeometry args={[34, 21]} />
        <meshBasicMaterial map={lines} transparent depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.08, CURB_Z]} receiveShadow castShadow>
        <boxGeometry args={[70, 0.16, 0.3]} />
        <meshStandardMaterial color="#b9b4aa" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.07, CURB_Z + 1.4]} receiveShadow>
        <boxGeometry args={[70, 0.14, 2.5]} />
        <meshStandardMaterial color="#a39d92" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, CURB_Z + 7]} receiveShadow>
        <planeGeometry args={[140, 9]} />
        <meshStandardMaterial map={asphalt} roughness={0.8} color="#6d7078" />
      </mesh>
      {Array.from({ length: 24 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-66 + i * 5.8, 0.002, CURB_Z + 7]}>
          <planeGeometry args={[2.4, 0.14]} />
          <meshBasicMaterial color="#e8c24a" />
        </mesh>
      ))}
      {/* planting strips and grass either side of the lot */}
      {[-1, 1].map((s) => (
        <mesh key={s} rotation={[-Math.PI / 2, 0, 0]} position={[s * 24.5, 0.01, 19.5]} receiveShadow>
          <planeGeometry args={[15, 21]} />
          <meshStandardMaterial color="#3e5a2a" roughness={1} />
        </mesh>
      ))}
      {/* front beds either side of the door */}
      {[-1, 1].map((s) => (
        <mesh key={`bed${s}`} position={[s * 9, 0.12, 10.1]} receiveShadow castShadow>
          <boxGeometry args={[5.8, 0.24, 1.6]} />
          <meshStandardMaterial color="#6a5a48" roughness={0.95} />
        </mesh>
      ))}
      <RealisticShrubs shrubs={SHRUBS} />
      <RealisticTrees trees={TREES} />
      {!mobile && <GrassField area={[-32, 9.5, -17.5, 29.5]} avoid={[]} count={1600} />}
      {!mobile && <GrassField area={[17.5, 9.5, 32, 29.5]} avoid={[]} count={1600} />}

      {/* lamps along the lot */}
      {[-11, 11].map((x) => (
        <StreetLamp key={x} x={x} z={CURB_Z - 1} on={evening} face={Math.PI} />
      ))}
      <StreetLamp x={-1.5} z={CURB_Z + 2.4} on={evening} face={Math.PI} />

      {/* neighbours */}
      <Unit x={-30} z={2} w={14} d={16} h={6} color="#5b5550" lit={evening} face={Math.PI / 2} />
      <Unit x={31} z={2} w={14} d={16} h={5.4} color="#5e6670" lit={evening} face={-Math.PI / 2} />

      <Pylon lit={evening} />
      <FacadeSign lit={evening} />

      {/* the van, backed into the service bay facing out */}
      <ServiceVan position={[-7.4, 0, 12.6]} rotation={[0, 0.12, 0]} />
      <pointLight position={[-7.4, 3.6, 15.5]} intensity={10} distance={8} color="#ffe2c0" />
      <TrafficCone position={[-4.4, 0, 14.2]} />
      <TrafficCone position={[-12.4, 0, 14.2]} />

      {!mobile && day < 0.55 && (
        <Sparkles count={36} scale={[40, 3, 16]} position={[0, 1.4, 22]} size={3} speed={0.25} opacity={0.8} color="#ffd98a" />
      )}
    </group>
  );
}
