import { useEffect, useRef } from "react";
import { site, media } from "../content/site";
import { MediaSlot } from "./MediaSlot";
import { Sparkles, Droplet, Disc3, BatteryCharging, Gauge, Truck } from "lucide-react";

const ICONS = [Sparkles, Droplet, Disc3, BatteryCharging, Gauge, Truck];

export function Services() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      const cards = ref.current?.querySelectorAll<HTMLElement>("[data-card]") ?? [];
      cards.forEach((c, i) => {
        gsap.fromTo(
          c,
          { clipPath: "inset(100% 0 0 0)", y: 40, rotateX: 8, opacity: 0 },
          {
            clipPath: "inset(0% 0 0 0)",
            y: 0, rotateX: 0, opacity: 1,
            duration: 0.9, ease: "power3.out",
            delay: i * 0.08,
            scrollTrigger: { trigger: c, start: "top 85%" },
          },
        );
      });
    })();
  }, []);

  return (
    <section id="services" className="relative py-28 md:py-40 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.1] blur-md">
        <MediaSlot slot={media.revealVideo} className="w-full h-full" />
      </div>
      <div className="absolute inset-0 carbon opacity-40 pointer-events-none" />
      <div className="relative mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 md:mb-20 gap-4">
          <div>
            <div className="text-[10px] tracking-[0.5em] uppercase text-[#F08A1D] mb-4">Services</div>
            <h2 className="font-display uppercase steel text-[13vw] md:text-[8vw] leading-[0.85]">
              {site.services.title}
            </h2>
          </div>
          <p className="max-w-xs text-neutral-400 text-sm">{site.services.kicker}</p>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {site.services.items.map((s, i) => {
            const Icon = ICONS[i] ?? Sparkles;
            return (
              <div
                key={s.name}
                data-card
                data-interactive
                className="group relative p-7 md:p-8 rounded-2xl bg-[#0F0F11] border border-white/5 overflow-hidden transition-transform hover:-translate-y-1"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background:
                      "conic-gradient(from 0deg at 50% 50%, transparent 0%, #F08A1D 25%, transparent 50%, #FFA940 75%, transparent 100%)",
                    padding: "1px",
                    WebkitMask:
                      "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    animation: "spin 5s linear infinite",
                  }}
                />
                <Icon size={26} strokeWidth={1.2} className="text-neutral-200" />
                <h3 className="mt-6 font-display uppercase text-2xl md:text-3xl steel tracking-tight">
                  {s.name}
                </h3>
                <ul className="mt-4 space-y-1.5 text-sm text-neutral-400">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="text-[#F08A1D]">—</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-500">
                    {s.from}
                  </span>
                  <span
                    className="text-[10px] tracking-[0.3em] uppercase text-[#F08A1D] opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Book →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}
