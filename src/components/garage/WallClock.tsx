import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

/** Analog wall clock driven by the visitor's real local time. */
export function WallClock(props: { position: [number, number, number] }) {
  const hour = useRef<Group>(null);
  const minute = useRef<Group>(null);
  const second = useRef<Group>(null);

  useFrame(() => {
    const now = new Date();
    const s = now.getSeconds() + now.getMilliseconds() / 1000;
    const m = now.getMinutes() + s / 60;
    const h = (now.getHours() % 12) + m / 60;
    if (hour.current) hour.current.rotation.z = -(h / 12) * Math.PI * 2;
    if (minute.current) minute.current.rotation.z = -(m / 60) * Math.PI * 2;
    if (second.current) second.current.rotation.z = -(s / 60) * Math.PI * 2;
  });

  return (
    <group {...props}>
      {/* case */}
      <mesh rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.08, 40]} />
        <meshStandardMaterial color="#1c2645" roughness={0.52} metalness={0.12} />
      </mesh>
      {/* face */}
      <mesh position={[0, 0, 0.05]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.37, 0.37, 0.02, 40]} />
        <meshStandardMaterial color="#f6efe4" roughness={0.78} />
      </mesh>
      {/* hour ticks */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.sin((i / 12) * Math.PI * 2) * 0.3,
            Math.cos((i / 12) * Math.PI * 2) * 0.3,
            0.07,
          ]}
          rotation-z={-(i / 12) * Math.PI * 2}
        >
          <boxGeometry args={[0.022, i % 3 === 0 ? 0.075 : 0.045, 0.012]} />
          <meshStandardMaterial color="#2c3330" />
        </mesh>
      ))}
      <group ref={hour} position={[0, 0, 0.08]}>
        <mesh position={[0, 0.085, 0]}>
          <boxGeometry args={[0.036, 0.17, 0.012]} />
          <meshStandardMaterial color="#232b28" />
        </mesh>
      </group>
      <group ref={minute} position={[0, 0, 0.095]}>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.024, 0.24, 0.012]} />
          <meshStandardMaterial color="#232b28" />
        </mesh>
      </group>
      <group ref={second} position={[0, 0, 0.11]}>
        <mesh position={[0, 0.13, 0]}>
          <boxGeometry args={[0.009, 0.26, 0.008]} />
          <meshStandardMaterial color="#ff8a2a" emissive="#a8440c" />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.12]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.03, 0.03, 0.03, 16]} />
        <meshStandardMaterial color="#1d2622" />
      </mesh>
    </group>
  );
}
