// Single source of truth for all DriveKare copy + media slots.
// Real video/model URLs arrive later; slots fall back to procedural canvas.

export type MediaSlot = {
  src?: string;
  poster?: string;
  fallback: "lightTrails" | "chromeReflect" | "roadStreaks" | "gradient";
};

export const media = {
  heroVideo: { src: undefined, poster: undefined, fallback: "lightTrails" } as MediaSlot,
  revealVideo: { src: undefined, poster: undefined, fallback: "chromeReflect" } as MediaSlot,
  roadVideo: { src: undefined, poster: undefined, fallback: "roadStreaks" } as MediaSlot,
  heroModel: { src: "/models/dk-bear.glb" as string | undefined },
  revealBefore: { src: undefined as string | undefined },
  revealAfter: { src: undefined as string | undefined },
};

export const site = {
  brand: "DRIVEKARE",
  slogan: "AUTO CARE ANYWHERE",
  domain: "drivekare.com",
  phone: "(555) 555-0199",
  meta: {
    title: "DriveKare — Auto Care Anywhere",
    description:
      "Luxury mobile auto care. Detailing, oil changes, tires, batteries, and diagnostics — we come to you.",
  },
  nav: [
    { label: "Services", href: "#services" },
    { label: "Process", href: "#process" },
    { label: "Reviews", href: "#reviews" },
    { label: "Book", href: "/book" },
  ],
  splash: {
    wordmark: "DRIVEKARE",
    tagline: "AUTO CARE ANYWHERE",
    tapLabel: "TAP TO CONTINUE",
  },
  hero: {
    eyebrow: "MOBILE AUTO CARE — EST. 2025",
    title: "AUTO CARE ANYWHERE",
    sub: "We roll to your driveway, office, or curb. Concierge-level service. Zero interruption.",
    cta: "BOOK YOUR SERVICE",
    ctaHref: "/book",
  },
  marquee: [
    "DETAIL",
    "OIL",
    "TIRES",
    "DIAGNOSTICS",
    "BATTERY",
    "WE COME TO YOU",
  ],
  services: {
    title: "THE GARAGE",
    kicker: "Full-service, wheels-up.",
    items: [
      {
        name: "Mobile Detailing",
        from: "from $129",
        bullets: ["Hand wash & wax", "Interior deep clean", "Ceramic top-coat"],
      },
      {
        name: "Oil & Fluids",
        from: "from $89",
        bullets: ["Full synthetic swap", "Filter replacement", "Fluid top-off"],
      },
      {
        name: "Tire Service",
        from: "from $99",
        bullets: ["Rotation & balance", "Flat repair", "Pressure & tread audit"],
      },
      {
        name: "Battery & Electrical",
        from: "from $79",
        bullets: ["Diagnostic test", "On-site replacement", "Alternator check"],
      },
      {
        name: "Diagnostics",
        from: "from $59",
        bullets: ["OBD-II scan", "Fault code decode", "Repair roadmap"],
      },
      {
        name: "Fleet Care",
        from: "custom",
        bullets: ["Scheduled service", "Multi-vehicle discount", "Priority dispatch"],
      },
    ],
  },
  reveal: {
    title: "DIRT DOESN'T DRIVE HERE.",
    copy: "Drag to see what obsessive detailing looks like.",
    beforeLabel: "BEFORE",
    afterLabel: "AFTER",
  },
  process: {
    title: "FROM TAP TO SPOTLESS",
    steps: [
      { n: "01", h: "BOOK ONLINE", p: "Pick a service, drop a pin, choose a time." },
      { n: "02", h: "WE ROLL TO YOU", p: "Our tech dispatches with a fully-equipped mobile rig." },
      { n: "03", h: "WE WORK OUR MAGIC", p: "Precision work. Premium products. Zero mess." },
      { n: "04", h: "DRIVE SPOTLESS", p: "Keys back. Photo report. Book again in one tap." },
    ],
  },
  stats: [
    { value: 2500, suffix: "+", label: "Vehicles Serviced" },
    { value: 480, suffix: "+", label: "5-Star Reviews" },
    { value: 45, suffix: " MIN", label: "Avg Arrival" },
    { value: 30, suffix: " MI", label: "Service Radius" },
  ],
  area: {
    title: "WE COME TO YOU.",
    copy: "Enter your ZIP to check availability.",
    placeholder: "Enter ZIP or city",
    cta: "BOOK NOW",
  },
  testimonials: {
    title: "THE OWNERS TALK.",
    items: [
      {
        quote:
          "They pulled up in a matte black rig and left my 911 looking better than delivery day.",
        author: "M. Alvarez",
        role: "Porsche 911 owner",
      },
      {
        quote:
          "Oil change done in my office parking lot while I was on a call. Unreal.",
        author: "J. Patel",
        role: "Model Y owner",
      },
      {
        quote: "The only service I'll let touch our fleet. Period.",
        author: "K. Nguyen",
        role: "Fleet Manager, Ridgeline Co.",
      },
    ],
  },
  finale: {
    title: "FEEL THE SHINE.",
    cta: "BOOK YOUR SERVICE",
  },
  footer: {
    tagline: "DRIVEKARE — AUTO CARE ANYWHERE",
    columns: [
      {
        title: "Service",
        links: ["Mobile Detailing", "Oil & Fluids", "Tires", "Battery", "Diagnostics", "Fleet"],
      },
      {
        title: "Areas",
        links: ["Downtown", "West Side", "North Hills", "Southbay", "Airport Corridor"],
      },
      {
        title: "Company",
        links: ["About", "Careers", "Press", "Contact"],
      },
    ],
    socials: ["Instagram", "TikTok", "YouTube"],
    legal: "© 2025 DriveKare Mobile Auto Care. All rights reserved.",
  },
  booking: {
    title: "BOOK YOUR SERVICE",
    steps: ["Service", "Vehicle", "Location & Time", "Contact", "Confirm"],
    successTitle: "YOU'RE BOOKED.",
    successCopy: "We've got you. A confirmation is on its way.",
  },
} as const;

export type Site = typeof site;
