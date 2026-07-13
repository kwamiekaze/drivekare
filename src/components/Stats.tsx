import { useEffect, useRef } from "react";
import { site } from "../content/site";

export function Stats() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      const items = ref.current?.querySelectorAll<HTMLElement>("[data-stat]") ?? [];
      items.forEach((el) => {
        const target = parseFloat(el.dataset.stat || "0");
        const suffix = el.dataset.suffix || "";
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 2.2,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 80%" },
          onUpdate: () => {
            el.textContent = Math.round(obj.v).toLocaleString() + suffix;
          },
        });
        const line = el.parentElement?.querySelector<HTMLElement>("[data-line]");
        if (line) {
          gsap.fromTo(
            line,
            { scaleX: 0 },
            {
              scaleX: 1, duration: 1.2, ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 80%" },
            },
          );
        }
      });
    })();
  }, []);

  return (
    <section className="relative py-24 md:py-36 border-y border-white/5">
      <div ref={ref} className="mx-auto max-w-[1400px] px-5 md:px-10 grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6">
        {site.stats.map((s) => (
          <div key={s.label} className="flex flex-col">
            <div
              data-stat={s.value}
              data-suffix={s.suffix}
              className="font-display steel text-5xl md:text-7xl leading-none tracking-tight"
            >
              0
            </div>
            <div data-line className="mt-3 h-[2px] w-full origin-left" style={{ background: "#F08A1D", transform: "scaleX(0)" }} />
            <div className="mt-3 text-[10px] md:text-xs tracking-[0.3em] uppercase text-neutral-400">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
