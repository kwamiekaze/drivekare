import { Color, MathUtils } from "three";

/**
 * One lot, two lightings. `d` is 0 at night and 1 at midday and everything
 * (sun, sky, lamps, headlights, bloom) is blended from it, so the slider can
 * park anywhere between the overhead photo and the floodlit one.
 */
const c = (hex: string) => new Color(hex);
const DAY = {
  skyTop: c("#8fc3ee"),
  skyLow: c("#dfeaf3"),
  sun: c("#fff4e0"),
  hemiSky: c("#d6e6ff"),
  hemiGround: c("#9a9486"),
  asphalt: c("#c9cbd1"),
  line: c("#f4f4f2"),
  grass: c("#7f9a5e"),
  concrete: c("#b4b0a6"),
  glass: c("#2b3d4c"),
};
const NIGHT = {
  skyTop: c("#050813"),
  skyLow: c("#0f1a2e"),
  sun: c("#bcd0ff"),
  hemiSky: c("#334a7a"),
  hemiGround: c("#10121a"),
  asphalt: c("#52555e"),
  line: c("#d9dde6"),
  grass: c("#2c4034"),
  concrete: c("#6b7280"),
  glass: c("#c7a45a"),
};

export interface Theme {
  d: number;
  sky: Color;
  skyLow: Color;
  sun: Color;
  sunIntensity: number;
  sunPos: [number, number, number];
  hemi: Color;
  hemiGround: Color;
  hemiIntensity: number;
  asphalt: Color;
  line: Color;
  grass: Color;
  concrete: Color;
  glass: Color;
  glassGlow: number;
  /** 0..1: lamps, headlights and window light */
  lamps: number;
  exposure: number;
  bloom: number;
  envIntensity: number;
  roughness: number;
}

const out: Theme = {
  d: 1, sky: new Color(), skyLow: new Color(), sun: new Color(), sunIntensity: 1, sunPos: [0, 0, 0],
  hemi: new Color(), hemiGround: new Color(), hemiIntensity: 1, asphalt: new Color(), line: new Color(),
  grass: new Color(), concrete: new Color(), glass: new Color(), glassGlow: 0, lamps: 0, exposure: 1, bloom: 0.3,
  envIntensity: 1, roughness: 0.9,
};

const mix = (a: Color, b: Color, t: number, to: Color) => to.copy(b).lerp(a, t);

/** Blend the palette in place. Reuses one object, so call it once per frame. */
export function themeAt(d: number): Theme {
  const t = MathUtils.smoothstep(d, 0, 1);
  out.d = d;
  mix(DAY.skyTop, NIGHT.skyTop, t, out.sky);
  mix(DAY.skyLow, NIGHT.skyLow, t, out.skyLow);
  mix(DAY.sun, NIGHT.sun, t, out.sun);
  out.sunIntensity = MathUtils.lerp(2.3, 1.1, 1 - t);
  // The sun arcs a little as the slider moves; the moon stays high and cool.
  const az = MathUtils.lerp(-0.9, -0.55, t);
  const el = MathUtils.lerp(0.7, 0.62, t);
  const r = 70;
  out.sunPos = [Math.sin(az) * Math.cos(el * 0.5) * r * 0.7, Math.sin(el) * r, Math.cos(az) * Math.cos(el * 0.5) * r * 0.7];
  mix(DAY.hemiSky, NIGHT.hemiSky, t, out.hemi);
  mix(DAY.hemiGround, NIGHT.hemiGround, t, out.hemiGround);
  out.hemiIntensity = MathUtils.lerp(0.3, 0.8, t);
  mix(DAY.asphalt, NIGHT.asphalt, t, out.asphalt);
  mix(DAY.line, NIGHT.line, t, out.line);
  mix(DAY.grass, NIGHT.grass, t, out.grass);
  mix(DAY.concrete, NIGHT.concrete, t, out.concrete);
  mix(DAY.glass, NIGHT.glass, t, out.glass);
  out.glassGlow = 1 - t;
  out.lamps = MathUtils.smoothstep(1 - d, 0.25, 0.75);
  out.exposure = MathUtils.lerp(1.0, 1.15, 1 - t);
  out.bloom = MathUtils.lerp(0.18, 0.85, 1 - t);
  out.envIntensity = MathUtils.lerp(0.85, 0.2, 1 - t);
  out.roughness = MathUtils.lerp(0.92, 0.6, 1 - t);
  return out;
}
