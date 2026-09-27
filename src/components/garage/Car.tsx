import { useFrame, type ThreeElements } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  CatmullRomCurve3,
  Color,
  ExtrudeGeometry,
  LatheGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Shape,
  TubeGeometry,
  Vector2,
  Vector3,
  type Group,
} from "three";
import { DK, hazardTexture, tireTexture } from "./textures";

const WHEEL_R = 0.37;
const WHEEL_X = [-1.46, 1.5];
const TRACK = 0.84;

/* ----------------------------------------------------------------- wheels */

export function tireGeometry(r: number, w: number) {
  const pts: Vector2[] = [];
  const inner = r * 0.68;
  const steps = 14;
  pts.push(new Vector2(inner, -w / 2));
  for (let i = 0; i <= steps; i += 1) {
    const a = -Math.PI / 2 + (Math.PI * i) / steps;
    const shoulder = Math.pow(Math.abs(Math.cos(a)), 0.35);
    pts.push(new Vector2(inner + (r - inner) * shoulder, (Math.sin(a) * w) / 2));
  }
  pts.push(new Vector2(inner, w / 2));
  const g = new LatheGeometry(pts, 64);
  g.rotateZ(Math.PI / 2);
  return g;
}

/** Rim dish: a stepped lathe so the face has depth, not a flat disc. */
function rimGeometry(r: number, w: number) {
  const pts = [
    new Vector2(r * 0.7, -w * 0.42),
    new Vector2(r * 0.7, w * 0.3),
    new Vector2(r * 0.72, w * 0.38),
    new Vector2(r * 0.69, w * 0.42),
    new Vector2(r * 0.62, w * 0.36),
  ];
  const g = new LatheGeometry(pts, 48);
  g.rotateZ(Math.PI / 2);
  return g;
}

const tireMats = new Map<string, MeshStandardMaterial>();
export function tireMaterial() {
  const hit = tireMats.get("t");
  if (hit) return hit;
  const tex = tireTexture();
  const m = new MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 2.5, roughness: 0.9 });
  tireMats.set("t", m);
  return m;
}

/**
 * Wheel with its axle along x. Five split spokes run from the hub out to the
 * barrel. They never cross each other, so nothing is coplanar and nothing
 * shimmers the way overlapping bars did.
 */
