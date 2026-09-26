import { forwardRef, useMemo } from "react";
import type { ThreeElements } from "@react-three/fiber";
import { ExtrudeGeometry, Group, Path, Shape } from "three";
import { DK } from "./textures";

/** Combination wrench outline: open jaw on one end, ring on the other. */
export function wrenchGeometry(length = 0.5, thickness = 0.022) {
  const R = length * 0.12;
  const top = length / 2 - R;
  const bottom = -length / 2 + R;
  const deg = Math.PI / 180;
  const s = new Shape();
  const arc = (cy: number, from: number, to: number, steps = 24) => {
    for (let i = 0; i <= steps; i += 1) {
      const a = (from + ((to - from) * i) / steps) * deg;
      s.lineTo(R * Math.cos(a), cy + R * Math.sin(a));
    }
  };
  const jw = R * Math.cos(65 * deg);
  s.moveTo(R * Math.cos(110 * deg), bottom + R * Math.sin(110 * deg));
  s.lineTo(R * Math.cos(250 * deg), top + R * Math.sin(250 * deg));
  arc(top, 250, 115);
  s.lineTo(-jw, top - R * 0.1);
  s.lineTo(jw, top - R * 0.1);
  arc(top, 65, -70);
  s.lineTo(R * Math.cos(70 * deg), bottom + R * Math.sin(70 * deg));
  arc(bottom, 70, -250, 40);
  const hole = new Path();
  hole.absarc(0, bottom, R * 0.5, 0, Math.PI * 2, false);
  s.holes.push(hole);
  const g = new ExtrudeGeometry(s, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: thickness * 0.35,
    bevelSize: thickness * 0.3,
    bevelSegments: 3,
    curveSegments: 24,
  });
  g.translate(0, 0, -thickness / 2);
  return g;
}

export function Wrench({
  length = 0.5,
  ...props
}: { length?: number } & ThreeElements["group"]) {
  const geo = useMemo(() => wrenchGeometry(length), [length]);
  return (
    <group {...props}>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color="#aab1ba" metalness={0.95} roughness={0.32} />
      </mesh>
    </group>
  );
}

/** Cordless drill in the DriveKare orange and black. */
export const Drill = forwardRef<Group, ThreeElements["group"] & { chuckRef?: React.Ref<Group> }>(
  function Drill({ chuckRef, ...props }, ref) {
    return (
      <group ref={ref} {...props}>
        {/* motor housing, pointing along +z */}
        <mesh position={[0, 0.07, 0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.058, 0.064, 0.2, 28]} />
          <meshStandardMaterial color={DK.orange} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.07, -0.085]} castShadow>
          <sphereGeometry args={[0.064, 24, 16]} />
          <meshStandardMaterial color="#1a1b1e" roughness={0.6} />
        </mesh>
        {/* grip */}
        <mesh position={[0, -0.05, -0.03]} rotation={[0.28, 0, 0]} castShadow>
          <boxGeometry args={[0.062, 0.2, 0.075]} />
          <meshStandardMaterial color="#1a1b1e" roughness={0.75} />
        </mesh>
        {/* battery */}
        <mesh position={[0, -0.17, -0.055]} castShadow>
          <boxGeometry args={[0.1, 0.07, 0.15]} />
          <meshStandardMaterial color="#1f2126" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.14, -0.055]}>
          <boxGeometry args={[0.104, 0.018, 0.154]} />
          <meshStandardMaterial color={DK.orange} roughness={0.5} />
        </mesh>
        {/* chuck and bit */}
        <group ref={chuckRef} position={[0, 0.07, 0.13]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.028, 0.04, 0.06, 18]} />
            <meshStandardMaterial color="#2a2c31" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0, 0.075]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.006, 0.007, 0.1, 10]} />
            <meshStandardMaterial color="#c9ced6" metalness={1} roughness={0.2} />
          </mesh>
          <mesh position={[0.012, 0.012, 0.01]}>
            <boxGeometry args={[0.008, 0.008, 0.05]} />
            <meshStandardMaterial color="#6b6f76" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
        {/* trigger */}
        <mesh position={[0, 0.0, 0.02]} rotation={[0.28, 0, 0]}>
          <boxGeometry args={[0.03, 0.05, 0.02]} />
          <meshStandardMaterial color={DK.orange} roughness={0.5} />
        </mesh>
      </group>
    );
  },
);

/** Screwdriver, handle in orange. */
export function Screwdriver({ length = 0.26, ...props }: { length?: number } & ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh position={[0, length * 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.016, 0.02, length * 0.4, 12]} />
        <meshStandardMaterial color={DK.orange} roughness={0.4} />
      </mesh>
      <mesh position={[0, -length * 0.2, 0]}>
        <cylinderGeometry args={[0.004, 0.005, length * 0.45, 8]} />
        <meshStandardMaterial color="#c3c8d0" metalness={1} roughness={0.25} />
      </mesh>
    </group>
  );
}

/** Deep socket. */
export function Socket(props: ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.08, 20, 1, true]} />
        <meshStandardMaterial color="#b5bcc5" metalness={1} roughness={0.25} side={2} />
      </mesh>
      <mesh position={[0, -0.039, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.035, 20]} />
        <meshStandardMaterial color="#9aa1aa" metalness={1} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Cross-shaped lug wrench. */
export function LugWrench(props: ThreeElements["group"]) {
  return (
    <group {...props}>
      {[0, Math.PI / 2].map((r) => (
        <mesh key={r} rotation={[0, r, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.013, 0.013, 0.62, 10]} />
          <meshStandardMaterial color="#8e959e" metalness={0.9} roughness={0.4} />
        </mesh>
      ))}
      {[
        [0.31, 0],
        [-0.31, 0],
        [0, 0.31],
        [0, -0.31],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.024, 0.024, 0.05, 6]} />
          <meshStandardMaterial color="#8e959e" metalness={0.9} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}
