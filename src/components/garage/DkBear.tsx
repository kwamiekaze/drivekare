import { useGLTF } from "@react-three/drei";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Box3, Group, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { BEAR_MODEL, DRACO_PATH } from "./brand";

/**
 * The DriveKare bear from the brand's own 3D model, stood on the floor and
 * given a slow breath and a little sway so he feels alive in the bay.
 */
export function DkBear({
  height = 2.1,
  reducedMotion,
  ...props
}: { height?: number; reducedMotion?: boolean } & ThreeElements["group"]) {
  const { scene } = useGLTF(BEAR_MODEL, DRACO_PATH);
  const model = useMemo(() => scene.clone(true), [scene]);
  const body = useRef<Group>(null);

  const fit = useMemo(() => {
    const box = new Box3().setFromObject(model);
    const size = box.getSize(new Vector3());
    const s = height / Math.max(size.y, 0.001);
    const center = box.getCenter(new Vector3());
    return { s, offset: new Vector3(-center.x * s, -box.min.y * s, -center.z * s) };
  }, [model, height]);

  useEffect(() => {
    model.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        const mat = m.material as MeshStandardMaterial;
        if (mat && "envMapIntensity" in mat) mat.envMapIntensity = 0.9;
      }
    });
  }, [model]);

  useFrame(({ clock }) => {
    if (reducedMotion || !body.current) return;
    const t = clock.elapsedTime;
    body.current.rotation.y = Math.sin(t * 0.4) * 0.12;
    const b = 1 + Math.sin(t * 1.6) * 0.008;
    body.current.scale.set(b, 1 + Math.sin(t * 1.6) * 0.006, b);
  });

  return (
    <group {...props}>
      <group ref={body}>
        <primitive object={model} position={fit.offset} scale={fit.s} />
      </group>
    </group>
  );
}

useGLTF.preload(BEAR_MODEL, DRACO_PATH);