export function Wheel({
  radius = WHEEL_R,
  width = 0.26,
  rimColor = "#23262c",
  brakes = true,
  spokes = 5,
  ...props
}: {
  radius?: number;
  width?: number;
  rimColor?: string;
  brakes?: boolean;
  spokes?: number;
} & ThreeElements["group"]) {
  const tire = useMemo(() => tireGeometry(radius, width), [radius, width]);
  const rim = useMemo(() => rimGeometry(radius, width), [radius, width]);
  const rimMat = useMemo(
    () => new MeshStandardMaterial({ color: rimColor, metalness: 0.92, roughness: 0.22 }),
    [rimColor],
  );
  const spokeLen = radius * 0.5;
  return (
    <group {...props}>
      <mesh geometry={tire} material={tireMaterial()} castShadow />
      <mesh geometry={rim} material={rimMat} />
      {[1, -1].map((side) => (
        <group key={side} position={[(side * width) / 2.6, 0, 0]}>
          {Array.from({ length: spokes }).map((_, i) =>
            [-0.09, 0.09].map((split) => {
              const a = (i * Math.PI * 2) / spokes + split;
              return (
                <mesh
                  key={`${i}${split}`}
                  material={rimMat}
                  position={[side * 0.004 * (i % 2), Math.sin(a) * (radius * 0.14 + spokeLen / 2), Math.cos(a) * (radius * 0.14 + spokeLen / 2)]}
                  rotation={[-a, 0, 0]}
                >
                  <boxGeometry args={[0.03, 0.028, spokeLen]} />
                </mesh>
              );
            }),
          )}
          <mesh rotation={[0, 0, Math.PI / 2]} material={rimMat}>
            <cylinderGeometry args={[radius * 0.15, radius * 0.17, 0.05, 24]} />
          </mesh>
          <mesh position={[side * 0.028, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[radius * 0.07, radius * 0.07, 0.012, 20]} />
            <meshStandardMaterial color={DK.orange} metalness={0.4} roughness={0.35} />
          </mesh>
        </group>
      ))}
      {brakes && (
        <group>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[radius * 0.58, radius * 0.58, 0.03, 40]} />
            <meshStandardMaterial color="#8d939b" metalness={0.95} roughness={0.35} />
          </mesh>
          <mesh position={[0.02, radius * 0.38, radius * 0.22]} rotation={[0.5, 0, 0]}>
            <boxGeometry args={[0.09, 0.2, 0.13]} />
            <meshStandardMaterial color={DK.orange} roughness={0.35} metalness={0.2} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/* ------------------------------------------------------------------- car */

/** Side profile of a low grand tourer: long hood, short deck, wheel arches cut in. */
function bodyShape() {
  const s = new Shape();
  const archR = WHEEL_R + 0.06;
  s.moveTo(-2.3, 0.36);
  s.lineTo(WHEEL_X[0]! - archR, 0.3);
  s.absarc(WHEEL_X[0]!, 0.37, archR, Math.PI, 0, true);
  s.lineTo(WHEEL_X[1]! - archR, 0.3);
  s.absarc(WHEEL_X[1]!, 0.37, archR, Math.PI, 0, true);
  s.lineTo(2.22, 0.3);
  s.bezierCurveTo(2.38, 0.33, 2.42, 0.46, 2.38, 0.56);
  s.bezierCurveTo(2.3, 0.66, 2.1, 0.72, 1.7, 0.76);
  s.bezierCurveTo(1.2, 0.8, 0.9, 0.84, 0.7, 0.86);
  s.lineTo(-0.9, 0.9);
  s.bezierCurveTo(-1.7, 0.9, -2.15, 0.88, -2.32, 0.8);
  s.bezierCurveTo(-2.4, 0.7, -2.4, 0.5, -2.3, 0.36);
  return s;
}

function cabinShape() {
  const s = new Shape();
  s.moveTo(0.72, 0.84);
  s.bezierCurveTo(0.4, 1.02, 0.1, 1.2, -0.25, 1.26);
  s.bezierCurveTo(-0.6, 1.3, -0.95, 1.24, -1.2, 1.12);
  s.bezierCurveTo(-1.5, 1.0, -1.8, 0.9, -2.05, 0.86);
  s.lineTo(0.72, 0.84);
  return s;
}

export function Car(props: ThreeElements["group"]) {
  const body = useMemo(() => {
    const g = new ExtrudeGeometry(bodyShape(), {
      depth: 1.56,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.09,
      bevelSegments: 8,
      curveSegments: 40,
    });
    g.translate(0, 0, -0.78);
    return g;
  }, []);
  const cabin = useMemo(() => {
    const g = new ExtrudeGeometry(cabinShape(), {
      depth: 1.04,
      bevelEnabled: true,
      bevelThickness: 0.22,
      bevelSize: 0.07,
      bevelSegments: 8,
      curveSegments: 32,
    });
    g.translate(0, 0, -0.52);
    return g;
  }, []);
  const exhaust = useMemo(() => {
    const curve = new CatmullRomCurve3([
      new Vector3(1.2, 0.2, 0.2),
      new Vector3(0.2, 0.19, 0.25),
      new Vector3(-1.2, 0.2, 0.3),
      new Vector3(-2.2, 0.28, 0.42),
    ]);
    return new TubeGeometry(curve, 40, 0.045, 10, false);
  }, []);
  const paint = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: new Color("#d8601a"),
        metalness: 0.55,
        roughness: 0.22,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        sheen: 0.4,
        sheenColor: new Color("#ffb070"),
      }),
    [],
  );
  const black = useMemo(
    () => new MeshPhysicalMaterial({ color: "#0b0c10", metalness: 0.4, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 }),
    [],
  );
  const glass = useMemo(
    () => new MeshPhysicalMaterial({ color: "#07090d", metalness: 0.1, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.01 }),
    [],
  );
  const carbon = useMemo(() => new MeshStandardMaterial({ color: "#16171b", roughness: 0.5, metalness: 0.3 }), []);
  const chrome = useMemo(() => new MeshStandardMaterial({ color: "#c9ced6", metalness: 1, roughness: 0.15 }), []);
  const led = useMemo(
    () => new MeshStandardMaterial({ color: "#ffffff", emissive: "#e6efff", emissiveIntensity: 3.2, toneMapped: false }),
    [],
  );
  const orange = useMemo(() => new MeshStandardMaterial({ color: DK.orange, roughness: 0.4 }), []);
  const tail = useMemo(
    () => new MeshStandardMaterial({ color: "#ff3b1f", emissive: "#ff2a10", emissiveIntensity: 3, toneMapped: false }),
    [],
  );

  return (
    <group {...props}>
      <mesh geometry={body} material={paint} castShadow />
      <mesh geometry={cabin} material={glass} castShadow />
      {/* gloss black roof panel riding on the glasshouse */}
      <mesh position={[-0.42, 1.285, 0]} scale={[0.95, 0.06, 0.82]} material={black}>
        <sphereGeometry args={[0.72, 32, 12]} />
      </mesh>
      {/* hood vents and twin racing stripes */}
      {[-0.2, 0.2].map((z) => (
        <mesh key={z} position={[1.45, 0.85, z]} rotation={[0, 0, -0.1]} material={black}>
          <boxGeometry args={[1.35, 0.012, 0.16]} />
        </mesh>
      ))}
      {[-0.55, 0.55].map((z) => (
        <mesh key={z} position={[1.25, 0.83, z]} rotation={[0, 0, -0.09]} material={carbon}>
          <boxGeometry args={[0.36, 0.02, 0.22]} />
        </mesh>
      ))}
      {/* side details: skirt, door cut, mirror, handle */}
      {[1, -1].map((s) => (
        <group key={s}>
          <mesh position={[0.02, 0.29, s * 0.93]} material={carbon}>
            <boxGeometry args={[2.1, 0.08, 0.08]} />
          </mesh>
          <mesh position={[0.1, 0.6, s * 0.975]} material={black}>
            <boxGeometry args={[0.012, 0.5, 0.012]} />
          </mesh>
          <mesh position={[-0.35, 0.72, s * 0.978]} material={chrome}>
            <boxGeometry args={[0.18, 0.025, 0.012]} />
          </mesh>
          <group position={[0.55, 0.95, s * 0.95]}>
            <mesh position={[0, 0, s * 0.1]} material={black}>
              <boxGeometry args={[0.08, 0.03, 0.2]} />
            </mesh>
            <mesh position={[0, 0.02, s * 0.2]} scale={[0.09, 0.07, 0.07]} material={paint}>
              <sphereGeometry args={[1, 16, 12]} />
            </mesh>
          </group>
          {/* side intake behind the door */}
          <mesh position={[-0.95, 0.55, s * 0.975]} rotation={[0, 0, 0.35]} material={carbon}>
            <boxGeometry args={[0.4, 0.14, 0.014]} />
          </mesh>
        </group>
      ))}
      {/* front: grille, splitter, headlight blades */}
      <mesh position={[2.36, 0.46, 0]} material={carbon}>
        <boxGeometry args={[0.06, 0.16, 1.1]} />
      </mesh>
      <mesh position={[2.3, 0.3, 0]} material={carbon}>
        <boxGeometry args={[0.28, 0.03, 1.72]} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={`hl${s}`} position={[2.22, 0.66, s * 0.62]} rotation={[0, 0, -0.35]} material={led}>
          <boxGeometry args={[0.26, 0.03, 0.34]} />
        </mesh>
      ))}
      {/* rear: light bar, diffuser, wing */}
      <mesh position={[-2.37, 0.72, 0]} material={tail}>
        <boxGeometry args={[0.03, 0.04, 1.62]} />
      </mesh>
      <mesh position={[-2.3, 0.3, 0]} material={carbon}>
        <boxGeometry args={[0.3, 0.06, 1.5]} />
      </mesh>
      {[-0.45, -0.15, 0.15, 0.45].map((z) => (
        <mesh key={z} position={[-2.25, 0.26, z]} material={carbon}>
          <boxGeometry args={[0.36, 0.1, 0.015]} />
        </mesh>
      ))}
      {[-0.35, 0.35].map((z) => (
        <mesh key={`ws${z}`} position={[-2.05, 1.0, z]} material={carbon}>
          <boxGeometry args={[0.06, 0.2, 0.04]} />
        </mesh>
      ))}
      <mesh position={[-2.1, 1.1, 0]} rotation={[0, 0, 0.06]} material={carbon}>
        <boxGeometry args={[0.36, 0.035, 1.7]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`tip${s}`} position={[-2.38, 0.27, s * 0.42]} rotation={[0, 0, Math.PI / 2]} material={chrome}>
          <cylinderGeometry args={[0.055, 0.055, 0.12, 20, 1, true]} />
        </mesh>
      ))}
      {/* underside: what you actually look at when it is on the lift */}
      <mesh position={[0, 0.24, 0]} material={carbon}>
        <boxGeometry args={[4.2, 0.04, 1.64]} />
      </mesh>
      <mesh position={[0.1, 0.19, 0]} material={carbon}>
        <boxGeometry args={[2.6, 0.08, 0.3]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`ex${s}`} geometry={exhaust} position={[0, 0, s === 1 ? 0 : -0.72]} material={chrome} />
      ))}
      {WHEEL_X.map((x) =>
        [-1, 1].map((s) => (
          <group key={`arm${x}${s}`}>
            <mesh position={[x, 0.3, s * 0.5]} rotation={[0, s * 0.25, 0]} material={chrome}>
              <boxGeometry args={[0.06, 0.04, 0.62]} />
            </mesh>
            <mesh position={[x + 0.05, 0.5, s * 0.66]} material={black}>
              <cylinderGeometry args={[0.04, 0.04, 0.4, 12]} />
            </mesh>
            <mesh position={[x + 0.05, 0.5, s * 0.66]} material={orange}>
              <torusGeometry args={[0.06, 0.012, 6, 16]} />
            </mesh>
          </group>
        )),
      )}
      {WHEEL_X.map((x) =>
        [-1, 1].map((s) => (
          <Wheel key={`${x}${s}`} position={[x, WHEEL_R, s * TRACK]} rotation={[0, Math.PI / 2, 0]} />
        )),
      )}
    </group>
  );
}

