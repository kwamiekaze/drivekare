// Customers waiting in the /lot parking lot. Service names match
// site.booking.services so the Book button opens on the right one.
import { site } from "./site";

export type JobKind = "tire" | "battery" | "oil" | "diagnostics" | "detailing" | "brakes";

export interface Customer {
  id: string;
  kind: JobKind;
  /** First name and car, as it would read on a work order. */
  owner: string;
  car: string;
  /** What is wrong, in the customer's words. */
  issue: string;
  /** What the bear does about it. */
  fix: string;
  /** Short status chips on the card. */
  chips: readonly string[];
  /** Service name in site.booking.services. */
  service: string;
  /** Short label for the pin and the rail. */
  label: string;
  from: string;
  /** Parked spot: column index 0..5 and slot 0..11 counted from the north end. */
  col: number;
  slot: number;
  body: "sedan" | "hatch" | "suv" | "pickup";
  color: string;
  /** What the bear says while he works, in order. */
  says: readonly [arrive: string, working: string, done: string];
}

const priceOf = (name: string) => site.services.items.find((s) => s.name === name)?.from ?? "";

export const CUSTOMERS: Customer[] = [
  {
    id: "maya",
    kind: "tire",
    owner: "Maya",
    car: "Hatchback",
    issue: "Rear tire is flat and she has a meeting in an hour.",
    fix: "Jacks the car, swaps in the spare, torques the lugs and checks pressure.",
    chips: ["Flat repair", "Rotation & balance", "Tread audit"],
    service: "Tire Service",
    label: "Flat tire",
    from: priceOf("Tire Service"),
    col: 1,
    slot: 3,
    body: "hatch",
    color: "#c93a2e",
    says: ["Flat? I got you.", "Lugs on, torque set.", "Rolling again!"],
  },
  {
    id: "dre",
    kind: "battery",
    owner: "Dre",
    car: "SUV",
    issue: "Hazards on, dash dead. It will not turn over.",
    fix: "Load-tests the battery, boosts it on the spot and checks the alternator.",
    chips: ["Diagnostic test", "On-site jump or swap", "Alternator check"],
    service: "Battery & Electrical",
    label: "Dead battery",
    from: priceOf("Battery & Electrical"),
    col: 2,
    slot: 8,
    body: "suv",
    color: "#2c3a4f",
    says: ["Jump pack, ready.", "Clamps on. Charging.", "She's alive!"],
  },
  {
    id: "priya",
    kind: "oil",
    owner: "Priya",
    car: "Sedan",
    issue: "Oil light came on, and the last change was 9,000 miles ago.",
    fix: "Drains the old oil, fits a new filter, fills full synthetic and tops off fluids.",
    chips: ["Full synthetic swap", "Filter replacement", "Fluid top-off"],
    service: "Oil & Fluids",
    label: "Oil change",
    from: priceOf("Oil & Fluids"),
    col: 3,
    slot: 4,
    body: "sedan",
    color: "#e9ebef",
    says: ["Popping the hood.", "Draining. New filter.", "Fresh oil, full!"],
  },
  {
    id: "sam",
    kind: "diagnostics",
    owner: "Sam",
    car: "Hatchback",
    issue: "The check engine light is on and the car idles rough.",
    fix: "Reads the codes, decodes them and hands over a plain-English repair roadmap.",
    chips: ["OBD-II scan", "Fault code decode", "Repair roadmap"],
    service: "Diagnostics",
    label: "Check engine",
    from: priceOf("Diagnostics"),
    col: 4,
    slot: 9,
    body: "hatch",
    color: "#2a6fb8",
    says: ["Plugging in.", "Reading the codes…", "Found it. Zero faults."],
  },
  {
    id: "jules",
    kind: "detailing",
    owner: "Jules",
    car: "Sedan",
    issue: "Two months of road dust, and a client dinner tonight.",
    fix: "Foam wash, hand dry, wax and a ceramic top-coat, right where it sits.",
    chips: ["Hand wash & wax", "Interior deep clean", "Ceramic top-coat"],
    service: "Mobile Detailing",
    label: "Detailing",
    from: priceOf("Mobile Detailing"),
    col: 5,
    slot: 2,
    body: "sedan",
    color: "#1b1d22",
    says: ["Suds up!", "Foam, rinse, shine.", "Mirror finish!"],
  },
  {
    id: "marcus",
    kind: "brakes",
    owner: "Marcus",
    car: "Pickup",
    issue: "Brakes squeal and the pedal feels soft on the way down the hill.",
    fix: "Pulls a wheel, measures the pads and rotors and fits new pads and hardware.",
    chips: ["Pads & rotors", "Suspension & steering", "Underbody inspection"],
    service: "Brakes & Suspension",
    label: "Squealing brakes",
    from: "",
    col: 0,
    slot: 7,
    body: "pickup",
    color: "#7a2230",
    says: ["Brakes, let's see.", "Pads are toast. New ones in.", "Stops on a dime!"],
  },
];
