import { Html, Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  CatmullRomCurve3, Color, Group, InstancedMesh, MathUtils, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, TubeGeometry, Vector3,
} from "three";
import type { Customer } from "@/content/lot";
import { DkBear } from "../garage/DkBear";
import { Wrench } from "../garage/tools";
import { arrivalPath, customerPose, departurePath, rng, SW, yawOf } from "./layout";
import { lotStore, stepOf, useLot, type Phase } from "./store";
import { themeAt } from "./theme";
import { bodyDims, newPaint, ParkedCar, SprinterVan, beaconMat, type CarHandles, type VanHandles } from "./Vehicles";
import { mats } from "./Ground";
import { Pin } from "./Pin";

/** The bear model's nose points along +z; turn it if the model turns out to face the other way. */
const BEAR_YAW = 0;
const BEAR_H = 2.05;
const WALK = 2.2;
const WORK = 8.5;
const WRAP = 4.2;

const smooth = (x: number) => MathUtils.smoothstep(x, 0, 1);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const between = (x: number, a: number, b: number) => clamp01((x - a) / (b - a));

const tmpP = new Vector3();
const tmpT = new Vector3();
const dummy = new Object3D();
const DIRTY = new Color("#8d7c62");

const sparkColor = {
  tire: "#ffd9a0", battery: "#ffe45c", oil: "#ffb347", diagnostics: "#7ae7ff", detailing: "#ffffff", brakes: "#ff9a3c",
} as const;