/* ------------------------------------------------------------------- lift */

/**
 * Two-post lift with the car raised. The car runs along x; the posts stand
 * either side at the wheelbase centre. A strip of light under the car and a
 * slow turntable of highlights keep the eye on it.
 */
export function LiftWithCar({ height = 1.45, ...props }: { height?: number } & ThreeElements["group"]) {
  const hazard = useMemo(() => hazardTexture(), []);
  const glow = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (glow.current) glow.current.rotation.y = clock.elapsedTime * 0.12;
  });
  const post = { color: DK.navy, metalness: 0.55, roughness: 0.38 } as const;
  return (
    <group {...props}>
      {[-1, 1].map((s) => (
        <group key={s} position={[0, 0, s * 1.6]}>
          <mesh position={[0, 1.95, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.34, 3.9, 0.36]} />
            <meshStandardMaterial {...post} />
          </mesh>
          <mesh position={[0, 1.95, -s * 0.185]}>
            <boxGeometry args={[0.1, 3.6, 0.02]} />
            <meshStandardMaterial color={DK.orange} roughness={0.4} />
          </mesh>
          {/* safety lock rack */}
          {Array.from({ length: 14 }).map((_, i) => (
            <mesh key={i} position={[0.175, 0.5 + i * 0.22, 0]}>
              <boxGeometry args={[0.02, 0.05, 0.16]} />
              <meshStandardMaterial color="#9aa1aa" metalness={0.8} roughness={0.35} />
            </mesh>
          ))}
          <mesh position={[0, 0.035, 0]} receiveShadow>
            <boxGeometry args={[0.74, 0.07, 0.74]} />
            <meshStandardMaterial map={hazard} roughness={0.6} />
          </mesh>
          <mesh position={[0, height - 0.08, -s * 0.22]} castShadow>
            <boxGeometry args={[0.44, 0.34, 0.18]} />
            <meshStandardMaterial color="#2b3350" metalness={0.5} roughness={0.4} />
          </mesh>
          {[-1, 1].map((a) => (
            <group key={a}>
              <mesh position={[a * 0.58, height - 0.17, -s * 0.58]} rotation={[0, a * s * 0.58, 0]} castShadow>
                <boxGeometry args={[1.26, 0.08, 0.15]} />
                <meshStandardMaterial color={DK.orange} metalness={0.3} roughness={0.4} />
              </mesh>
              <mesh position={[a * 1.08, height - 0.1, -s * 0.95]}>
                <cylinderGeometry args={[0.08, 0.08, 0.08, 20]} />
                <meshStandardMaterial color="#111" roughness={0.8} />
              </mesh>
            </group>
          ))}
          {s === 1 && (
            <group position={[0.28, 1.3, 0]}>
              <mesh>
                <boxGeometry args={[0.2, 0.32, 0.16]} />
                <meshStandardMaterial color="#111" roughness={0.5} />
              </mesh>
              <mesh position={[0.101, 0.06, 0]} rotation={[0, Math.PI / 2, 0]}>
                <circleGeometry args={[0.03, 16]} />
                <meshStandardMaterial color="#39ff7a" emissive="#39ff7a" emissiveIntensity={2} toneMapped={false} />
              </mesh>
            </group>
          )}
        </group>
      ))}
      <mesh position={[0, 3.94, 0]} castShadow>
        <boxGeometry args={[0.26, 0.18, 3.56]} />
        <meshStandardMaterial {...post} />
      </mesh>
      {/* LED strip on the crossbar lighting the roof */}
      <mesh position={[0, 3.84, 0]}>
        <boxGeometry args={[0.08, 0.02, 3.2]} />
        <meshBasicMaterial color={new Color(2.4, 2.1, 1.8)} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 3.6, 0]} intensity={14} distance={5} color="#fff1e0" />
      {/* under-glow on the floor */}
      <group ref={glow}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
          <ringGeometry args={[2.3, 2.36, 96]} />
          <meshBasicMaterial color={new Color(1.8, 0.8, 0.3)} toneMapped={false} />
        </mesh>
      </group>
      <pointLight position={[0, 0.5, 0]} intensity={10} distance={4} color="#ff9a4a" />
      <Car position={[0, height - 0.13, 0]} />
    </group>
  );
}
