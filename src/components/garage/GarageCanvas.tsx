import { Canvas } from "@react-three/fiber";
import type { RefObject } from "react";
import { ACESFilmicToneMapping } from "three";
import { CameraRig, type RigInput } from "./CameraRig";
import { GarageScene } from "./GarageScene";
import type { GarageView } from "@/content/nuhome";

export default function GarageCanvas({
  view,
  input,
  reducedMotion,
  introStarted,
}: {
  view: GarageView;
  input: RefObject<RigInput>;
  reducedMotion: boolean;
  introStarted: boolean;
}) {
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 1.6]}
      gl={{ antialias: false, powerPreference: "high-performance", toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ position: view.pos, fov: 44, near: 0.1, far: 90 }}
    >
      <GarageScene reducedMotion={reducedMotion} />
      <CameraRig view={view} input={input} reducedMotion={reducedMotion} introStarted={introStarted} />
    </Canvas>
  );
}
