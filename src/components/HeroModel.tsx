import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { media } from "../content/site";

const MODEL_URL = media.heroModel.src;

/**
 * Grounded turntable: bear stands planted at y=0, spins slowly, subtle breathing.
 * Auto-rotation pauses on pointer down, resumes ~2s after release.
 */
function Turntable({
  children,
  offset,
  scale,
  spinningRef,
}: {
  children: React.ReactNode;
  offset: THREE.Vector3;
  scale: number;
  spinningRef: React.MutableRefObject<boolean>;
}) {
  const outer = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    if (!outer.current || !inner.current) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced && spinningRef.current) {
      outer.current.rotation.y += 0.12 * delta;
    }
    if (!reduced) {
      const t = state.clock.getElapsedTime();
      // breathing: ±0.5% on Y only
      inner.current.scale.y = scale * (1 + Math.sin(t * 1.1) * 0.005);
    }
  });

  return (
    <group ref={outer}>
      <group ref={inner} position={offset} scale={scale}>
        {children}
      </group>
    </group>
  );
}

function BearMaterialPass({ scene }: { scene: THREE.Object3D }) {
  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if ((mesh as any).isMesh && mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) {
          const mat = m as THREE.MeshStandardMaterial;
          if ((mat as any).isMeshStandardMaterial) {
            mat.envMapIntensity = 1.0;
            mat.needsUpdate = true;
          }
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [scene]);
  return null;
}

function GroundedBear({
  url,
  spinningRef,
}: {
  url: string;
  spinningRef: React.MutableRefObject<boolean>;
}) {
  const { scene } = useGLTF(url, true);

  const { offset, scale } = useMemo(() => {
    // Clone to avoid mutating cached scene across HMR
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s = 2.4 / maxDim;
    // Recenter X/Z, then push up so feet (minY) land on y=0 after scaling.
    const off = new THREE.Vector3(-center.x, -box.min.y, -center.z);
    return { offset: off, scale: s };
  }, [scene]);

  return (
    <Turntable offset={offset} scale={scale} spinningRef={spinningRef}>
      <BearMaterialPass scene={scene} />
      <primitive object={scene} />
    </Turntable>
  );
}

function PlaceholderBear({ spinningRef }: { spinningRef: React.MutableRefObject<boolean> }) {
  return (
    <Turntable offset={new THREE.Vector3(0, 0, 0)} scale={1} spinningRef={spinningRef}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial color="#8a6b4a" roughness={0.75} metalness={0.05} />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial color="#8a6b4a" roughness={0.75} metalness={0.05} />
      </mesh>
    </Turntable>
  );
}

function ModelContent({ spinningRef }: { spinningRef: React.MutableRefObject<boolean> }) {
  const url = MODEL_URL;
  if (!url) return <PlaceholderBear spinningRef={spinningRef} />;
  return <GroundedBear url={url} spinningRef={spinningRef} />;
}

export function HeroModel() {
  const spinningRef = useRef(true);
  const resumeTimer = useRef<number | null>(null);
  const [cursor, setCursor] = useState<"grab" | "grabbing">("grab");

  const onPointerDown = () => {
    spinningRef.current = false;
    setCursor("grabbing");
    if (resumeTimer.current) {
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
  };
  const onPointerUp = () => {
    setCursor("grab");
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => {
      spinningRef.current = true;
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    };
  }, []);

  return (
    <Canvas
      dpr={[1, 2]}
      shadows
      camera={{ position: [0, 1.35, 3.6], fov: 34 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent", cursor }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* Camera looks gently down at the standing figure */}
      <CameraAim target={[0, 0.9, 0]} />

      {/* Low ambient so the spotlight reads */}
      <ambientLight intensity={0.22} />

      {/* Overhead warm-white key spotlight — mirrors the video's ground pool */}
      <spotLight
        position={[0, 5.5, 1.2]}
        angle={0.5}
        penumbra={0.9}
        intensity={22}
        distance={12}
        color="#fff2df"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Ignition-orange rim from behind */}
      <directionalLight position={[-2, 2.2, -3]} intensity={0.9} color="#FFA940" />

      <Suspense fallback={null}>
        <ModelContent spinningRef={spinningRef} />
        <Environment preset="city" environmentIntensity={0.35} />
        {/* Grounding shadow — sells the composite against the video spotlight */}
        <ContactShadows
          position={[0, 0.001, 0]}
          opacity={0.55}
          scale={6}
          blur={2.4}
          far={3}
          color="#000000"
        />
      </Suspense>

      <OrbitControls
        makeDefault
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        minPolarAngle={(72 * Math.PI) / 180}
        maxPolarAngle={(90 * Math.PI) / 180}
        target={[0, 0.9, 0]}
      />
    </Canvas>
  );
}

function CameraAim({ target }: { target: [number, number, number] }) {
  useFrame(({ camera }) => {
    camera.lookAt(target[0], target[1], target[2]);
  });
  return null;
}

if (MODEL_URL) {
  useGLTF.preload(MODEL_URL, true);
}
