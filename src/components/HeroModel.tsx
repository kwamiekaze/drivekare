import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows, Html } from "@react-three/drei";
import * as THREE from "three";
import { media } from "../content/site";

const MODEL_URL = media.heroModel.src;

/** Outer group: slow turntable, pausable during drag. */
function Turntable({
  children,
  spinningRef,
}: {
  children: React.ReactNode;
  spinningRef: React.MutableRefObject<boolean>;
}) {
  const outer = useRef<THREE.Group>(null!);

  useFrame((_state, delta) => {
    if (!outer.current) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced && spinningRef.current) {
      outer.current.rotation.y += 0.12 * delta;
    }
  });

  // three-quarter hero angle
  return (
    <group ref={outer} rotation={[0, -0.35, 0]}>
      {children}
    </group>
  );
}

function BearMaterialPass({ scene }: { scene: THREE.Object3D }) {
  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if ((mesh as any).isMesh) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) {
          const mat = m as THREE.MeshStandardMaterial;
          if (mat && (mat as any).isMeshStandardMaterial) {
            mat.envMapIntensity = 1.0;
            mat.needsUpdate = true;
          }
        }
        mesh.castShadow = true;
        mesh.receiveShadow = false;
      }
    });
  }, [scene]);
  return null;
}

function GroundedBear({
  url,
  spinningRef,
  bearRef,
}: {
  url: string;
  spinningRef: React.MutableRefObject<boolean>;
  bearRef: React.MutableRefObject<THREE.Group | null>;
}) {
  const { scene } = useGLTF(url, true);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  const rawMetrics = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const sz = new THREE.Vector3();
    const ctr = new THREE.Vector3();
    box.getSize(sz);
    box.getCenter(ctr);
    return { sz, ctr, minY: box.min.y };
  }, [scene]);

  const { offset, scale } = useMemo(() => {
    const { sz, ctr, minY } = rawMetrics;
    const maxDim = Math.max(sz.x, sz.y, sz.z) || 1;
    const baseScale = 2.2 / maxDim;

    const aimY = 0.85;
    const aim = new THREE.Vector3(0, aimY, 0);
    const camDist = camera.position.distanceTo(aim) || 3.8;
    const fovRad = (camera.fov * Math.PI) / 180;
    const aspect = size.width && size.height ? size.width / size.height : 1;
    const viewH = 2 * Math.tan(fovRad / 2) * camDist;
    const viewW = viewH * aspect;
    const padding = 0.88;
    const fitByH = ((viewH * padding) / 2 + aimY) / sz.y;
    const fitByW = (viewW * padding) / sz.x;
    const s = Math.min(baseScale, fitByH, fitByW);

    const off = new THREE.Vector3(-ctr.x, -minY, -ctr.z);
    return { offset: off, scale: s };
  }, [rawMetrics, camera, size.width, size.height]);

  return (
    <Turntable spinningRef={spinningRef}>
      <group ref={bearRef as any} position={offset} scale={scale}>
        <BearMaterialPass scene={scene} />
        <primitive object={scene} />
      </group>
    </Turntable>
  );
}

/** Minimal orange ring loader shown while the GLB streams in. */
function RingLoader() {
  return (
    <Html center>
      <div
        aria-label="Loading"
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "2px solid rgba(240,138,29,0.25)",
          borderTopColor: "#FFA940",
          animation: "dk-spin 0.9s linear infinite",
        }}
      />
      <style>{`@keyframes dk-spin{to{transform:rotate(360deg)}}`}</style>
    </Html>
  );
}

function ModelContent({
  spinningRef,
  bearRef,
}: {
  spinningRef: React.MutableRefObject<boolean>;
  bearRef: React.MutableRefObject<THREE.Group | null>;
}) {
  const url = MODEL_URL;
  if (!url) return null;
  return <GroundedBear url={url} spinningRef={spinningRef} bearRef={bearRef} />;
}

/**
 * Gates OrbitControls by raycasting the pointerdown against the bear meshes.
 * If the ray misses, controls stay disabled so the page can scroll normally.
 */
function BearHitGate({
  bearRef,
  controlsRef,
}: {
  bearRef: React.MutableRefObject<THREE.Group | null>;
  controlsRef: React.MutableRefObject<any>;
}) {
  const { gl, camera } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hitTest = (clientX: number, clientY: number) => {
      const bear = bearRef.current;
      if (!bear) return false;
      const rect = el.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      return raycaster.intersectObject(bear, true).length > 0;
    };
    const onDown = (e: PointerEvent) => {
      const c = controlsRef.current;
      if (!c) return;
      c.enabled = hitTest(e.clientX, e.clientY);
    };
    const onRelease = () => {
      const c = controlsRef.current;
      if (c) c.enabled = false;
    };
    el.addEventListener("pointerdown", onDown, true);
    window.addEventListener("pointerup", onRelease);
    window.addEventListener("pointercancel", onRelease);
    return () => {
      el.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointerup", onRelease);
      window.removeEventListener("pointercancel", onRelease);
    };
  }, [gl, camera, bearRef, controlsRef]);
  return null;
}


function HeroCanvas() {
  const spinningRef = useRef(true);
  const resumeTimer = useRef<number | null>(null);
  const bearRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<any>(null);

  const pauseSpin = () => {
    spinningRef.current = false;
    if (resumeTimer.current) {
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
  };
  const scheduleResume = () => {
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => {
      spinningRef.current = true;
    }, 1500);
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
      camera={{ position: [0, 1.5, 3.8], fov: 32 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent", touchAction: "pan-y" }}
      onCreated={({ gl }) => {
        gl.domElement.style.touchAction = "pan-y";
        setTimeout(() => {
          gl.domElement.style.touchAction = "pan-y";
        }, 0);
      }}
      onPointerDown={pauseSpin}
      onPointerUp={scheduleResume}
      onPointerLeave={scheduleResume}
    >
      <CameraAim target={[0, 0.85, 0]} />
      <ambientLight intensity={0.22} />
      <spotLight
        position={[0, 5.5, 2.2]}
        target-position={[0, 0.8, 0]}
        angle={0.5}
        penumbra={0.9}
        decay={2}
        intensity={65}
        distance={14}
        color="#FFB566"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-2, 2.4, -3]} intensity={0.75} color="#FFA940" />
      <directionalLight position={[2.5, 2, -2.5]} intensity={0.35} color="#FFC98A" />

      <Suspense fallback={<RingLoader />}>
        <ModelContent spinningRef={spinningRef} bearRef={bearRef} />
        <Environment preset="city" environmentIntensity={0.4} />
        <ContactShadows
          position={[0, 0.001, 0]}
          opacity={0.55}
          scale={10}
          blur={2.6}
          far={3.5}
          color="#000000"
        />
      </Suspense>

      <BearHitGate bearRef={bearRef} controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={false}
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        minPolarAngle={1.2}
        maxPolarAngle={1.65}
        target={[0, 0.85, 0]}
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

/**
 * HeroModel: defers Canvas mount via IntersectionObserver so first paint isn't
 * blocked by the R3F bundle + GLB decode.
 */
export function HeroModel() {
  const holderRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Mount right after hydration; IO ensures we don't mount if the hero
    // is somehow out of view on load.
    const el = holderRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    // Kick immediately if already in viewport
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVisible(true);
      io.disconnect();
    }
    return () => io.disconnect();
  }, []);

  return (
    <div ref={holderRef} style={{ width: "100%", height: "100%" }}>
      {visible ? <HeroCanvas /> : null}
    </div>
  );
}

if (MODEL_URL) {
  useGLTF.preload(MODEL_URL, true);
}
