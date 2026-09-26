import type { ThreeElements } from "@react-three/fiber";
import { useMemo } from "react";
import { ExtrudeGeometry, LatheGeometry, Shape, Vector2 } from "three";
import { DK, hazardTexture } from "./textures";

const WHEEL_R = 0.36;
const WHEEL_X = [-1.42, 1.44];
const TRACK = 0.86;

/** Side profile of a low fastback coupe, wheel arches cut into the outline. */
function bodyShape() {
  const s = new Shape();
  const archR = WHEEL_R + 0.07;
  s.moveTo(-2.28, 0.34);
  s.lineTo(WHEEL_X[0]! - archR, 0.3);
  s.absarc(WHEEL_X[0]!, 0.36, archR, Math.PI, 0, true);
  s.lineTo(WHEEL_X[1]! - archR, 0.3);
  s.absarc(WHEEL_X[1]!, 0.36, archR, Math.PI, 0, true);
  s.lineTo(2.2, 0.3);
  s.quadraticCurveTo(2.36, 0.36, 2.34, 0.56);
  s.quadraticCurveTo(2.3, 0.7, 2.05, 0.76);
  s.lineTo(0.72, 0.9);
  s.lineTo(-0.72, 0.92);
  s.quadraticCurveTo(-1.8, 0.9, -2.2, 0.86);
  s.quadraticCurveTo(-2.34, 0.8, -2.34, 0.6);
  s.lineTo(-2.28, 0.34);
  return s;
}

/** Glasshouse: windshield, roof and fastback in one smoked piece. */
function cabinShape() {
  const s = new Shape();
  s.moveTo(0.78, 0.86);
  s.quadraticCurveTo(0.3, 1.14, -0.1, 1.27);
  s.quadraticCurveTo(-0.55, 1.33, -0.9, 1.24);
  s.quadraticCurveTo(-1.45, 1.06, -1.95, 0.86);
  s.lineTo(0.78, 0.86);
  return s;
}

function tireGeometry(r: number, w: number) {
  const pts: Vector2[] = [];
  const inner = r * 0.66;
  const steps = 10;
  pts.push(new Vector2(inner, -w / 2));
  for (let i = 0; i <= steps; i += 1) {
    const a = -Math.PI / 2 + (Math.PI * i) / steps;
    const bulge = r - 0.05 + Math.cos(a) * 0.05;
    pts.push(new Vector2(bulge, (Math.sin(a) * w) / 2));
  }
  pts.push(new Vector2(inner, w / 2));
  const g = new LatheGeometry(pts, 48);
  g.rotateZ(Math.PI / 2);
  return g;
}

export function Wheel({
  radius = WHEEL_R,
  width = 0.26,
  rimColor = "#1b1d22",
  caliper = true,
  ...props
}: { radius?: number; width?: number; rimColor?: string; caliper?: boolean } & ThreeElements["group"]) {
  const tire = useMemo(() => tireGeometry(radius, width), [radius, width]);
  return (
    <group {...props}>
      <mesh geometry={tire} castShadow>
        <meshStandardMaterial color={DK.rubber} roughness={0.88} />
      </mesh>
      {/* rim barrel and face */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius * 0.66, radius * 0.66, width * 0.9, 36, 1, true]} />
        <meshStandardMaterial color="#2a2d33" metalness={0.8} roughness={0.35} side={2} />
      </mesh>
      {[1, -1].map((side) => (
        <group key={side} position={[(side * width) / 2.3, 0, 0]} rotation={[0, (side * Math.PI) / 2, 0]}>
          {Array.from({ length: 10 }).map((_, i) => (
            <mesh key={i} rotation={[0, 0, (i * Math.PI) / 5]} position={[0, 0, 0]}>
              <boxGeometry args={[0.028, radius * 1.26, 0.03]} />
              <meshStandardMaterial color={rimColor} metalness={0.9} roughness={0.25} />
            </mesh>
          ))}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[radius * 0.16, radius * 0.16, 0.05, 20]} />
            <meshStandardMaterial color="#111" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh>
            <torusGeometry args={[radius * 0.64, 0.016, 8, 48]} />
            <meshStandardMaterial color="#c6ccd4" metalness={1} roughness={0.2} />
          </mesh>
        </group>
      ))}
      {caliper && (
        <mesh position={[width * 0.1, radius * 0.28, radius * 0.18]}>
          <boxGeometry args={[0.07, 0.2, 0.12]} />
          <meshStandardMaterial color={DK.orange} roughness={0.4} />
        </mesh>
      )}
    </group>
  );
}

