import {
  CanvasTexture,
  ClampToEdgeWrapping,
  LinearFilter,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from "three";

/** DriveKare palette, taken from the bear's coveralls, logo and fur. */
export const DK = {
  navy: "#1c2645",
  navyDeep: "#0d1326",
  night: "#070b16",
  orange: "#e8741e",
  orangeHot: "#ff8a2a",
  bone: "#e6dccb",
  fur: "#c9772c",
  steel: "#8d949e",
  rubber: "#17181b",
  brown: "#3b2a20",
} as const;

const cache = new Map<string, Texture>();

function make(
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  opts: { repeat?: [number, number]; color?: boolean } = {},
): CanvasTexture {
  const hit = cache.get(key);
  if (hit) return hit as CanvasTexture;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, w, h);
  const tex = new CanvasTexture(canvas);
  if (opts.color !== false) tex.colorSpace = SRGBColorSpace;
  if (opts.repeat) {
    tex.wrapS = tex.wrapT = RepeatWrapping;
    tex.repeat.set(...opts.repeat);
  } else {
    tex.wrapS = tex.wrapT = ClampToEdgeWrapping;
  }
  tex.anisotropy = 8;
  tex.minFilter = LinearFilter;
  cache.set(key, tex);
  return tex;
}

/** Seeded random, so every visitor sees the same speckle. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Coverall canvas: navy with the orange and bone flecks from the figure. */
export function fabricTexture() {
  return make(
    "fabric",
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = DK.navy;
      ctx.fillRect(0, 0, w, h);
      const r = rng(7);
      for (let i = 0; i < 9000; i += 1) {
        const v = r();
        ctx.fillStyle =
          v < 0.5 ? "rgba(10,14,30,0.55)" : v < 0.8 ? "rgba(60,74,120,0.45)" : v < 0.93 ? "rgba(232,116,30,0.7)" : "rgba(230,220,203,0.55)";
        const s = 1 + r() * 2.4;
        ctx.beginPath();
        ctx.arc(r() * w, r() * h, s, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    { repeat: [3, 3] },
  );
}

/** Bump for the fabric: small raised pebbles. */
export function pebbleBump() {
  return make(
    "pebble",
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, w, h);
      const r = rng(11);
      for (let i = 0; i < 2600; i += 1) {
        const g = 90 + Math.floor(r() * 120);
        ctx.fillStyle = `rgb(${g},${g},${g})`;
        ctx.beginPath();
        ctx.arc(r() * w, r() * h, 1 + r() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    { repeat: [6, 6], color: false },
  );
}

/** Epoxy floor: charcoal flake with faint trowel swirls. */
export function floorTexture() {
  return make(
    "floor",
    1024,
    1024,
    (ctx, w, h) => {
      ctx.fillStyle = "#15181f";
      ctx.fillRect(0, 0, w, h);
      const r = rng(3);
      for (let i = 0; i < 60; i += 1) {
        const g = ctx.createRadialGradient(r() * w, r() * h, 0, r() * w, r() * h, 80 + r() * 220);
        g.addColorStop(0, "rgba(40,46,58,0.35)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      for (let i = 0; i < 26000; i += 1) {
        const v = r();
        ctx.fillStyle = v < 0.6 ? "rgba(70,76,90,0.5)" : v < 0.9 ? "rgba(12,14,18,0.6)" : "rgba(160,160,170,0.35)";
        ctx.fillRect(r() * w, r() * h, 1.4, 1.4);
      }
    },
    { repeat: [5, 5] },
  );
}

export function floorRoughness() {
  return make(
    "floorRough",
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = "#555";
      ctx.fillRect(0, 0, w, h);
      const r = rng(19);
      for (let i = 0; i < 90; i += 1) {
        const x = r() * w;
        const y = r() * h;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 30 + r() * 110);
        const v = r() < 0.5 ? "20,20,20" : "200,200,200";
        g.addColorStop(0, `rgba(${v},0.5)`);
        g.addColorStop(1, `rgba(${v},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
    },
    { repeat: [4, 4], color: false },
  );
}

/** Corrugated wall cladding, vertical ribs. */
export function ribTexture(color: string, repeat: [number, number]) {
  return make(
    `rib-${color}-${repeat.join("x")}`,
    256,
    256,
    (ctx, w, h) => {
      for (let x = 0; x < w; x += 1) {
        const t = (Math.sin((x / w) * Math.PI * 2 * 4) + 1) / 2;
        ctx.fillStyle = color;
        ctx.fillRect(x, 0, 1, h);
        ctx.fillStyle = `rgba(255,255,255,${t * 0.07})`;
        ctx.fillRect(x, 0, 1, h);
        ctx.fillStyle = `rgba(0,0,0,${(1 - t) * 0.35})`;
        ctx.fillRect(x, 0, 1, h);
      }
      const r = rng(5);
      for (let i = 0; i < 300; i += 1) {
        ctx.fillStyle = `rgba(0,0,0,${r() * 0.12})`;
        ctx.fillRect(r() * w, r() * h, 1 + r() * 3, 8 + r() * 40);
      }
    },
    { repeat },
  );
}

/** Pegboard: dark board with a grid of holes. */
export function pegboardTexture() {
  return make(
    "peg",
    512,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = "#2a3350";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#0b0f1c";
      for (let y = 8; y < h; y += 16) {
        for (let x = 8; x < w; x += 16) {
          ctx.beginPath();
          ctx.arc(x, y, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    { repeat: [3, 2] },
  );
}

/** Neon sign lettering, drawn once; bloom does the glow. */
export function neonTexture() {
  return make("neon", 2048, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "italic 700 190px 'Instrument Sans', 'Helvetica Neue', Arial, sans-serif";
    ctx.shadowColor = "#ff8a2a";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "#ffe3c8";
    ctx.fillText("Care that comes to you.", w / 2, h / 2 + 6);
  });
}

export function wordmarkTexture() {
  return make("wordmark", 1024, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 150px 'Unbounded', 'Arial Black', sans-serif";
    ctx.fillStyle = DK.bone;
    ctx.fillText("drivekare.com", w / 2, h / 2);
  });
}

/** Floor stencil, painted-on bay lines and a circle for the hero spot. */
export function stencilTexture(label: string) {
  return make(`stencil-${label}`, 1024, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "800 120px 'Unbounded', 'Arial Black', sans-serif";
    ctx.fillStyle = "rgba(232,116,30,0.85)";
    ctx.fillText(label, w / 2, h / 2);
  });
}

/** Hazard stripes for bay edges and the lift base. */
export function hazardTexture() {
  return make(
    "hazard",
    256,
    64,
    (ctx, w, h) => {
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = DK.orange;
      for (let x = -h; x < w + h; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, h);
        ctx.lineTo(x + 24, h);
        ctx.lineTo(x + 24 + h, 0);
        ctx.lineTo(x + h, 0);
        ctx.closePath();
        ctx.fill();
      }
    },
    { repeat: [6, 1] },
  );
}

/** Battery label: orange band with a charge glyph. */
export function batteryLabel() {
  return make("battery", 256, 128, (ctx, w, h) => {
    ctx.fillStyle = "#101216";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = DK.orange;
    ctx.fillRect(0, h * 0.34, w, h * 0.32);
    ctx.fillStyle = "#101216";
    ctx.font = "800 34px 'Unbounded', 'Arial Black', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("DK POWER", w / 2, h / 2 + 2);
  });
}

/** Service van and gear livery text. */
export function labelTexture(text: string, bg: string, fg: string) {
  return make(`label-${text}-${bg}`, 512, 128, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = fg;
    ctx.font = "800 58px 'Unbounded', 'Arial Black', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2 + 3);
  });
}
