import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
const world = { get: () => ({ reduced: typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches }) };

/**
 * Realistic vegetation on a phone budget. Trees are a bark-textured trunk
 * with limbs and a crown of alpha-cut leaf cards drawn procedurally at load
 * (hundreds of individual leaves per card, varied greens, sun-lit edges).
 * Grass is instanced crossed blade cards that sway in a light breeze.
 * Every tree in the scene shares three instanced draw calls, and all grass
 * is one draw call.
 */

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const isMobile = () => typeof window !== "undefined" && window.innerWidth < 768;

function leafTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const r = rng(11);
  const greens = ["#2f5a24", "#3b6b2b", "#4a7d33", "#5b8f3d", "#6f9f47", "#86b457"];
  for (let i = 0; i < 780; i++) {
    // Leaves cluster toward the middle so each card reads as a clump, not a square.
    const a = r() * Math.PI * 2;
    const d = Math.pow(r(), 0.65) * 112;
    const x = 128 + Math.cos(a) * d;
    const y = 128 + Math.sin(a) * d * 0.9;
    const lit = 1 - (y / 256) * 0.7;
    g.save();
    g.translate(x, y);
    g.rotate(r() * Math.PI * 2);
    g.fillStyle = greens[Math.min(greens.length - 1, Math.floor(r() * 3 + lit * 3))]!;
    g.beginPath();
    g.ellipse(0, 0, 3 + r() * 5, 7 + r() * 7, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(20,40,15,0.35)";
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(0, -6);
    g.lineTo(0, 6);
    g.stroke();
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function barkTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#5b4633";
  g.fillRect(0, 0, 64, 256);
  const r = rng(5);
  for (let i = 0; i < 90; i++) {
    const x = r() * 64;
    g.strokeStyle = r() < 0.5 ? "rgba(35,25,18,0.55)" : "rgba(130,110,90,0.35)";
    g.lineWidth = 1 + r() * 2.5;
    g.beginPath();
    g.moveTo(x, 0);
    let y = 0;
    let xx = x;
    while (y < 256) {
      y += 8 + r() * 20;
      xx += (r() - 0.5) * 4;
      g.lineTo(xx, y);
    }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function grassTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d")!;
  const r = rng(3);
  for (let i = 0; i < 70; i++) {
    const x = 10 + r() * 108;
    const h = 60 + r() * 64;
    const bend = (r() - 0.5) * 26;
    const shade = 90 + Math.floor(r() * 70);
    const grad = g.createLinearGradient(0, 128, 0, 128 - h);
    grad.addColorStop(0, `rgb(${40},${shade - 30},${25})`);
    grad.addColorStop(1, `rgb(${110 + Math.floor(r() * 40)},${shade + 60},${55})`);
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(x - 2.4, 128);
    g.quadraticCurveTo(x + bend * 0.4, 128 - h * 0.6, x + bend, 128 - h);
    g.quadraticCurveTo(x + bend * 0.4 + 1.2, 128 - h * 0.6, x + 2.4, 128);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Tight small-leaved foliage, like boxwood or holly, for the shrub cards. */
function shrubLeafTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const r = rng(29);
  const greens = ["#1f3d1b", "#2a4f22", "#355f29", "#406f30", "#4f8038", "#62923f", "#79a84c"];
  for (let i = 0; i < 1400; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.pow(r(), 0.55) * 118;
    const x = 128 + Math.cos(a) * d;
    const y = 128 + Math.sin(a) * d;
    const lit = 1 - y / 256;
    g.save();
    g.translate(x, y);
    g.rotate(r() * Math.PI * 2);
    g.fillStyle = greens[Math.min(greens.length - 1, Math.floor(r() * 3 + lit * 4))]!;
    g.beginPath();
    g.ellipse(0, 0, 2 + r() * 2.2, 4 + r() * 3.5, 0, 0, Math.PI * 2);
    g.fill();
    if (r() < 0.35) {
      g.fillStyle = "rgba(210,235,170,0.35)";
      g.beginPath();
      g.ellipse(-0.6, -1.5, 0.8, 1.6, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Shrub: centre x, z and size (width, height, depth) in metres. */
export type ShrubSpec = [x: number, z: number, w: number, h: number, d: number];

/**
 * Real-looking foundation shrubs. Each is a lumpy, dark leafy core (so it
 * never reads as see-through) wrapped in dozens of small alpha-cut leaf
 * clusters facing outward, lit on top and shaded underneath, with a ragged
 * silhouette instead of a smooth ball. All shrubs share two draw calls.
 */
export function RealisticShrubs({ shrubs, seed = 3 }: { shrubs: ShrubSpec[]; seed?: number }) {
  const coreRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const cards = isMobile() ? 70 : 130;

  const mats = useMemo(() => {
    const leaves = shrubLeafTexture();
    const coreMap = leaves.clone();
    coreMap.wrapS = coreMap.wrapT = THREE.RepeatWrapping;
    coreMap.repeat.set(3, 2);
    coreMap.needsUpdate = true;
    return {
      core: new THREE.MeshStandardMaterial({ map: coreMap, color: "#688a52", roughness: 0.95 }),
      leaf: new THREE.MeshStandardMaterial({
        map: leaves,
        alphaTest: 0.4,
        side: THREE.DoubleSide,
        roughness: 0.78,
      }),
    };
  }, []);
  const geos = useMemo(() => {
    // Lumpy core: an icosphere pushed in and out so the mass is irregular.
    const core = new THREE.IcosahedronGeometry(1, 3);
    const p = core.attributes["position"] as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n =
        1 +
        0.09 * Math.sin(v.x * 5.3 + v.y * 2.1) +
        0.07 * Math.sin(v.z * 6.7 - v.x * 3.3) +
        0.05 * Math.sin(v.y * 9.1 + v.z * 4.4);
      v.multiplyScalar(n);
      if (v.y < -0.55) v.y = -0.55 + (v.y + 0.55) * 0.3;
      p.setXYZ(i, v.x, v.y, v.z);
    }
    core.computeVertexNormals();
    return { core, card: new THREE.PlaneGeometry(1, 1) };
  }, []);

  useLayoutEffect(() => {
    const r = rng(seed * 131 + 7);
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    const n = new THREE.Vector3();
    const look = new THREE.Vector3();
    shrubs.forEach(([x, z, w, h, d], si) => {
      const cy = h * 0.5;
      o.position.set(x, cy, z);
      o.rotation.set(0, r() * Math.PI * 2, 0);
      o.scale.set(w * 0.44, h * 0.46, d * 0.44);
      o.updateMatrix();
      coreRef.current!.setMatrixAt(si, o.matrix);
      for (let k = 0; k < cards; k++) {
        // Points over the upper three quarters of an ellipsoid shell,
        // facing outward with a random twist so the edge stays ragged.
        const u = r() * Math.PI * 2;
        const cv = 1 - r() * 1.55;
        const sv = Math.sqrt(Math.max(0, 1 - cv * cv));
        n.set(sv * Math.cos(u), cv, sv * Math.sin(u));
        const shell = 0.4 + r() * 0.12;
        o.position.set(x + n.x * w * shell, cy + n.y * h * (shell + 0.02), z + n.z * d * shell);
        look.copy(o.position).add(n);
        o.rotation.set(0, 0, 0);
        o.lookAt(look);
        o.rotateX((r() - 0.5) * 0.9);
        o.rotateY((r() - 0.5) * 0.9);
        o.rotateZ(r() * Math.PI * 2);
        const sc = Math.min(w, h) * (0.26 + r() * 0.2);
        o.scale.set(sc, sc, sc);
        o.updateMatrix();
        const i = si * cards + k;
        leafRef.current!.setMatrixAt(i, o.matrix);
        const light = 0.62 + (n.y + 0.55) * 0.3 + r() * 0.12;
        col.setRGB(light * (0.9 + r() * 0.1), light, light * (0.82 + r() * 0.1));
        leafRef.current!.setColorAt(i, col);
      }
    });
    coreRef.current!.instanceMatrix.needsUpdate = true;
    leafRef.current!.instanceMatrix.needsUpdate = true;
    if (leafRef.current!.instanceColor) leafRef.current!.instanceColor.needsUpdate = true;
  }, [shrubs, cards, seed]);

  return (
    <group name="realistic-shrubs">
      <instancedMesh
        ref={coreRef}
        args={[geos.core, mats.core, shrubs.length]}
        castShadow
        receiveShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={leafRef}
        args={[geos.card, mats.leaf, shrubs.length * cards]}
        receiveShadow
        frustumCulled={false}
      />
    </group>
  );
}

export type TreeSpec = [x: number, z: number, scale: number];

export function RealisticTrees({ trees, seed = 1 }: { trees: TreeSpec[]; seed?: number }) {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const limbRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const cards = isMobile() ? 64 : 120;
  const limbs = 4;

  const mats = useMemo(() => {
    const bark = barkTexture();
    return {
      bark: new THREE.MeshStandardMaterial({ map: bark, roughness: 0.95 }),
      leaf: new THREE.MeshStandardMaterial({
        map: leafTexture(),
        alphaTest: 0.36,
        side: THREE.DoubleSide,
        roughness: 0.8,
      }),
    };
  }, []);
  const geos = useMemo(() => {
    const trunk = new THREE.CylinderGeometry(0.11, 0.2, 1, 9);
    trunk.translate(0, 0.5, 0);
    const limb = new THREE.CylinderGeometry(0.03, 0.07, 1, 6);
    limb.translate(0, 0.5, 0);
    return { trunk, limb, card: new THREE.PlaneGeometry(1.25, 1.25) };
  }, []);

  useLayoutEffect(() => {
    const r = rng(seed * 97 + 13);
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    trees.forEach(([x, z, s], ti) => {
      const trunkH = 2.1 * s;
      o.position.set(x, 0, z);
      o.rotation.set(0, r() * 6.28, (r() - 0.5) * 0.06);
      o.scale.set(s, trunkH, s);
      o.updateMatrix();
      trunkRef.current!.setMatrixAt(ti, o.matrix);
      for (let l = 0; l < limbs; l++) {
        const a = (l / limbs) * Math.PI * 2 + r();
        o.position.set(x, trunkH * (0.62 + r() * 0.25), z);
        o.rotation.set(Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9);
        o.scale.set(s, 1.3 * s, s);
        o.updateMatrix();
        limbRef.current!.setMatrixAt(ti * limbs + l, o.matrix);
      }
      const cy = trunkH + 1.2 * s;
      // The crown is a cluster of leafy lobes, like a real canopy, not one
      // ball. Each card faces outward from its lobe with a random roll, so
      // the silhouette is broken and full from every angle.
      const lobes: THREE.Vector3[] = [new THREE.Vector3(0, 0.55 * s, 0)];
      for (let l = 0; l < 5; l++) {
        const a = (l / 5) * Math.PI * 2 + r() * 0.8;
        lobes.push(
          new THREE.Vector3(Math.cos(a) * 1.05 * s, (r() - 0.35) * 0.7 * s, Math.sin(a) * 1.05 * s),
        );
      }
      const out = new THREE.Vector3();
      for (let k = 0; k < cards; k++) {
        const lobe = lobes[k % lobes.length]!;
        const u = r() * Math.PI * 2;
        const v = Math.acos(2 * r() - 1);
        const rad = 0.35 + Math.pow(r(), 0.5) * 0.75;
        out.set(Math.sin(v) * Math.cos(u), Math.cos(v) * 0.85, Math.sin(v) * Math.sin(u));
        const px = lobe.x + out.x * rad * s;
        const py = lobe.y + out.y * rad * s;
        const pz = lobe.z + out.z * rad * s;
        o.position.set(x + px, cy + py, z + pz);
        o.lookAt(x + px + out.x, cy + py + out.y, z + pz + out.z);
        o.rotateZ(r() * Math.PI * 2);
        o.rotateX((r() - 0.5) * 0.9);
        const sc = s * (0.75 + r() * 0.55);
        o.scale.set(sc, sc, sc);
        o.updateMatrix();
        const i = ti * cards + k;
        leafRef.current!.setMatrixAt(i, o.matrix);
        const light = 0.58 + (py / (1.6 * s) + 1) * 0.2 + rad * 0.14 + r() * 0.08;
        col.setRGB(light * (0.92 + r() * 0.1), light, light * (0.85 + r() * 0.1));
        leafRef.current!.setColorAt(i, col);
      }
    });
    for (const m of [trunkRef, limbRef, leafRef]) m.current!.instanceMatrix.needsUpdate = true;
    if (leafRef.current!.instanceColor) leafRef.current!.instanceColor.needsUpdate = true;
  }, [trees, cards, seed]);

  return (
    <group name="realistic-trees">
      <instancedMesh
        ref={trunkRef}
        args={[geos.trunk, mats.bark, trees.length]}
        castShadow
        receiveShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={limbRef}
        args={[geos.limb, mats.bark, trees.length * limbs]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={leafRef}
        args={[geos.card, mats.leaf, trees.length * cards]}
        receiveShadow
        frustumCulled={false}
      />
    </group>
  );
}

type Rect = [x1: number, z1: number, x2: number, z2: number];

/** Instanced grass tufts scattered over the lawns, avoiding anything in `avoid`. */
export function GrassField({ area, avoid, count }: { area: Rect; avoid: Rect[]; count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const n = count ?? (isMobile() ? 900 : 2400);
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: grassTexture(),
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      roughness: 1,
    });
    m.onBeforeCompile = (shader) => {
      shader.uniforms["uTime"] = { value: 0 };
      m.userData["shader"] = shader;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;")
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nfloat sway = uv.y * uv.y * 0.07;\nvec4 wp = instanceMatrix * vec4(0.0,0.0,0.0,1.0);\ntransformed.x += sin(uTime * 1.6 + wp.x * 0.35 + wp.z * 0.2) * sway;",
        );
    };
    return m;
  }, []);
  const geometry = useMemo(() => {
    // Two crossed blade cards per tuft.
    const a = new THREE.PlaneGeometry(0.5, 0.36);
    a.translate(0, 0.18, 0);
    const b = a.clone();
    b.rotateY(Math.PI / 2);
    const merged = new THREE.BufferGeometry();
    const pos = [...a.attributes["position"]!.array, ...b.attributes["position"]!.array];
    const nor = [...a.attributes["normal"]!.array, ...b.attributes["normal"]!.array];
    const uv = [...a.attributes["uv"]!.array, ...b.attributes["uv"]!.array];
    const idx = [...a.index!.array, ...Array.from(b.index!.array, (i) => i + 4)];
    merged.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    merged.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    merged.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    merged.setIndex(idx);
    return merged;
  }, []);

  useLayoutEffect(() => {
    const r = rng(29);
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    let placed = 0;
    let tries = 0;
    while (placed < n && tries < n * 20) {
      tries++;
      // Denser near the house, thinning toward the edges.
      const cx = (area[0] + area[2]) / 2;
      const cz = (area[1] + area[3]) / 2;
      const spread = Math.pow(r(), 0.8);
      const ang = r() * Math.PI * 2;
      const x = cx + Math.cos(ang) * spread * (area[2] - area[0]) * 0.5;
      const z = cz + Math.sin(ang) * spread * (area[3] - area[1]) * 0.5;
      if (x < area[0] || x > area[2] || z < area[1] || z > area[3]) continue;
      if (avoid.some(([x1, z1, x2, z2]) => x > x1 && x < x2 && z > z1 && z < z2)) continue;
      o.position.set(x, 0, z);
      o.rotation.set(0, r() * Math.PI, 0);
      const s = 0.7 + r() * 0.8;
      o.scale.set(s, s * (0.8 + r() * 0.6), s);
      o.updateMatrix();
      ref.current!.setMatrixAt(placed, o.matrix);
      const g = 0.8 + r() * 0.35;
      col.setRGB(g * 0.95, g, g * 0.85);
      ref.current!.setColorAt(placed, col);
      placed++;
    }
    ref.current!.count = placed;
    ref.current!.instanceMatrix.needsUpdate = true;
    if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
  }, [area, avoid, n]);

  useFrame(({ clock }) => {
    const sh = material.userData["shader"] as
      { uniforms: { uTime: { value: number } } } | undefined;
    if (sh && !world.get().reduced) sh.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <instancedMesh
      ref={ref}
      name="grass-tufts"
      args={[geometry, material, n]}
      receiveShadow
      frustumCulled={false}
    />
  );
}