export function Car(props: ThreeElements["group"]) {
  const body = useMemo(() => {
    const g = new ExtrudeGeometry(bodyShape(), {
      depth: 1.62,
      bevelEnabled: true,
      bevelThickness: 0.16,
      bevelSize: 0.08,
      bevelSegments: 6,
      curveSegments: 32,
    });
    g.translate(0, 0, -0.81);
    return g;
  }, []);
  const cabin = useMemo(() => {
    const g = new ExtrudeGeometry(cabinShape(), {
      depth: 1.12,
      bevelEnabled: true,
      bevelThickness: 0.18,
      bevelSize: 0.06,
      bevelSegments: 6,
      curveSegments: 24,
    });
    g.translate(0, 0, -0.56);
    return g;
  }, []);

  return (
    <group {...props}>
      <mesh geometry={body} castShadow receiveShadow>
        <meshPhysicalMaterial color="#12151c" metalness={0.6} roughness={0.28} clearcoat={1} clearcoatRoughness={0.06} />
      </mesh>
      <mesh geometry={cabin} castShadow>
        <meshPhysicalMaterial color="#05070b" metalness={0.2} roughness={0.05} clearcoat={1} clearcoatRoughness={0.02} />
      </mesh>
      {/* orange stripe along the sill and the DK side accent */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, 0.4, s * 0.975]}>
          <boxGeometry args={[2.1, 0.035, 0.01]} />
          <meshStandardMaterial color={DK.orange} emissive={DK.orange} emissiveIntensity={0.35} />
        </mesh>
      ))}
      {/* light bars */}
      <mesh position={[2.3, 0.62, 0]}>
        <boxGeometry args={[0.05, 0.035, 1.5]} />
        <meshStandardMaterial color="#ffffff" emissive="#dfe9ff" emissiveIntensity={4} toneMapped={false} />
      </mesh>
      <mesh position={[-2.33, 0.7, 0]}>
        <boxGeometry args={[0.04, 0.04, 1.62]} />
        <meshStandardMaterial color="#ff3b1f" emissive="#ff2a10" emissiveIntensity={4} toneMapped={false} />
      </mesh>
      {/* underbody */}
      <mesh position={[0, 0.26, 0]}>
        <boxGeometry args={[4.3, 0.05, 1.7]} />
        <meshStandardMaterial color="#0a0b0e" roughness={0.9} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`ex${s}`} position={[-2.3, 0.3, s * 0.45]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.12, 16]} />
          <meshStandardMaterial color="#9aa0a8" metalness={1} roughness={0.2} />
        </mesh>
      ))}
      {WHEEL_X.map((x) =>
        [-1, 1].map((s) => (
          <Wheel key={`${x}${s}`} position={[x, WHEEL_R, s * TRACK]} rotation={[0, Math.PI / 2, 0]} />
        )),
      )}
    </group>
  );
}

/**
 * Two-post lift with the car raised on it. The car runs along x, the posts sit
 * either side of it at the wheelbase centre.
 */
export function LiftWithCar({ height = 1.35, ...props }: { height?: number } & ThreeElements["group"]) {
  const hazard = useMemo(() => hazardTexture(), []);
  return (
    <group {...props}>
      {[-1, 1].map((s) => (
        <group key={s} position={[0, 0, s * 1.55]}>
          <mesh position={[0, 1.9, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.32, 3.8, 0.34]} />
            <meshStandardMaterial color={DK.navy} metalness={0.5} roughness={0.45} />
          </mesh>
          <mesh position={[0, 1.9, -s * 0.18]}>
            <boxGeometry args={[0.1, 3.5, 0.02]} />
            <meshStandardMaterial color={DK.orange} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.03, 0]} receiveShadow>
            <boxGeometry args={[0.7, 0.06, 0.7]} />
            <meshStandardMaterial map={hazard} roughness={0.6} />
          </mesh>
          {/* carriage and swing arms */}
          <mesh position={[0, height - 0.08, -s * 0.2]} castShadow>
            <boxGeometry args={[0.42, 0.32, 0.18]} />
            <meshStandardMaterial color="#2b3350" metalness={0.5} roughness={0.4} />
          </mesh>
          {[-1, 1].map((a) => (
            <mesh key={a} position={[a * 0.55, height - 0.16, -s * 0.55]} rotation={[0, a * s * 0.55, 0]} castShadow>
              <boxGeometry args={[1.2, 0.08, 0.14]} />
              <meshStandardMaterial color={DK.orange} metalness={0.3} roughness={0.45} />
            </mesh>
          ))}
          {/* control box on one post */}
          {s === 1 && (
            <mesh position={[0.26, 1.25, 0]}>
              <boxGeometry args={[0.2, 0.3, 0.16]} />
              <meshStandardMaterial color="#111" roughness={0.5} />
            </mesh>
          )}
        </group>
      ))}
      {/* overhead crossbar */}
      <mesh position={[0, 3.84, 0]} castShadow>
        <boxGeometry args={[0.24, 0.16, 3.44]} />
        <meshStandardMaterial color={DK.navy} metalness={0.5} roughness={0.45} />
      </mesh>
      <Car position={[0, height - 0.12, 0]} />
    </group>
  );
}
