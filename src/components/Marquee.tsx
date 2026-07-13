import { useEffect, useRef } from "react";
import { site } from "../content/site";

function Row({ reverse = false, speed = 1 }: { reverse?: boolean; speed?: number }) {
  const items = [...site.marquee, ...site.marquee, ...site.marquee];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let x = 0;
    let last = performance.now();
    let vel = 1;
    let scrollVel = 0;
    let lastScroll = window.scrollY;

    const onScroll = () => {
      const d = window.scrollY - lastScroll;
      lastScroll = window.scrollY;
      scrollVel = scrollVel * 0.85 + d * 0.15;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const loop = (t: number) => {
      const dt = (t - last) / 16.67;
      last = t;
      vel = speed + Math.min(4, Math.abs(scrollVel) * 0.05) * (reverse ? -1 : 1);
      x -= vel * dt * (reverse ? -1 : 1);
      if (ref.current) {
        const w = ref.current.scrollWidth / 3;
        if (x <= -w) x += w;
        if (x >= 0) x -= w;
        ref.current.style.transform = `translate3d(${x}px,0,0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [reverse, speed]);

  return (
    <div className="overflow-hidden">
      <div ref={ref} className="flex gap-14 whitespace-nowrap will-change-transform">
        {items.map((w, i) => (
          <span
            key={i}
            className="font-display uppercase text-[12vw] leading-none tracking-tight"
            style={{
              WebkitTextStroke: "1px #6E7278",
              color: "transparent",
            }}
          >
            {w} <span style={{ color: "#F08A1D", WebkitTextStroke: "0" }}>•</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Marquee() {
  return (
    <section aria-hidden className="relative py-10 md:py-14 border-y border-white/5 bg-[#0A0A0B]">
      <div className="flex flex-col gap-2">
        <Row speed={1} />
        <Row reverse speed={1.2} />
      </div>
    </section>
  );
}
