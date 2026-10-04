import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { RefObject } from "react";
import { useEffect, useRef } from "react";
import { ACESFilmicToneMapping, MathUtils, PerspectiveCamera, Vector3 } from "three";
import { LotScene } from "./LotScene";
import { customerPose } from "./layout";
import { lotStore, sim, stepOf } from "./store";

export interface LotInput {
  /** extra orbit angle from dragging */
  az: number;
  /** extra tilt from dragging, radians */
  pol: number;
  /** zoom, -1 (closer) .. 1 (further) */
  zoom: number;
  /** seconds since the visitor last touched anything */
  idle: number;
}

const tmp = new Vector3();

function Rig({ input, reducedMotion }: { input: RefObject<LotInput>; reducedMotion: boolean }) {
  const { camera, size } = useThree();
  const st = useRef({
    target: new Vector3(-4, 0, 3),
    az: 0.05,
    pol: 0.001,
    dist: 150,
    fov: 38,
    t: 0,
  });
  const lastSel = useRef<string | null>(null);

  useEffect(() => {
    // Look straight down on arrival, like the overhead photo, then settle into 3/4.
    st.current.t = reducedMotion ? 99 : 0;
  }, [reducedMotion]);

  useFrame((_, dt0) => {
    const dt = stepOf(dt0);
    const s = st.current;
    const i = input.current;
    s.t += dt;
    const portrait = size.width / size.height < 0.9;
    const aspect = size.width / size.height;
    const sel = lotStore.selected;
    if (sel !== lastSel.current) {
      lastSel.current = sel;
      i.az = 0;
      i.pol = 0;
      i.zoom = 0;
    }
    const fov = portrait ? 52 : 38;
    const tanH = Math.tan(MathUtils.degToRad(fov) / 2);

    let tx = -4, ty = 0, tz = 3;
    let az = portrait ? Math.PI / 2 : 0.0;
    let pol = 0.5;
    let dist: number;
    if (sel) {
      const job = lotStore.jobs[sel]!;
      const pose = customerPose(sel);
      tx = job.focus.x;
      ty = 0.6;
      tz = job.focus.z;
      const aisleSide = -pose.col.facing;
      const travelling = job.phase === "enroute" || job.phase === "leaving";
      // from the aisle, a little toward the car's far side so the bear in the gap is not hidden by the van
      az = Math.atan2(aisleSide, -pose.toVan * 0.5);
      pol = travelling ? 0.8 : 0.78;
      dist = (portrait ? 21 : 14.5) * (travelling ? 1.9 : 1);
      // keep the framing roomy on phones where the bottom sheet covers the lower part
      if (portrait) tz += 0;
    } else {
      // fit the lot (about 82 m by 54 m) into the window
      const w = portrait ? 56 : 76;
      const h = portrait ? 86 : 50;
      dist = Math.max(w / (2 * tanH * Math.min(aspect, 4)), h / (2 * tanH)) * 1.04;
      const intro = reducedMotion ? 1 : MathUtils.smootherstep(s.t, 0.4, 4.2);
      pol = MathUtils.lerp(0.001, 0.46, intro);
      dist *= MathUtils.lerp(1.25, 1, intro);
      az += (1 - intro) * 0.0;
      if (!reducedMotion && i.idle > 12) az += Math.sin(s.t * 0.12) * 0.28;
    }
    az += i.az;
    pol = MathUtils.clamp(pol + i.pol, 0.001, 1.38);
    dist *= Math.exp(i.zoom * 0.55);

    const k = sel ? 2.6 : 3.2;
    s.target.x = MathUtils.damp(s.target.x, tx, k, dt);
    s.target.y = MathUtils.damp(s.target.y, ty, k, dt);
    s.target.z = MathUtils.damp(s.target.z, tz, k, dt);
    s.az = dampAngle(s.az, az, k, dt);
    s.pol = MathUtils.damp(s.pol, pol, k, dt);
    s.dist = MathUtils.damp(s.dist, dist, k, dt);
    s.fov = MathUtils.damp(s.fov, fov, 4, dt);

    const sp = Math.sin(s.pol);
    camera.position.set(s.target.x + s.dist * sp * Math.sin(s.az), s.target.y + s.dist * Math.cos(s.pol), s.target.z + s.dist * sp * Math.cos(s.az));
    // straight down has no "up": nudge so the look-at stays stable
    camera.up.set(0, 1, 0);
    if (s.pol < 0.02) camera.up.set(Math.sin(s.az) * -1, 0, Math.cos(s.az) * -1);
    camera.lookAt(s.target);
    const cam = camera as PerspectiveCamera;
    if (Math.abs(cam.fov - s.fov) > 0.01) {
      cam.fov = s.fov;
      cam.updateProjectionMatrix();
    }
    void tmp;
  });
  return null;
}

function dampAngle(a: number, b: number, k: number, dt: number) {
  const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + d * (1 - Math.exp(-k * dt));
}

export default function LotCanvas({ input, reducedMotion, mobile }: { input: RefObject<LotInput>; reducedMotion: boolean; mobile: boolean }) {
  return (
    <Canvas
      shadows={!sim.lite}
      dpr={sim.lite ? 0.6 : [1, mobile ? 1.5 : 1.8]}
      gl={{ antialias: false, powerPreference: "high-performance", toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1 }}
      camera={{ position: [0, 140, 1], fov: 38, near: 0.5, far: 520 }}
      onPointerMissed={() => {
        /* a tap on empty asphalt keeps the current focus */
      }}
    >
      <LotScene reducedMotion={reducedMotion} mobile={mobile} />
      <Rig input={input} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
