import { useMemo } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
} from "three";
import { asphaltTexture, DK } from "../garage/textures";
import { RealisticShrubs, RealisticTrees, type ShrubSpec, type TreeSpec } from "../garage/Foliage";
import {
  ACCESS, AISLE_X, COLUMNS, CROSS_NORTH_Z, CROSS_SOUTH_Z, LANES, LOT, PLANTER_W, PLANTER_X, ROAD, SL, SLOTS, SW, Z0, Z1, rng, slotZ,
} from "./layout";

/** Materials the theme driver recolours every frame. */
export const mats = {
  asphalt: new MeshStandardMaterial({ map: asphaltTexture(), color: "#d6d8de", roughness: 0.92, metalness: 0 }),
  lot: new MeshStandardMaterial({ color: "#d6d8de", roughness: 0.92, metalness: 0 }),
  road: new MeshStandardMaterial({ map: asphaltTexture(), color: "#c9ccd2", roughness: 0.9 }),
  line: new MeshStandardMaterial({ color: "#f4f4f2", roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  yellow: new MeshStandardMaterial({ color: "#e2b53a", roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  blue: new MeshStandardMaterial({ color: "#1d5fc4", roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  grass: new MeshStandardMaterial({ color: "#9db57a", roughness: 1 }),
  concrete: new MeshStandardMaterial({ color: "#cfcbc2", roughness: 0.85 }),
  soil: new MeshStandardMaterial({ color: "#5a4636", roughness: 1 }),
  cover: new MeshStandardMaterial({ color: "#6f8a4f", roughness: 1 }),
  pole: new MeshStandardMaterial({ color: "#2a2f38", roughness: 0.5, metalness: 0.6 }),
  lampHead: new MeshBasicMaterial({ color: new Color(1, 1, 1), toneMapped: false }),
  pool: new MeshBasicMaterial({ transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0, toneMapped: false }),
};

/** Collects flat quads (and triangles) into one geometry: a whole lot's paint in one draw. */
function paint() {
  const pos: number[] = [];
  const quad = (cx: number, cz: number, w: number, d: number, rot = 0) => {
    const c = Math.cos(rot), s = Math.sin(rot);
    const pts = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([x, z]) => [cx + x! * c - z! * s, cz + x! * s + z! * c] as const);
    [0, 2, 1, 0, 3, 2].forEach((i) => pos.push(pts[i]![0], 0, pts[i]![1]));
  };
  const geo = () => {
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new Float32BufferAttribute(pos.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
    return g;
  };
  return { quad, geo, pos };
}

function useMarkings() {
  return useMemo(() => {
    const white = paint();
    const yellow = paint();
    const blue = paint();
    COLUMNS.forEach((col, ci) => {
      for (let i = 0; i <= SLOTS; i += 1) {
        const z = Z0 + SW * i;
        white.quad(col.x, z, SL, 0.14);
      }
      // the end of the bay under the nose is shown by the planter curb, not a line
      void ci;
    });
    // accessible bays: blue hatching
    const ac = COLUMNS[ACCESS.col]!;
    ACCESS.slots.forEach((s) => {
      blue.quad(ac.x, slotZ(s), SL - 0.2, SW - 0.2);
    });
    // stop bars at both entries and a pedestrian crosswalk at the south
    for (let i = 0; i < 9; i += 1) white.quad(AISLE_X[0] + (i - 4) * 0.7, CROSS_SOUTH_Z + 4.4, 0.4, 2.2);
    // road: centre double yellow, dashed lane lines
    yellow.quad(48.8, 0, 0.12, 160);
    yellow.quad(49.2, 0, 0.12, 160);
    for (let z = -80; z < 80; z += 6) {
      white.quad((LANES[0] + LANES[1]) / 2, z, 0.12, 3);
      white.quad((LANES[2] + LANES[3]) / 2, z, 0.12, 3);
    }
    white.quad(ROAD.x0 + 0.3, 0, 0.12, 160);
    white.quad(ROAD.x1 - 0.3, 0, 0.12, 160);
    return { white: white.geo(), yellow: yellow.geo(), blue: blue.geo() };
  }, []);
}

/** Directional arrow painted on the asphalt, pointing along rot (0 = +x). */
function arrowGeometry() {
  const s = new Shape();
  s.moveTo(-1.4, -0.22);
  s.lineTo(0.5, -0.22);
  s.lineTo(0.5, -0.7);
  s.lineTo(1.5, 0);
  s.lineTo(0.5, 0.7);
  s.lineTo(0.5, 0.22);
  s.lineTo(-1.4, 0.22);
  s.closePath();
  const g = new ShapeGeometry(s);
  g.rotateX(-Math.PI / 2);
  return g;
}

function hatchTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 128, 128);
  g.strokeStyle = "rgba(255,255,255,0.95)";
  g.lineWidth = 5;
  for (let i = -128; i < 256; i += 22) {
    g.beginPath();
    g.moveTo(i, 128);
    g.lineTo(i + 128, 0);
    g.stroke();
  }
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(3, 2);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function poolTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  // smooth, long fall-off: a lamp's light has no visible edge
  for (let i = 0; i <= 10; i += 1) {
    const t = i / 10;
    gr.addColorStop(t, `rgba(255,240,215,${Math.pow(1 - t, 2.4).toFixed(3)})`);
  }
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  return new CanvasTexture(c);
}

/** One painted-on texture for the whole lot: grain, wear lanes down the aisles, oil spots in the bays. */
function lotAsphalt() {
  const W = 2048;
  const H = Math.round((W * (LOT.z1 - LOT.z0)) / (LOT.x1 - LOT.x0));
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const r = rng(41);
  const px = (x: number) => ((x - LOT.x0) / (LOT.x1 - LOT.x0)) * W;
  const pz = (z: number) => ((z - LOT.z0) / (LOT.z1 - LOT.z0)) * H;
  const m = W / (LOT.x1 - LOT.x0);
  g.fillStyle = "#3a3c41";
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i += 1) {
    const x = r() * W, y = r() * H, rad = 60 + r() * 220;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const lit = r() > 0.5;
    gr.addColorStop(0, lit ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.09)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // resurfaced patches
  for (let i = 0; i < 5; i += 1) {
    g.fillStyle = r() > 0.5 ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.04)";
    g.fillRect(r() * W, r() * H, 120 + r() * 300, 80 + r() * 220);
  }
  // tyre wear: two dark lanes in every aisle, a lighter crown between them
  AISLE_X.forEach((x) => {
    [-1.3, 1.3].forEach((o) => {
      g.fillStyle = "rgba(0,0,0,0.16)";
      g.fillRect(px(x + o) - m * 0.45, 0, m * 0.9, H);
    });
  });
  [CROSS_NORTH_Z, CROSS_SOUTH_Z].forEach((z) => {
    [-1.3, 1.3].forEach((o) => {
      g.fillStyle = "rgba(0,0,0,0.16)";
      g.fillRect(0, pz(z + o) - m * 0.45, W, m * 0.9);
    });
  });
  // oil spots where engines sit
  COLUMNS.forEach((col) => {
    for (let s = 0; s < SLOTS; s += 1) {
      if (r() > 0.55) continue;
      const x = px(col.x + col.facing * (SL / 2 - 1.1) + (r() - 0.5) * 0.4);
      const y = pz(slotZ(s) + (r() - 0.5) * 0.7);
      const gr = g.createRadialGradient(x, y, 0, x, y, m * (0.35 + r() * 0.35));
      gr.addColorStop(0, "rgba(8,6,6,0.45)");
      gr.addColorStop(1, "rgba(8,6,6,0)");
      g.fillStyle = gr;
      g.fillRect(x - m, y - m, m * 2, m * 2);
    }
  });
  // hairline cracks
  g.strokeStyle = "rgba(10,10,12,0.5)";
  g.lineWidth = 1.2;
  for (let i = 0; i < 26; i += 1) {
    let x = r() * W, y = r() * H;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 9; k += 1) {
      x += (r() - 0.4) * 38;
      y += (r() - 0.5) * 38;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  // fine grain over everything
  for (let i = 0; i < 260000; i += 1) {
    const v = r() > 0.5 ? 255 : 0;
    g.fillStyle = `rgba(${v},${v},${v},${0.03 + r() * 0.06})`;
    g.fillRect(r() * W, r() * H, 1.4, 1.4);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const arrows = [
  // aisles flow north
  ...AISLE_X.flatMap((x) => [-11, 9].map((z) => [x, z, -Math.PI / 2] as const)),
  // south cross-aisle flows west, north cross-aisle flows east
  ...[-20, 0, 20].map((x) => [x, CROSS_SOUTH_Z + 1, Math.PI] as const),
  ...[-20, 0, 20].map((x) => [x, CROSS_NORTH_Z - 1, 0] as const),
];

export const LAMPS: Array<[number, number]> = PLANTER_X.flatMap((x) => [[x, -9.5], [x, 9.5]] as Array<[number, number]>);

export function Ground({ mobile }: { mobile: boolean }) {
  const marks = useMarkings();
  const arrow = useMemo(arrowGeometry, []);
  const hatch = useMemo(hatchTexture, []);
  const pool = useMemo(poolTexture, []);
  mats.pool.map = pool;
  const lotMap = useMemo(lotAsphalt, []);
  useMemo(() => {
    mats.lot.map = lotMap;
    mats.lot.bumpMap = lotMap;
    mats.lot.bumpScale = 1.6;
    mats.lot.envMapIntensity = 0.35;
    mats.lot.needsUpdate = true;
  }, [lotMap]);

  const shrubs = useMemo(() => {
    const r = rng(11);
    const out: ShrubSpec[] = [];
    PLANTER_X.forEach((px) => {
      for (let z = Z0 + 1.5; z < Z1; z += 3.4) out.push([px + (r() - 0.5) * 0.3, z + (r() - 0.5) * 0.8, 1.2 + r() * 0.5, 0.55 + r() * 0.45, 1.1 + r() * 0.4]);
    });
    // east and west edge planting
    for (let z = -22; z < 22; z += 4.5) {
      out.push([33.5, z, 1.6, 0.8, 1.6], [-32.6, z, 1.4, 0.7, 1.4]);
    }
    return out;
  }, []);
  const trees = useMemo(() => {
    const out: TreeSpec[] = [];
    const zs = mobile ? [-13, 1, 14] : [-14, -4, 5, 14];
    PLANTER_X.forEach((px, i) => zs.forEach((z, j) => out.push([px, z + (i + j) % 2 * 0.6, 0.62])));
    [-19, -9, 1, 11].forEach((z) => out.push([35.2, z, 0.9]));
    [-14, -3, 8].forEach((z) => out.push([-32.4, z, 0.7]));
    return out;
  }, [mobile]);

  const lotW = LOT.x1 - LOT.x0;
  const lotD = LOT.z1 - LOT.z0;
  return (
    <group>
      {/* the world, a grass base under everything */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow material={mats.grass}>
        <planeGeometry args={[420, 420]} />
      </mesh>
      {/* lot surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow material={mats.lot}>
        <planeGeometry args={[lotW, lotD]} />
      </mesh>
      {/* road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(ROAD.x0 + ROAD.x1) / 2, 0.005, 0]} receiveShadow material={mats.road}>
        <planeGeometry args={[ROAD.x1 - ROAD.x0, 180]} />
      </mesh>
      {/* driveways connect lot and road across the planted verge */}
      {[CROSS_SOUTH_Z, CROSS_NORTH_Z].map((z) => (
        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[(LOT.x1 + ROAD.x0) / 2, 0.004, z]} receiveShadow material={mats.asphalt}>
          <planeGeometry args={[ROAD.x0 - LOT.x1 + 0.2, 6.4]} />
        </mesh>
      ))}
      {/* sidewalks: along the road, the building and both ends */}
      {[
        [(LOT.x1 + ROAD.x0) / 2, 0.01, 0, ROAD.x0 - LOT.x1, 180],
        [ROAD.x1 + 3.5, 0.01, 0, 7, 180],
      ].map(([x, y, z, w, d], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x!, y!, z!]} receiveShadow material={mats.concrete}>
          <planeGeometry args={[w!, d!]} />
        </mesh>
      ))}
      {/* verge planting beside the road, leaving the driveways open */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(LOT.x1 + ROAD.x0) / 2 - 0.5, 0.03, (CROSS_NORTH_Z + CROSS_SOUTH_Z) / 2]} receiveShadow material={mats.cover}>
        <planeGeometry args={[4.4, CROSS_SOUTH_Z - CROSS_NORTH_Z - 6.6]} />
      </mesh>
      {/* west walk along the building */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[LOT.x0 - 1.8, 0.01, 0]} receiveShadow material={mats.concrete}>
        <planeGeometry args={[3.6, 70]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-32.6, 0.03, 0]} receiveShadow material={mats.cover}>
        <planeGeometry args={[1.6, 48]} />
      </mesh>
      {/* south promenade */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, LOT.z1 + 4]} receiveShadow material={mats.concrete}>
        <planeGeometry args={[lotW + 8, 8]} />
      </mesh>

      {/* paint */}
      <mesh geometry={marks.white} material={mats.line} position={[0, 0.011, 0]} receiveShadow />
      <mesh geometry={marks.yellow} material={mats.yellow} position={[0, 0.011, 0]} receiveShadow />
      <mesh geometry={marks.blue} material={mats.blue} position={[0, 0.012, 0]} receiveShadow />
      {ACCESS.slots.map((s) => (
        <mesh key={s} rotation={[-Math.PI / 2, 0, 0]} position={[COLUMNS[ACCESS.col]!.x, 0.015, slotZ(s)]}>
          <planeGeometry args={[SL - 0.2, SW - 0.2]} />
          <meshBasicMaterial map={hatch} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3} />
        </mesh>
      ))}
      {arrows.map(([x, z, r], i) => (
        <mesh key={i} geometry={arrow} material={mats.line} position={[x, 0.012, z]} rotation={[0, r, 0]} scale={1.1} receiveShadow />
      ))}

      {/* planter islands */}
      {PLANTER_X.map((px) => (
        <group key={px} position={[px, 0, 0]}>
          <mesh position={[0, 0.1, 0]} castShadow receiveShadow material={mats.concrete}>
            <boxGeometry args={[PLANTER_W, 0.2, SLOTS * SW + 0.6]} />
          </mesh>
          <mesh position={[0, 0.205, 0]} receiveShadow material={mats.soil}>
            <boxGeometry args={[PLANTER_W - 0.3, 0.02, SLOTS * SW + 0.3]} />
          </mesh>
          <mesh position={[0, 0.22, 0]} receiveShadow material={mats.cover}>
            <boxGeometry args={[PLANTER_W - 0.5, 0.02, SLOTS * SW]} />
          </mesh>
        </group>
      ))}
      <RealisticShrubs shrubs={shrubs.map(([x, z, w, h, d]) => [x, z, w * 0.8, h, d * 0.8] as ShrubSpec)} seed={5} />
      <RealisticTrees trees={trees} seed={3} />

      {/* lamp posts with a soft floodlit pool on the ground */}
      {LAMPS.map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position={[0, 3.8, 0]} castShadow material={mats.pole}>
            <cylinderGeometry args={[0.09, 0.12, 7.6, 10]} />
          </mesh>
          <mesh position={[0, 7.55, 0]} material={mats.pole}>
            <boxGeometry args={[7.2, 0.12, 0.16]} />
          </mesh>
          {[-3.4, 3.4].map((dx) => (
            <mesh key={dx} position={[dx, 7.45, 0]} material={mats.lampHead}>
              <boxGeometry args={[0.9, 0.12, 0.42]} />
            </mesh>
          ))}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} material={mats.pool} renderOrder={2}>
            <planeGeometry args={[24, 24]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

void DK;
