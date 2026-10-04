import { Environment, Lightformer } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import {
  CanvasTexture, Color, DirectionalLight, Fog, Group, HemisphereLight, InstancedMesh, MathUtils, MeshBasicMaterial, MeshStandardMaterial,
  Object3D, RepeatWrapping, ShaderMaterial, BackSide, SRGBColorSpace, BufferGeometry, Float32BufferAttribute, PointsMaterial,
} from "three";
import { CUSTOMERS } from "@/content/lot";
import { Ground, mats } from "./Ground";
import { Job } from "./Job";
import { LANES, LOT, parkedCars, rng, ROAD, type Body, type Parked } from "./layout";
import { lotStore, sim, stepOf } from "./store";
import { themeAt } from "./theme";
import { carMaterials, glassMat, instancedPaint, mergedCar, ParkedCar, sharedLights } from "./Vehicles";

/* ---------------------------------------------------------------- building */

function windowTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, 512, 256);
  const r = rng(5);
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 24; col += 1) {
      const lit = r() > 0.28;
      g.fillStyle = lit ? `rgb(255,${190 + Math.floor(r() * 50)},${110 + Math.floor(r() * 60)})` : "#0b0d12";
      g.fillRect(col * 21.3 + 3, row * 85 + 8, 16, 66);
    }
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const glassMats = {
  facade: new MeshStandardMaterial({ color: "#2b3d4c", metalness: 0.85, roughness: 0.12, emissive: "#ffb870", emissiveIntensity: 0 }),
  wall: new MeshStandardMaterial({ color: "#b9b5ab", roughness: 0.8 }),
  roof: new MeshStandardMaterial({ color: "#a9a69e", roughness: 0.95 }),
  unit: new MeshStandardMaterial({ color: "#9aa1a8", metalness: 0.6, roughness: 0.5 }),
  solar: new MeshStandardMaterial({ color: "#16264a", metalness: 0.8, roughness: 0.25 }),
  sign: new MeshBasicMaterial({ color: new Color(2.2, 1.05, 0.3), toneMapped: false }),
};

