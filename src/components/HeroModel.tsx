import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";
import { media } from "../content/site";

function AutoFit({ children }: { children: React.ReactNode }) {
  const outer = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Group>(null!);

  const fit = useMemo(() => {
    // Placeholder torus knot — replaced when GLB arrives, same code path.
    return { offset: new THREE.Vector3(0, 0, 0), scale: 1 };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (outer.current) {
      outer.current.rotation.y += 0.0025;
      outer.current.position.y = Math.sin(t * 0.8) * 0.04;
    }
  });

  return (
    <group ref={outer} rotation={[0.08, -0.5, 0]}>
      <group ref={inner} position={fit.offset} scale={fit.scale}>
        {children}
      </group>
    </group>
  );
}

function GLBModel({ url }: { url: string }) {
  const { scene } = useGLTF(url, true);
  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return { offset: center.clone().multiplyScalar(-1), scale: 2.2 / maxDim };
  }, [scene]);
  return (
    <group position={fit.offset} scale={fit.scale}>
      <primitive object={scene} />
    </group>
  );
}

function Placeholder() {
  return (
    <mesh castShadow>
      <torusKnotGeometry args={[0.85, 0.28, 220, 32]} />
      <meshStandardMaterial color="#D6DADF" metalness={1} roughness={0.18} envMapIntensity={1.4} />
    </mesh>
  );
}

export function HeroModel() {
  const modelUrl = media.heroModel.src;
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.2, 4.6], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.15} />
      <directionalLight position={[3, 4, 3]} intensity={1.1} color="#f5f7ff" />
      <directionalLight position={[-2, 3, -3]} intensity={1.2} color="#FFA940" />
      <pointLight position={[0, -2.5, 0]} intensity={2.2} color="#F08A1D" distance={5} />
      <Suspense fallback={null}>
        <AutoFit>
          {modelUrl ? <GLBModel url={modelUrl} /> : <Placeholder />}
        </AutoFit>
        <Environment preset="warehouse" />
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
