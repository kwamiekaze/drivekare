// Camera stops and bay copy for the /nuhome 3D garage.
// Service names and prices come from site.ts so the two pages never drift.
import { site } from "./site";

export type ViewId = "welcome" | "tires" | "battery" | "oil" | "lift" | "diagnostics" | "detailing";

export interface GarageView {
  id: ViewId;
  label: string;
  title: string;
  /** Service name in site.booking.services, so Book opens on it. */
  service?: string;
  line?: string;
  bullets?: readonly string[];
  pos: [number, number, number];
  target: [number, number, number];
  mobilePos?: [number, number, number];
  mobileTarget?: [number, number, number];
  fov?: number;
  mobileFov?: number;
  horizontalFov?: number;
}

const bulletsFor = (name: string) => site.services.items.find((s) => s.name === name)?.bullets ?? [];

/** Ordered as the bays stand in the garage, left to right. */
export const VIEWS: GarageView[] = [
  {
    id: "welcome",
    label: "The Garage",
    title: site.slogan,
    line: "Everything in this garage rides with us. Pick a bay, or press play to walk through them all.",
    pos: [2.5, 4.0, 26],
    target: [1.2, 3.0, 4],
    mobilePos: [1.5, 3.4, 27],
    mobileTarget: [0.6, 2.8, 4],
    fov: 46,
    mobileFov: 60,
  },
  {
    id: "tires",
    label: "Tires",
    title: "Tire service",
    service: "Tire Service",
    bullets: bulletsFor("Tire Service"),
    pos: [-4.2, 2.6, 1.6],
    target: [-9.6, 1.25, -2.6],
    mobilePos: [-3.4, 2.7, 2.6],
    horizontalFov: 52,
  },
  {
    id: "battery",
    label: "Battery",
    title: "Battery & electrical",
    service: "Battery & Electrical",
    bullets: bulletsFor("Battery & Electrical"),
    pos: [-3.6, 2.4, 3.4],
    target: [-11.2, 1.9, 5.9],
    mobilePos: [-4.2, 2.5, 3.2],
    horizontalFov: 54,
  },
  {
    id: "oil",
    label: "Oil & Fluids",
    title: "Oil & fluids",
    service: "Oil & Fluids",
    bullets: bulletsFor("Oil & Fluids"),
    pos: [0.4, 2.1, -6.3],
    target: [-7.2, 1.3, -8.5],
    mobilePos: [0.9, 2.2, -6.0],
    horizontalFov: 58,
  },
  {
    id: "lift",
    label: "On the Lift",
    title: "Brakes & suspension",
    service: "Brakes & Suspension",
    bullets: ["Pads & rotors", "Suspension & steering", "Underbody inspection"],
    pos: [1.0, 1.05, -0.6],
    target: [-3.2, 1.9, -4.6],
    mobilePos: [1.4, 1.1, 0.4],
    horizontalFov: 60,
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    title: "Diagnostics",
    service: "Diagnostics",
    bullets: bulletsFor("Diagnostics"),
    pos: [3.2, 2.3, 1.6],
    target: [8.2, 1.5, -3.4],
    mobilePos: [2.8, 2.4, 2.6],
    horizontalFov: 50,
  },
  {
    id: "detailing",
    label: "Detailing",
    title: "Mobile detailing",
    service: "Mobile Detailing",
    bullets: bulletsFor("Mobile Detailing"),
    pos: [3.6, 2.2, 7.6],
    target: [8.4, 0.9, 4.4],
    mobilePos: [3.2, 2.3, 8.6],
    horizontalFov: 50,
  },
];
