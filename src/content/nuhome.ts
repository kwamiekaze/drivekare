// Camera stops and bay copy for the /nuhome 3D garage.
// Service names and prices come from site.ts so the two pages never drift.
import { site } from "./site";

export type ViewId = "welcome" | "detailing" | "oil" | "tires" | "battery" | "diagnostics" | "fleet";

export interface GarageView {
  id: ViewId;
  label: string;
  title: string;
  /** Service name in site.services / site.booking.services, if this bay is one. */
  service?: string;
  line?: string;
  pos: [number, number, number];
  target: [number, number, number];
  mobilePos?: [number, number, number];
  mobileTarget?: [number, number, number];
  fov?: number;
  mobileFov?: number;
  horizontalFov?: number;
}

export const VIEWS: GarageView[] = [
  {
    id: "welcome",
    label: "The Garage",
    title: site.slogan,
    line: "Everything in this garage rides with us. Pick a bay to see what we bring to your driveway.",
    pos: [0, 3.4, 13.2],
    target: [0, 2.1, -1.5],
    mobilePos: [0, 3.2, 14.5],
    mobileTarget: [0, 1.0, -1.5],
    fov: 44,
    mobileFov: 58,
  },
  {
    id: "detailing",
    label: "Detailing",
    title: "Mobile detailing",
    service: "Mobile Detailing",
    pos: [3.6, 2.2, 7.6],
    target: [8.4, 0.9, 4.4],
    mobilePos: [3.2, 2.3, 8.6],
    horizontalFov: 50,
  },
  {
    id: "oil",
    label: "Oil & Fluids",
    title: "Oil & fluids",
    service: "Oil & Fluids",
    pos: [0.4, 2.1, -6.3],
    target: [-7.2, 1.3, -8.5],
    mobilePos: [0.9, 2.2, -6.0],
    horizontalFov: 58,
  },
  {
    id: "tires",
    label: "Tires",
    title: "Tire service",
    service: "Tire Service",
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
    pos: [-3.2, 2.2, 7.4],
    target: [-8.2, 1.0, 4.4],
    mobilePos: [-3.0, 2.3, 8.2],
    horizontalFov: 50,
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    title: "Diagnostics",
    service: "Diagnostics",
    pos: [4.4, 2.3, 2.6],
    target: [9.6, 1.5, -1.8],
    mobilePos: [3.8, 2.4, 3.6],
    horizontalFov: 50,
  },
  {
    id: "fleet",
    label: "Fleet Care",
    title: "Fleet care",
    service: "Fleet Care",
    pos: [12.4, 2.3, 20.6],
    target: [8.2, 1.3, 13.2],
    mobilePos: [13.0, 2.5, 21.8],
    horizontalFov: 58,
  },
];

export function serviceFor(view: GarageView) {
  return site.services.items.find((s) => s.name === view.service);
}