export function Job({ customer: c, reducedMotion }: { customer: Customer; reducedMotion: boolean }) {
  const store = useLot();
  const job = store.jobs[c.id]!;
  const pose = useMemo(() => customerPose(c.id), [c.id]);
  const arrive = useMemo(() => arrivalPath(c.id), [c.id]);
  const leave = useMemo(() => departurePath(c.id), [c.id]);
  const dims = bodyDims(c.body);
  const facing = pose.col.facing;
  const toVan = pose.toVan;

  const paint = useMemo(() => newPaint(c.color), [c.color]);
  const lights = useMemo(
    () => ({
      head: new MeshStandardMaterial({ color: "#f4f7ff", emissive: "#dbe8ff", emissiveIntensity: 0.1, toneMapped: false }),
      tail: new MeshStandardMaterial({ color: "#5a0b0b", emissive: "#ff2a1a", emissiveIntensity: 0.3, toneMapped: false }),
      hazard: new MeshStandardMaterial({ color: "#6a3b00", emissive: "#ff9a1a", emissiveIntensity: 0, toneMapped: false }),
    }),
    [],
  );
  const ring = useMemo(() => new MeshBasicMaterial({ color: "#F08A1D", transparent: true, opacity: 0.8, toneMapped: false, depthWrite: false }), []);
  const scan = useMemo(() => new MeshBasicMaterial({ color: "#6fe7ff", transparent: true, opacity: 0.0, toneMapped: false, depthWrite: false, side: 2 }), []);
  const carH = useRef<CarHandles>({ wheels: [] }).current;
  const vanH = useRef<VanHandles>({ wheels: [] }).current;
  const tilt = useRef<Group>(null);
  const vanRef = useRef<Group>(null);
  const bearRef = useRef<Group>(null);
  const toolRef = useRef<Group>(null);
  const ringRef = useRef<Mesh>(null);
  const flatTire = useRef<Group>(null);
  const jack = useRef<Group>(null);
  const caliper = useRef<Group>(null);
  const kit = useRef<Group>(null);
  const stream = useRef<Mesh>(null);
  const scanPlane = useRef<Mesh>(null);
  const scanBox = useRef<Mesh>(null);
  const foam = useRef<InstancedMesh>(null);
  const bubbles = useRef<InstancedMesh>(null);
  const confetti = useRef<Group>(null);
  const beam = useRef<Mesh>(null);
  const readout = useRef<HTMLDivElement>(null);
  const local = useRef({ phase: "issue" as Phase, t: 0, dist: 0, lastReadout: -1 });

  // which wheel is the work wheel: rear (tire) or front (brakes), on the van side
  const sSide = (toVan * facing) as 1 | -1;
  const wheelIdx = (c.kind === "brakes" ? 0 : 2) + (sSide === -1 ? 0 : 1);
  const wz = dims.W / 2 - 0.1;
  const wheelLocal = useMemo(() => new Vector3((c.kind === "brakes" ? 1 : -1) * dims.wb / 2, dims.wr, sSide * wz), [c.kind, dims, sSide, wz]);

  const bx = useMemo(() => {
    const k = c.kind;
    return k === "tire" ? -dims.wb / 2 : k === "brakes" ? dims.wb / 2 : k === "battery" ? dims.L / 2 - 1.1 : k === "oil" ? dims.L / 2 - 1.5 : k === "diagnostics" ? 0.2 : 0;
  }, [c.kind, dims]);

  const workZ = pose.carPos.z + toVan * (dims.W / 2 + 0.5);
  const doorWorld = useMemo(() => new Vector3(pose.vanPos.x + facing * 0.5, 0, pose.vanPos.z - toVan * 1.45), [pose, facing, toVan]);
  const reverseLen = arrive.length - arrive.cornerStart;
  /** local side of the van that faces the customer's car */
  const doorSide = (-toVan * facing) as 1 | -1;

  // cables for the jump start, static geometry in world space
  const cables = useMemo(() => {
    if (c.kind !== "battery") return null;
    const a = new Vector3(pose.carPos.x + facing * (dims.L / 2 + 0.35), 0.12, workZ);
    const b = new Vector3(pose.carPos.x + facing * (dims.L / 2 - 0.85), dims.hf + 0.15, pose.carPos.z + toVan * 0.45);
    return [0, 1].map((i) => {
      const off = (i - 0.5) * 0.2;
      const mid = a.clone().lerp(b, 0.5).add(new Vector3(0, 0.25 + i * 0.1, off));
      return new TubeGeometry(new CatmullRomCurve3([a.clone().add(new Vector3(0, 0, off)), mid, b.clone().add(new Vector3(0, 0, off * 0.5))]), 16, 0.022, 6, false);
    });
  }, [c.kind, pose, facing, dims, workZ, toVan]);

  const foamSeeds = useMemo(() => {
    const r = rng(c.id.length * 31 + 5);
    return Array.from({ length: 170 }, () => ({
      x: (r() - 0.5) * dims.L * 0.92, z: (r() - 0.5) * dims.W * 0.88, s: 0.12 + r() * 0.2, k: r(),
    }));
  }, [c.id, dims]);

  useEffect(() => {
    if (c.kind === "detailing") {
      paint.color.copy(DIRTY);
      paint.clearcoat = 0.1;
      paint.roughness = 0.75;
    }
  }, [c.kind, paint]);

  useFrame((state, dt0) => {
    const dt = stepOf(dt0);
    const time = state.clock.elapsedTime;
    const live = lotStore.jobs[c.id]!;
    const L = local.current;
    if (live.phase !== L.phase) {
      L.phase = live.phase;
      L.t = 0;
    }
    L.t += dt;
    const phase = L.phase;
    const th = themeAt(lotStore.day);
    const van = vanRef.current;
    const bear = bearRef.current;
    let p = phase === "working" ? clamp01((L.t - WALK) / WORK) : phase === "issue" || phase === "enroute" ? 0 : 1;
    live.progress = p;

    /* ---- the van ---- */
    let vanVisible = false;
    let braking = false;
    if (van) {
      if (phase === "enroute") {
        const D = MathUtils.clamp(arrive.length / 12, 5.5, 9);
        const tau = clamp01(L.t / D);
        const u = 1 - Math.pow(1 - tau, 2.1);
        arrive.curve.getPointAt(u, tmpP);
        arrive.curve.getTangentAt(u, tmpT);
        van.position.copy(tmpP);
        van.rotation.y = yawOf(tmpT.x, tmpT.z);
        vanVisible = true;
        braking = tau > 0.55;
        L.dist += (1 - tau) * 20 * dt;
        if (tau >= 1) lotStore.setPhase(c.id, "working");
      } else if (phase === "working" || phase === "wrapup") {
        van.position.copy(pose.vanPos);
        van.rotation.y = facing === 1 ? 0 : Math.PI;
        vanVisible = true;
      } else if (phase === "leaving") {
        const R = MathUtils.clamp(reverseLen / 3.4, 1.8, 3);
        const F = MathUtils.clamp(leave.length / 11, 6, 11);
        vanVisible = true;
        if (L.t < R) {
          const u = 1 - smooth(L.t / R) * (reverseLen / arrive.length);
          arrive.curve.getPointAt(u, tmpP);
          arrive.curve.getTangentAt(u, tmpT);
          van.position.copy(tmpP);
          van.rotation.y = yawOf(tmpT.x, tmpT.z);
          L.dist -= 3 * dt;
          braking = true;
        } else {
          const tau = clamp01((L.t - R) / F);
          const u = Math.pow(tau, 1.7);
          leave.curve.getPointAt(u, tmpP);
          leave.curve.getTangentAt(u, tmpT);
          van.position.copy(tmpP);
          van.rotation.y = yawOf(tmpT.x, tmpT.z);
          L.dist += (0.4 + tau * 12) * dt;
          if (tau >= 1) lotStore.setPhase(c.id, "done");
        }
      }
      van.visible = vanVisible;
      const spin = L.dist / 0.4;
      vanH.wheels.forEach((w) => w && (w.rotation.z = -spin));
      // door slides open while the bear is out
      const open = phase === "working" ? smooth(L.t / 0.7) : phase === "wrapup" ? 1 - smooth((L.t - 3.4) / 0.6) : 0;
      if (vanH.door) {
        vanH.door.position.x = 0.5 - open * 1.15;
        vanH.door.position.z = doorSide * (1.045 + open * 0.12);
      }
      beaconMat.color.setScalar(vanVisible ? 0.4 + (Math.sin(time * 9) > 0 ? 2.4 : 0) : 0.4);
    }
    // headlight glow on the ground at night
    if (beam.current) {
      beam.current.visible = vanVisible && th.lamps > 0.05;
      (beam.current.material as MeshBasicMaterial).opacity = th.lamps * (braking ? 0.25 : 0.65);
    }

    /* ---- the bear ---- */
    let bearVisible = false;
    let line: number | null = null;
    if (bear) {
      const aim = facing; // keep the linter calm about unused closures
      void aim;
      const faceCar = (-toVan > 0 ? 0 : Math.PI) + BEAR_YAW;
      const workX = pose.carPos.x + facing * (c.kind === "detailing" ? Math.sin(p * Math.PI * 3) * 1.5 : bx);
      if (phase === "working") {
        if (L.t < WALK) {
          const w = smooth(clamp01((L.t - 0.5) / (WALK - 0.5)));
          bear.position.set(MathUtils.lerp(doorWorld.x, workX, w), Math.abs(Math.sin(time * 8)) * 0.07 * (w > 0 && w < 1 ? 1 : 0), MathUtils.lerp(doorWorld.z, workZ, w));
          bear.rotation.y = L.t < 0.5 ? faceCar : Math.atan2(workX - doorWorld.x, workZ - doorWorld.z) * (w < 0.85 ? 1 : 0.2) + faceCar * (w < 0.85 ? 0 : 0.8) + BEAR_YAW * 0;
          if (w >= 0.85) bear.rotation.y = faceCar;
          bearVisible = L.t > 0.45;
          line = 0;
        } else {
          const lean = 0.1 + 0.08 * Math.sin(time * 5);
          bear.position.set(workX, 0, workZ - toVan * 0.0 + -toVan * lean);
          bear.rotation.y = faceCar;
          bear.rotation.z = Math.sin(time * 7.5) * 0.04;
          bearVisible = true;
          line = p < 0.9 ? 1 : 2;
        }
      } else if (phase === "wrapup") {
        bearVisible = L.t < 3.6;
        if (L.t < 1.8) {
          const k = L.t / 1.8;
          bear.position.set(workX, Math.abs(Math.sin(k * Math.PI * 3)) * 0.4, workZ);
          bear.rotation.y = faceCar + smooth(k) * Math.PI * 2;
          bear.rotation.z = 0;
          line = 2;
        } else {
          const w = smooth(clamp01((L.t - 1.8) / 1.5));
          bear.position.set(MathUtils.lerp(workX, doorWorld.x, w), Math.abs(Math.sin(time * 8)) * 0.07 * (w > 0 && w < 1 ? 1 : 0), MathUtils.lerp(workZ, doorWorld.z, w));
          bear.rotation.y = Math.atan2(doorWorld.x - workX, doorWorld.z - workZ);
          line = L.t < 2.6 ? 2 : null;
        }
      }
      bear.visible = bearVisible;
      if (phase !== "working" && phase !== "wrapup") line = null;
      if (toolRef.current) {
        const working = phase === "working" && L.t > WALK;
        const swing = working ? Math.sin(time * 9) : 0;
        toolRef.current.rotation.z = c.kind === "tire" || c.kind === "brakes" ? swing * 0.45 : c.kind === "detailing" ? swing * 0.12 : 0;
        toolRef.current.visible = phase === "working" || (phase === "wrapup" && L.t > 1.8);
      }
    }
    lotStore.setLine(c.id, line);

    /* ---- the customer's car ---- */
    let roll = 0;
    let hood = 0;
    let headOn = 0;
    let hazard = 0;
    let carFlash = 0;
    const done = phase === "done" || phase === "leaving" || phase === "wrapup";
    const doneT = phase === "done" ? L.t : phase === "leaving" ? 0 : phase === "wrapup" ? 0 : -1;
    const wheel = carH.wheels[wheelIdx];

    switch (c.kind) {
      case "tire": {
        const lifted = between(p, 0.05, 0.2) * (1 - between(p, 0.8, 0.95));
        roll = lifted * 0.1;
        if (wheel) {
          const flat = !done && !(phase === "working" && p > 0.5);
          wheel.visible = !(phase === "working" && p > 0.3 && p < 0.5);
          wheel.scale.y = flat ? 0.78 : 1;
          wheel.position.y = dims.wr * (flat ? 0.78 : 1) + lifted * 0.06;
          if (phase === "working" && p > 0.5 && p < 0.62) wheel.scale.setScalar(1 + Math.sin((p - 0.5) / 0.12 * Math.PI) * 0.12);
        }
        if (flatTire.current) flatTire.current.visible = phase === "working" ? p > 0.32 : done;
        if (jack.current) jack.current.visible = phase === "working" && p > 0.05 && p < 0.95;
        break;
      }
      case "brakes": {
        const lifted = between(p, 0.05, 0.2) * (1 - between(p, 0.85, 0.97));
        roll = lifted * 0.1;
        if (wheel) {
          wheel.visible = !(phase === "working" && p > 0.2 && p < 0.8);
          wheel.position.y = dims.wr + lifted * 0.06;
        }
        if (caliper.current) {
          caliper.current.visible = phase === "working" && p > 0.2 && p < 0.8;
          const glow = 1 - between(p, 0.3, 0.8);
          caliper.current.traverse((o) => {
            const m = (o as Mesh).material as MeshStandardMaterial | undefined;
            if (m && "emissiveIntensity" in m && m.emissive) m.emissiveIntensity = 0.2 + glow * 2.6;
          });
        }
        if (jack.current) jack.current.visible = phase === "working" && p > 0.05 && p < 0.95;
        break;
      }
      case "battery": {
        const alive = done || (phase === "working" && p > 0.8);
        if (!alive) {
          hazard = phase === "working" && p > 0.1 ? 0 : Math.sin(time * 4.2) > 0.2 && Math.sin(time * 1.1) > -0.6 ? 1 : 0;
          headOn = -0.1;
        } else {
          const t2 = phase === "working" ? (p - 0.8) / 0.2 : 1;
          headOn = phase === "working" ? (Math.sin(t2 * Math.PI * 6) > 0 ? 1 : 0.2) : 0.15 + (phase === "done" && L.t < 3 ? (Math.sin(L.t * 9) > 0 ? 0.8 : 0) : 0);
          carFlash = 0;
        }
        if (kit.current) kit.current.visible = phase === "working" || phase === "wrapup" ? p > 0 || L.t > 1.2 : false;
        break;
      }
      case "oil": {
        hood = p < 0.5 ? smooth(between(p, 0, 0.12)) : 1 - smooth(between(p, 0.88, 1));
        if (phase === "wrapup" || phase === "leaving" || phase === "done") hood = 0;
        if (kit.current) kit.current.visible = phase === "working" && p > 0.1 && p < 0.9;
        if (stream.current) {
          const flow = between(p, 0.28, 0.35) * (1 - between(p, 0.55, 0.62));
          stream.current.scale.y = Math.max(0.001, flow);
          stream.current.visible = flow > 0.01;
        }
        break;
      }
      case "diagnostics": {
        const active = phase === "working" && p > 0.05 && p < 0.92;
        const sweep = Math.abs(((p * 2.4) % 2) - 1);
        if (scanPlane.current) {
          scanPlane.current.visible = active;
          scanPlane.current.position.x = pose.carPos.x + facing * (sweep * 1.0 * dims.L - dims.L / 2);
        }
        if (scanBox.current) scanBox.current.visible = active;
        scan.opacity = active ? 0.28 + 0.1 * Math.sin(time * 14) : 0;
        if (readout.current) {
          const stage = phase === "issue" || phase === "enroute" ? 0 : p < 0.3 ? 1 : p < 0.6 ? 2 : p < 0.9 ? 3 : 4;
          if (stage !== L.lastReadout) {
            L.lastReadout = stage;
            readout.current.textContent = ["", "Reading codes…", "P0301  cylinder 1 misfire", "P0420  catalyst efficiency", "0 faults. All clear."][stage] ?? "";
            readout.current.style.opacity = stage ? "1" : "0";
          }
        }
        break;
      }
      case "detailing": {
        const clean = phase === "done" || phase === "leaving" || phase === "wrapup" ? 1 : smooth(between(p, 0.3, 0.92));
        paint.color.lerpColors(DIRTY, new Color(c.color), clean);
        paint.clearcoat = MathUtils.lerp(0.1, 0.9, clean);
        paint.roughness = MathUtils.lerp(0.75, 0.28, clean);
        paint.emissive.setRGB(1, 1, 1).multiplyScalar(phase === "working" ? Math.max(0, Math.sin(between(p, 0.86, 1) * Math.PI)) * 0.25 : 0);
        const amount = phase === "working" ? smooth(between(p, 0.03, 0.4)) * (1 - smooth(between(p, 0.6, 0.88))) : 0;
        if (foam.current) {
          foam.current.visible = amount > 0.01;
          foamSeeds.forEach((f, i) => {
            const topY = dims.hb + 0.04 + (Math.abs(f.x) < dims.L * 0.3 ? (dims.H - dims.hb) * (1 - Math.abs(f.z) / dims.W) * 0.9 : 0);
            dummy.position.set(pose.carPos.x + f.x, topY, pose.carPos.z + f.z);
            const w = Math.min(1, amount * (0.6 + f.k * 0.8));
            dummy.scale.set(f.s * w * 1.5, f.s * w, f.s * w * 1.5);
            dummy.updateMatrix();
            foam.current!.setMatrixAt(i, dummy.matrix);
          });
          foam.current.instanceMatrix.needsUpdate = true;
        }
        if (bubbles.current) {
          const on = phase === "working" && p > 0.05 && p < 0.95;
          bubbles.current.visible = on;
          if (on)
            for (let i = 0; i < 40; i += 1) {
              const f = foamSeeds[i]!;
              const ph = (time * (0.25 + f.k * 0.3) + f.k * 9) % 1;
              dummy.position.set(pose.carPos.x + f.x * 1.1, 0.6 + ph * 3.2, pose.carPos.z + f.z * 1.6 + Math.sin(time + i) * 0.3);
              const s = 0.05 + f.s * 0.4 * Math.sin(ph * Math.PI);
              dummy.scale.setScalar(s);
              dummy.updateMatrix();
              bubbles.current.setMatrixAt(i, dummy.matrix);
            }
          bubbles.current.instanceMatrix.needsUpdate = true;
        }
        break;
      }
    }
    // pose of the car
    if (tilt.current) {
      tilt.current.rotation.x = -sSide * roll;
      tilt.current.position.y = Math.abs(Math.sin(roll)) * wz;
    }
    if (carH.hood) carH.hood.rotation.z = hood * 1.05;
    // lights: dead battery stays dark, otherwise the usual night glow
    lights.head.emissiveIntensity = headOn < 0 ? 0 : 0.1 + (headOn > 0 ? headOn * 4 : 0);
    lights.tail.emissiveIntensity = headOn < 0 ? 0.03 : 0.25 + th.lamps * 0.5 + (headOn > 0 ? headOn * 1.5 : 0);
    lights.hazard.emissiveIntensity = hazard * 5;
    void carFlash;
    void doneT;

    /* ---- ring, tools, confetti ---- */
    const target = phase === "done" ? "#39e07a" : phase === "issue" ? "#F08A1D" : "#59c8ff";
    ring.color.set(target);
    const hot = lotStore.hovered === c.id || lotStore.selected === c.id;
    ring.opacity = phase === "done" ? 0.5 + 0.2 * Math.sin(time * 2) : 0.45 + 0.35 * Math.sin(time * 3.2) + (hot ? 0.2 : 0);
    if (ringRef.current) ringRef.current.visible = phase !== "leaving";
    if (confetti.current) confetti.current.visible = phase === "wrapup" || (phase === "done" && L.t < 3.5);

    if (kit.current && c.kind === "oil") kit.current.position.set(pose.carPos.x + facing * 1.2, 0, pose.carPos.z + toVan * 1.15);

    // where the camera should look: the van while it travels, the pair otherwise
    if (phase === "enroute" || phase === "leaving") live.focus.copy(van?.position ?? pose.carPos);
    else live.focus.set(pose.carPos.x, 0.8, (pose.carPos.z + pose.vanPos.z) / 2);
  });

  const pinPos: [number, number, number] = [pose.carPos.x, dims.H + 1.3, pose.carPos.z];
  const select = (e: { stopPropagation: () => void; delta?: number }) => {
    if ((e.delta ?? 0) > 6) return;
    e.stopPropagation();
    lotStore.select(c.id);
  };

  return (
    <group>
      {/* customer's car */}
      <group
        position={[pose.carPos.x, 0, pose.carPos.z]}
        rotation={[0, pose.yaw, 0]}
        onClick={select}
        onPointerOver={(e) => {
          e.stopPropagation();
          lotStore.hover(c.id);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          lotStore.hover(null);
          document.body.style.cursor = "";
        }}
      >
        <group ref={tilt}>
          <ParkedCar body={c.body} paint={paint} hoodCut={c.kind === "oil"} lights={lights} handles={carH} />
        </group>
      </group>

      {/* status ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[pose.carPos.x, 0.05, pose.carPos.z]} scale={[dims.L / 2 + 0.7, dims.W / 2 + 0.55, 1]} material={ring}>
        <ringGeometry args={[0.965, 1, 64]} />
      </mesh>

      {/* the DriveKare van */}
      <group ref={vanRef} visible={false}>
        <SprinterVan doorSide={doorSide} handles={vanH} />
        <mesh ref={beam} rotation={[-Math.PI / 2, 0, 0]} position={[7.5, 0.04, 0]} scale={[1, 0.75, 1]} visible={false}>
          <planeGeometry args={[11, 7]} />
          <meshBasicMaterial map={mats.pool.map} transparent depthWrite={false} blending={2} color="#fff0d8" toneMapped={false} opacity={0.5} />
        </mesh>
      </group>

      {/* the bear */}
      <group ref={bearRef} visible={false}>
        <DkBear height={BEAR_H} reducedMotion={reducedMotion} />
        <Html position={[0, BEAR_H + 0.45, 0]} center zIndexRange={[25, 0]} style={{ pointerEvents: "none" }}>
          {job.line !== null && <div className="lot-bubble">{c.says[job.line]}</div>}
        </Html>
        <group ref={toolRef} position={[0.42, 0.85, 0.42]}>
          {(c.kind === "tire" || c.kind === "brakes") && <Wrench length={0.55} rotation={[0, 0, 0.7]} />}
          {c.kind === "battery" && (
            <mesh castShadow>
              <boxGeometry args={[0.3, 0.22, 0.2]} />
              <meshStandardMaterial color="#f08a1d" roughness={0.5} />
            </mesh>
          )}
          {c.kind === "oil" && (
            <mesh castShadow>
              <cylinderGeometry args={[0.09, 0.1, 0.34, 14]} />
              <meshStandardMaterial color="#d8a436" roughness={0.4} metalness={0.4} />
            </mesh>
          )}
          {c.kind === "diagnostics" && (
            <group>
              <mesh castShadow>
                <boxGeometry args={[0.2, 0.3, 0.05]} />
                <meshStandardMaterial color="#14171d" roughness={0.5} />
              </mesh>
              <mesh position={[0, 0.03, 0.03]}>
                <planeGeometry args={[0.16, 0.2]} />
                <meshBasicMaterial color={new Color(0.3, 2, 2.4)} toneMapped={false} />
              </mesh>
            </group>
          )}
          {c.kind === "detailing" && (
            <group rotation={[Math.PI / 2.4, 0, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.05, 0.06, 0.34, 12]} />
                <meshStandardMaterial color="#f08a1d" roughness={0.45} />
              </mesh>
              <mesh position={[0, 0.2, 0]}>
                <cylinderGeometry args={[0.025, 0.04, 0.1, 10]} />
                <meshStandardMaterial color="#cfd5dc" metalness={0.9} roughness={0.3} />
              </mesh>
            </group>
          )}
        </group>
      </group>

      {/* per-job props */}
      {c.kind === "tire" && (
        <>
          <group ref={flatTire} visible={false} position={[pose.carPos.x + facing * (-dims.wb / 2 - 0.5), dims.wr * 0.16, pose.carPos.z + toVan * (dims.W / 2 + 0.9)]} rotation={[Math.PI / 2 - 0.15, 0.4, 0]}>
            <mesh castShadow>
              <torusGeometry args={[dims.wr * 0.78, 0.13, 10, 24]} />
              <meshStandardMaterial color="#141518" roughness={0.9} />
            </mesh>
          </group>
          <group ref={jack} visible={false} position={[wheelLocal.x * facing + pose.carPos.x - facing * 0.05, 0, pose.carPos.z + toVan * (dims.W / 2 - 0.25)]}>
            <mesh position={[0, 0.1, 0]} castShadow>
              <boxGeometry args={[0.5, 0.2, 0.3]} />
              <meshStandardMaterial color="#f08a1d" roughness={0.45} metalness={0.3} />
            </mesh>
          </group>
        </>
      )}
      {c.kind === "brakes" && (
        <>
          <group ref={jack} visible={false} position={[pose.carPos.x + facing * (dims.wb / 2), 0, pose.carPos.z + toVan * (dims.W / 2 - 0.25)]}>
            <mesh position={[0, 0.1, 0]} castShadow>
              <boxGeometry args={[0.5, 0.2, 0.3]} />
              <meshStandardMaterial color="#f08a1d" roughness={0.45} metalness={0.3} />
            </mesh>
          </group>
          <group ref={caliper} visible={false} position={[pose.carPos.x + facing * (dims.wb / 2), dims.wr, pose.carPos.z + toVan * (dims.W / 2 - 0.1)]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.27, 0.27, 0.03, 28]} />
              <meshStandardMaterial color="#9aa1aa" emissive="#ff6a1a" emissiveIntensity={2} metalness={0.8} roughness={0.35} toneMapped={false} />
            </mesh>
            <mesh position={[0.2, 0.05, 0.04 * toVan]}>
              <boxGeometry args={[0.16, 0.2, 0.1]} />
              <meshStandardMaterial color="#d4251f" emissive="#ff2a1a" emissiveIntensity={0.6} roughness={0.4} />
            </mesh>
          </group>
        </>
      )}
      {c.kind === "battery" && cables && (
        <group ref={kit} visible={false}>
          <mesh position={[pose.carPos.x + facing * (dims.L / 2 + 0.35), 0.11, workZ]} castShadow>
            <boxGeometry args={[0.32, 0.22, 0.2]} />
            <meshStandardMaterial color="#f08a1d" roughness={0.5} />
          </mesh>
          {cables.map((g, i) => (
            <mesh key={i} geometry={g}>
              <meshStandardMaterial color={i ? "#161616" : "#c8261d"} roughness={0.6} />
            </mesh>
          ))}
          <Sparkles count={26} scale={[0.5, 0.4, 0.5]} size={5} speed={2.4} color={sparkColor.battery} position={[pose.carPos.x + facing * (dims.L / 2 - 0.85), dims.hf + 0.25, pose.carPos.z + toVan * 0.45]} />
        </group>
      )}
      {c.kind === "oil" && (
        <group ref={kit} visible={false}>
          <mesh position={[0, 0.07, 0]} castShadow>
            <cylinderGeometry args={[0.38, 0.32, 0.14, 24]} />
            <meshStandardMaterial color="#1a1b1e" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.33, 24]} />
            <meshStandardMaterial color="#c88a1c" metalness={0.3} roughness={0.12} emissive="#8a5a08" emissiveIntensity={0.4} />
          </mesh>
        </group>
      )}
      {c.kind === "oil" && (
        <mesh
          ref={stream}
          visible={false}
          position={[pose.carPos.x + facing * (dims.L / 2 - 0.9), dims.hb + 0.45, pose.carPos.z + toVan * 0.4]}
        >
          <cylinderGeometry args={[0.02, 0.02, 0.9, 8]} />
          <meshStandardMaterial color="#e6a526" emissive="#a86a08" emissiveIntensity={0.7} />
        </mesh>
      )}
      {c.kind === "diagnostics" && (
        <>
          <mesh ref={scanPlane} visible={false} position={[pose.carPos.x, 0.85, pose.carPos.z]} rotation={[0, Math.PI / 2, 0]} material={scan}>
            <planeGeometry args={[dims.W + 1.2, 1.9]} />
          </mesh>
          <mesh ref={scanBox} visible={false} position={[pose.carPos.x, dims.H / 2 + 0.1, pose.carPos.z]}>
            <boxGeometry args={[dims.L + 0.5, dims.H + 0.2, dims.W + 0.4]} />
            <meshBasicMaterial color="#6fe7ff" wireframe transparent opacity={0.28} toneMapped={false} depthWrite={false} />
          </mesh>
          <Html position={[pose.carPos.x, dims.H + 2.5, pose.carPos.z]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
            <div ref={readout} className="lot-readout" style={{ opacity: 0 }} />
          </Html>
        </>
      )}
      {c.kind === "detailing" && (
        <>
          <instancedMesh ref={foam} args={[undefined, undefined, 170]} visible={false} frustumCulled={false}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </instancedMesh>
          <instancedMesh ref={bubbles} args={[undefined, undefined, 40]} visible={false} frustumCulled={false}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshPhysicalMaterial color="#dff3ff" transparent opacity={0.45} roughness={0.05} transmission={0} clearcoat={1} />
          </instancedMesh>
        </>
      )}

      {/* celebration */}
      <group ref={confetti} visible={false} position={[pose.carPos.x, 1.2, (pose.carPos.z + pose.vanPos.z) / 2]}>
        <Sparkles count={60} scale={[5, 3, 5]} size={8} speed={1.6} color={c.kind === "detailing" ? "#ffffff" : "#ffcf6a"} />
      </group>

      <Pin customer={c} position={pinPos} />
    </group>
  );
}

void SW;
void sparkColor;
void Object3D;
