import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";
import { media } from "../content/site";

const MODEL_URL = media.heroModel.src;

function AutoFit({ children, offset, scale }: { children: React.ReactNode; offset: THREE.Vector3; scale: number }) {
  const outer = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    if (!outer.current) return;
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) {
      outer.current.rotation.y += 0.15 * delta; // ~0.15 rad/s
      const t = state.clock.getElapsedTime();
      outer.current.position.y = Math.sin(t * 0.8) * 0.04; // ±2% bob
    }
  });

  return (
    <group ref={outer} rotation={[0.08, -0.5, 0]}>
      <group ref={inner} position={offset} scale={scale}>
        {children}
      </group>
    </group>
  );
}

function Emblem({ url }: { url: string }) {
  const { scene } = useGLTF(url, true);

  const { offset, scale } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return { offset: center.clone().multiplyScalar(-1), scale: 2.2 / maxDim };
  }, [scene]);

  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if ((mesh as any).isMesh && mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) {
          const mat = m as THREE.MeshStandardMaterial;
          if ((mat as any).isMeshStandardMaterial) {
            mat.envMapIntensity = 1.2;
            // Premium metal read — only lift response; do NOT recolor textures.
            if (mat.metalness < 0.5) mat.metalness = Math.max(mat.metalness, 0.85);
            if (mat.roughness > 0.6) mat.roughness = Math.min(mat.roughness, 0.35);
            mat.needsUpdate = true;
          }
        }
      }
    });
  }, [scene]);

  return <primitive object={scene} />;
}

function PlaceholderKnot() {
  return (
    <mesh castShadow>
      <torusKnotGeometry args={[0.85, 0.28, 220, 32]} />
      <meshStandardMaterial color="#D6DADF" metalness={1} roughness={0.18} envMapIntensity={1.2} />
    </mesh>
  );
}

function ModelContent() {
  const url = MODEL_URL;
  if (!url) {
    // Preserve auto-fit path shape even without a URL.
    return (
      <AutoFit offset={new THREE.Vector3(0, 0, 0)} scale={1}>
        <PlaceholderKnot />
      </AutoFit>
    );
  }
  return <ModelWithFit url={url} />;
}

function ModelWithFit({ url }: { url: string }) {
  const { scene } = useGLTF(url, true);
  const { offset, scale } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return { offset: center.clone().multiplyScalar(-1), scale: 2.2 / maxDim };
  }, [scene]);
  return (
    <AutoFit offset={offset} scale={scale}>
      <Emblem url={url} />
    </AutoFit>
  );
}

export function HeroModel() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.2, 4.6], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.18} />
      <directionalLight position={[3, 4, 3]} intensity={1.1} color="#f5f7ff" />
      <directionalLight position={[-2, 3, -3]} intensity={1.2} color="#FFA940" />
      <pointLight position={[0, -2.5, 0]} intensity={2.2} color="#F08A1D" distance={5} />
      <Suspense fallback={null}>
        <ModelContent />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        makeDefault
      />
    </Canvas>
  );
}

if (MODEL_URL) {
  useGLTF.preload(MODEL_URL, true);
}
