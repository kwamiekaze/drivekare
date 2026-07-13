import { useEffect, useRef } from "react";

type Mode = "lightTrails" | "chromeReflect" | "roadStreaks" | "gradient";

/**
 * Procedural canvas background used when a video slot has no src.
 * Streaking headlight/taillight light-trails and drifting chrome reflections
 * on black asphalt. Long horizontal cyan-white + orange streaks with motion blur.
 */
export function ProceduralCanvas({ mode = "lightTrails", className }: { mode?: Mode; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let W = 0, H = 0;
    const DPR = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio : 1);

    type Streak = { x: number; y: number; v: number; len: number; w: number; hue: "warm" | "cool"; a: number };
    let streaks: Streak[] = [];

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;

    const seed = () => {
      streaks = [];
      const count = mode === "roadStreaks" ? 26 : mode === "chromeReflect" ? 14 : 22;
      for (let i = 0; i < count; i++) streaks.push(spawn());
    };

    const spawn = (): Streak => ({
      x: rand(-W * 0.5, W),
      y: rand(H * 0.15, H * 0.9),
      v: rand(2, 9) * (mode === "chromeReflect" ? 0.35 : 1),
      len: rand(120, 480),
      w: rand(0.6, 2.2),
      hue: Math.random() > (mode === "chromeReflect" ? 0.85 : 0.55) ? "warm" : "cool",
      a: rand(0.3, 0.85),
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      seed();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      // motion-blur fade
      ctx.fillStyle = "rgba(10,10,11,0.18)";
      ctx.fillRect(0, 0, W, H);

      // subtle vignette / horizon glow
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "rgba(10,10,11,0.9)");
      g.addColorStop(0.5, "rgba(20,20,22,0.0)");
      g.addColorStop(1, "rgba(240,138,29,0.03)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      for (const s of streaks) {
        const grad = ctx.createLinearGradient(s.x, s.y, s.x + s.len, s.y);
        if (s.hue === "warm") {
          grad.addColorStop(0, "rgba(240,138,29,0)");
          grad.addColorStop(0.5, `rgba(255,169,64,${s.a})`);
          grad.addColorStop(1, "rgba(240,138,29,0)");
        } else {
          grad.addColorStop(0, "rgba(180,220,255,0)");
          grad.addColorStop(0.5, `rgba(220,240,255,${s.a})`);
          grad.addColorStop(1, "rgba(180,220,255,0)");
        }
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.w;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.len, s.y);
        ctx.stroke();

        s.x += s.v;
        if (s.x > W + s.len) {
          const n = spawn();
          n.x = -n.len;
          Object.assign(s, n);
        }
      }

      if (!reduced) raf = requestAnimationFrame(draw);
    };

    if (reduced) draw();
    else raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [mode]);

  return <canvas ref={ref} className={className} style={{ width: "100%", height: "100%", display: "block" }} />;
}