function Building() {
  const tex = useMemo(windowTexture, []);
  glassMats.facade.emissiveMap = tex;
  glassMats.facade.needsUpdate = true;
  const units = useMemo(() => {
    const r = rng(19);
    return Array.from({ length: 11 }, () => [(r() - 0.5) * 16, (r() - 0.5) * 36, 1 + r() * 2.2, 0.8 + r() * 1.2, 0.8 + r() * 1.6] as const);
  }, []);
  const X = -45; // centre
  return (
    <group position={[X, 0, -4]}>
      <mesh position={[0, 6.5, 0]} castShadow receiveShadow material={glassMats.wall}>
        <boxGeometry args={[22, 13, 54]} />
      </mesh>
      <mesh position={[0, 13.1, 0]} receiveShadow material={glassMats.roof}>
        <boxGeometry args={[22.4, 0.3, 54.4]} />
      </mesh>
      {/* glass curtain wall facing the lot */}
      <mesh position={[11.06, 6.4, -2]} material={glassMats.facade}>
        <boxGeometry args={[0.2, 11, 36]} />
      </mesh>
      {units.map(([x, z, h, w, d], i) => (
        <mesh key={i} position={[x - 2, 13.3 + h / 2, z + 1]} castShadow material={glassMats.unit}>
          <boxGeometry args={[w, h, d]} />
        </mesh>
      ))}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} position={[-4 + (i % 3) * 3.4, 13.4, 19 + Math.floor(i / 3) * 2.6]} rotation={[0.2, 0, 0]} material={glassMats.solar}>
          <boxGeometry args={[3.2, 0.1, 2.3]} />
        </mesh>
      ))}
      {/* glowing wordmark band over the door */}
      <mesh position={[11.2, 10.8, -2]} material={glassMats.sign}>
        <boxGeometry args={[0.08, 0.5, 9]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ traffic */

const trafficMats = {
  head: new MeshStandardMaterial({ color: "#f4f7ff", emissive: "#dbe8ff", emissiveIntensity: 0.1, toneMapped: false }),
  tail: new MeshStandardMaterial({ color: "#5a0b0b", emissive: "#ff2a1a", emissiveIntensity: 0.3, toneMapped: false }),
};

function Traffic() {
  const cars = useMemo(() => {
    const r = rng(23);
    const colors = ["#f2f3f5", "#18191c", "#8b9099", "#1f3a63", "#a62b2b", "#e4e6ea"];
    return Array.from({ length: 9 }, (_, i) => {
      const lane = i % 4;
      return {
        lane,
        x: LANES[lane]! + (r() - 0.5) * 0.5,
        dir: lane < 2 ? 1 : -1,
        z: -70 + r() * 140,
        speed: 5.5 + r() * 4,
        body: (["sedan", "suv", "hatch", "sedan"] as const)[i % 4]!,
        color: colors[i % colors.length]!,
      };
    });
  }, []);
  const refs = useRef<Array<Group | null>>([]);
  useFrame((_, dt) => {
    cars.forEach((c, i) => {
      c.z += c.dir * c.speed * stepOf(dt);
      if (c.z > 80) c.z = -80;
      if (c.z < -80) c.z = 80;
      const g = refs.current[i];
      if (g) g.position.set(c.x, 0, c.z);
    });
  });
  return (
    <>
      {cars.map((c, i) => (
        <group key={i} ref={(g) => { refs.current[i] = g; }}>
          <ParkedCar body={c.body} color={c.color} lights={trafficMats} rotation={[0, c.dir === 1 ? -Math.PI / 2 : Math.PI / 2, 0]} />
        </group>
      ))}
    </>
  );
}

/* ---------------------------------------------------------------------- sky */

const skyMat = new ShaderMaterial({
  side: BackSide,
  depthWrite: false,
  fog: false,
  uniforms: { top: { value: new Color("#8fc3ee") }, low: { value: new Color("#dfeaf3") } },
  vertexShader: `varying vec3 vP;
void main() {
  vP = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
  fragmentShader: `uniform vec3 top;
uniform vec3 low;
varying vec3 vP;
void main() {
  float h = clamp(normalize(vP).y * 1.4, 0.0, 1.0);
  gl_FragColor = vec4(mix(low, top, pow(h, 0.7)), 1.0);
  #include <colorspace_fragment>
}`,
});

const starMat = new PointsMaterial({ color: "#ffffff", size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false });
function stars() {
  const r = rng(77);
  const p: number[] = [];
  for (let i = 0; i < 500; i += 1) {
    const u = r(), v = 0.08 + r() * 0.92;
    const a = u * Math.PI * 2, e = Math.acos(1 - v);
    p.push(Math.cos(a) * Math.sin(e) * 280, Math.cos(e) * 280, Math.sin(a) * Math.sin(e) * 280);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(p, 3));
  return g;
}

/* ----------------------------------------------------------- parked traffic */

const BODY_TYPES = ["sedan", "hatch", "suv", "pickup"] as const;

/** All the parked cars of one body style, drawn as instanced meshes with a colour per car. */
function ParkedStyle({ body, cars }: { body: Body; cars: Parked[] }) {
  const parts = useMemo(() => mergedCar(body), [body]);
  const refs = useRef<Array<InstancedMesh | null>>([]);
  useLayoutEffect(() => {
    const o = new Object3D();
    const col = new Color();
    refs.current.forEach((m) => {
      if (!m) return;
      cars.forEach((c, i) => {
        o.position.set(c.x, 0, c.z);
        o.rotation.set(0, c.yaw, 0);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
        if (m.userData.paint) m.setColorAt(i, col.set(c.color));
      });
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere();
    });
  }, [cars]);
  if (!cars.length) return null;
  const set = (i: number) => (m: InstancedMesh | null) => {
    refs.current[i] = m;
  };
  const n = cars.length;
  return (
    <>
      <instancedMesh ref={set(0)} userData={{ paint: true }} args={[parts.paint, instancedPaint, n]} castShadow receiveShadow />
      <instancedMesh ref={set(1)} args={[parts.glass, glassMat, n]} castShadow />
      <instancedMesh ref={set(2)} args={[parts.tires, carMaterials.tire, n]} castShadow />
      <instancedMesh ref={set(3)} args={[parts.hubs, carMaterials.hub, n]} />
      <instancedMesh ref={set(4)} args={[parts.heads, sharedLights.head, n]} />
      <instancedMesh ref={set(5)} args={[parts.tails, sharedLights.tail, n]} />
      {parts.bed && <instancedMesh ref={set(6)} args={[parts.bed, carMaterials.bed, n]} />}
    </>
  );
}

function Parked() {
  const cars = useMemo(parkedCars, []);
  return (
    <>
      {BODY_TYPES.map((b) => (
        <ParkedStyle key={b} body={b} cars={cars.filter((c) => c.body === b)} />
      ))}
    </>
  );
}

/* ------------------------------------------------------------- theme driver */

const bloomRef: { current: { intensity: number } | null } = { current: null };

function ThemeDriver() {
  const { scene, gl } = useThree();
  const sun = useRef<DirectionalLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const fog = useMemo(() => new Fog("#dfeaf3", 110, 300), []);
  scene.fog = fog;
  const starGeo = useMemo(stars, []);
  const dome = useRef<Object3D>(null);
  useFrame((state, dt) => {
    const s = lotStore;
    s.day = MathUtils.damp(s.day, s.dayTarget, 2.2, stepOf(dt));
    const t = themeAt(s.day);
    fog.color.copy(t.skyLow);
    skyMat.uniforms.top!.value.copy(t.sky);
    skyMat.uniforms.low!.value.copy(t.skyLow);
    starMat.opacity = MathUtils.clamp((1 - s.day) * 1.4 - 0.2, 0, 1);
    if (sun.current) {
      sun.current.color.copy(t.sun);
      sun.current.intensity = t.sunIntensity;
      sun.current.position.set(...t.sunPos);
    }
    if (hemi.current) {
      hemi.current.color.copy(t.hemi);
      hemi.current.groundColor.copy(t.hemiGround);
      hemi.current.intensity = t.hemiIntensity;
    }
    scene.environmentIntensity = t.envIntensity;
    gl.toneMappingExposure = t.exposure;
    mats.asphalt.color.copy(t.asphalt);
    mats.lot.color.copy(t.asphalt);
    mats.asphalt.roughness = mats.lot.roughness = t.roughness;
    mats.road.color.copy(t.asphalt).multiplyScalar(0.94);
    mats.line.color.copy(t.line);
    mats.grass.color.copy(t.grass);
    mats.cover.color.copy(t.grass).multiplyScalar(0.8);
    mats.concrete.color.copy(t.concrete);
    mats.lampHead.color.setScalar(0.25 + t.lamps * 3.2);
    mats.pool.opacity = t.lamps * 0.7;
    glassMats.facade.emissiveIntensity = t.glassGlow * 1.3;
    sharedLights.tail.emissiveIntensity = 0.25 + t.lamps * 0.5;
    sharedLights.head.emissiveIntensity = 0.1;
    trafficMats.head.emissiveIntensity = 0.3 + t.lamps * 5;
    trafficMats.tail.emissiveIntensity = 0.5 + t.lamps * 2;
    if (bloomRef.current) bloomRef.current.intensity = t.bloom;
    if (dome.current) dome.current.position.copy(state.camera.position);
  });
  return (
    <>
      <hemisphereLight ref={hemi} />
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={44}
        shadow-camera-bottom={-44}
        shadow-camera-near={5}
        shadow-camera-far={220}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
      />
      <group ref={dome}>
        <mesh material={skyMat} renderOrder={-10}>
          <sphereGeometry args={[290, 24, 16]} />
        </mesh>
        <points geometry={starGeo} material={starMat} />
      </group>
    </>
  );
}

/* -------------------------------------------------------------------- scene */

export function LotScene({ reducedMotion, mobile }: { reducedMotion: boolean; mobile: boolean }) {
  return (
    <>
      <ThemeDriver />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} color="#ffffff" position={[0, 12, 0]} rotation-x={Math.PI / 2} scale={[40, 40, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#cfe3ff" position={[-14, 6, 0]} rotation-y={Math.PI / 2} scale={[30, 8, 1]} />
        <Lightformer form="rect" intensity={1.0} color="#fff0dc" position={[14, 6, 0]} rotation-y={-Math.PI / 2} scale={[30, 8, 1]} />
      </Environment>
      <Suspense fallback={null}>
        <Ground mobile={mobile} />
        <Building />
        <Parked />
        <Traffic />
        {CUSTOMERS.map((c) => (
          <Job key={c.id} customer={c} reducedMotion={reducedMotion} />
        ))}
      </Suspense>
      {!sim.lite && (
        <EffectComposer multisampling={mobile ? 0 : 4}>
          <Bloom ref={bloomRef as never} mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.3} />
          <Vignette eskil={false} offset={0.28} darkness={0.5} />
        </EffectComposer>
      )}
    </>
  );
}

void LOT;
void ROAD;
void RepeatWrapping;
void InstancedMesh;
