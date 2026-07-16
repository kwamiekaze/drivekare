// Single source of truth for all DriveKare copy + media slots.
export type MediaSlot = {
  src?: string;
  webm?: string;
  poster?: string;
  fallback: "lightTrails" | "chromeReflect" | "roadStreaks" | "gradient";
};

export const media = {
  heroVideo: {
    src: "/videos/hero-bear-v1.mp4",
    webm: "/videos/hero-bear-v1.webm",
    poster: "/videos/hero-bear-poster-v1.jpg",
    fallback: "lightTrails",
  } as MediaSlot,
  revealVideo: { src: undefined, poster: undefined, fallback: "chromeReflect" } as MediaSlot,
  roadVideo: { src: undefined, poster: undefined, fallback: "roadStreaks" } as MediaSlot,
  heroModel: { src: "/models/dk-bear.glb" as string | undefined },
  revealBefore: { src: undefined as string | undefined },
  revealAfter: { src: undefined as string | undefined },
};

export const site = {
  brand: "DRIVEKARE",
  slogan: "Care that comes to you",
  domain: "drivekare.com",
  phone: "(555) 555-0199",
  email: "hello@drivekare.com",
  meta: {
    title: "DriveKare — Care That Comes To You",
    description:
      "Luxury mobile auto care. Detailing, oil changes, tires, batteries, and diagnostics — care that comes to you.",
  },
  splash: {
    wordmark: "DRIVEKARE",
    tagline: "CARE THAT COMES TO YOU",
    tapLabel: "TAP TO CONTINUE",
  },
  hero: {
    title: "CARE THAT COMES TO YOU",
    cta: "BOOK YOUR SERVICE",
  },
  services: {
    title: "THE GARAGE",
    kicker: "Full-service, wheels-up.",
    items: [
      { name: "Mobile Detailing", from: "from $129", bullets: ["Hand wash & wax", "Interior deep clean", "Ceramic top-coat"] },
      { name: "Oil & Fluids", from: "from $89", bullets: ["Full synthetic swap", "Filter replacement", "Fluid top-off"] },
      { name: "Tire Service", from: "from $99", bullets: ["Rotation & balance", "Flat repair", "Pressure & tread audit"] },
      { name: "Battery & Electrical", from: "from $79", bullets: ["Diagnostic test", "On-site replacement", "Alternator check"] },
      { name: "Diagnostics", from: "from $59", bullets: ["OBD-II scan", "Fault code decode", "Repair roadmap"] },
      { name: "Fleet Care", from: "custom", bullets: ["Scheduled service", "Multi-vehicle discount", "Priority dispatch"] },
    ],
  },
  about: {
    title: "THE STORY",
    body: "DriveKare is concierge auto care that meets you where life happens. Our mobile rigs roll out fully equipped so your driveway, curb, or office lot becomes the shop. Premium products. Precision technicians. Zero interruption.",
  },
  stats: [
    { value: 2500, suffix: "+", label: "Vehicles Serviced" },
    { value: 480, suffix: "+", label: "5-Star Reviews" },
    { value: 45, suffix: " MIN", label: "Avg Arrival" },
    { value: 30, suffix: " MI", label: "Service Radius" },
  ],
  area: {
    title: "WE COME TO YOU.",
    copy: "30-mile service radius. Enter your ZIP to check availability.",
  },
  contact: {
    title: "GET IN TOUCH",
    copy: "Call, text, or book online. We reply within one hour on business days.",
  },
  testimonials: {
    title: "THE OWNERS TALK.",
    items: [
      { quote: "They pulled up in a matte black rig and left my 911 looking better than delivery day.", author: "M. Alvarez", role: "Porsche 911 owner" },
      { quote: "Oil change done in my office parking lot while I was on a call. Unreal.", author: "J. Patel", role: "Model Y owner" },
      { quote: "The only service I'll let touch our fleet. Period.", author: "K. Nguyen", role: "Fleet Manager, Ridgeline Co." },
    ],
  },
  booking: {
    title: "BOOK YOUR SERVICE",
    services: [
      "Mobile Detailing",
      "Oil & Fluids",
      "Tire Service",
      "Battery & Electrical",
      "Diagnostics",
      "Fleet Care",
    ],
    successTitle: "WE'RE ROLLING YOUR WAY",
    successCopy: "Your booking is in. A DriveKare tech will confirm shortly.",
  },
  menu: [
    { key: "services", label: "SERVICES" },
    { key: "about", label: "ABOUT" },
    { key: "book", label: "BOOK" },
    { key: "contact", label: "CONTACT" },
    { key: "signin", label: "SIGN IN" },
  ],
  footer: {
    tagline: "DRIVEKARE — CARE THAT COMES TO YOU",
    legal: "© 2025 DriveKare Mobile Auto Care. All rights reserved.",
  },
} as const;

export type Site = typeof site;
