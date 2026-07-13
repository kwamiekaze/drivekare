import { useEffect, useRef } from "react";
import { site, media } from "../content/site";
import { MediaSlot } from "./MediaSlot";

export function Process() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let killer: (() => void) | undefined;
    (async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      const section = sectionRef.current!;
      const track = trackRef.current!;
      if (!section || !track) return;
      const scrollX = () => -(track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: scrollX,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${track.scrollWidth}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (lineRef.current) lineRef.current.style.transform = `scaleX(${self.progress})`;
          },
        },
      });
      killer = () => tween.scrollTrigger?.kill();
    })();
    return () => killer?.();
  }, []);

  return (
    <section
      id="process"
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden bg-[#0A0A0B]"
    >
      <div className="absolute inset-0 opacity-10 blur-sm">
        <MediaSlot slot={media.roadVideo} className="w-full h-full" />
      </div>
      <div className="absolute top-0 left-0 right-0 pt-24 md:pt-28 px-5 md:px-10 z-10">
        <div className="text-[10px] tracking-[0.5em] uppercase text-[#F08A1D] mb-3">Process</div>
        <h2 className="font-display uppercase steel text-[10vw] md:text-[6vw] leading-none">
          {site.process.title}
        </h2>
        <div className="mt-8 h-[2px] w-full max-w-[70vw] bg-white/5 overflow-hidden">
          <div ref={lineRef} className="h-full origin-left" style={{
            transform: "scaleX(0)",
            background: "linear-gradient(90deg,#F08A1D,#FFA940)",
          }} />
        </div>
      </div>
      <div className="absolute inset-0 flex items-center">
        <div ref={trackRef} className="flex gap-10 md:gap-24 pl-5 md:pl-10 pr-[40vw] will-change-transform">
          {site.process.steps.map((s) => (
            <div key={s.n} className="min-w-[78vw] md:min-w-[46vw] flex flex-col">
              <div className="font-display steel text-[26vw] md:text-[16vw] leading-[0.8]">{s.n}</div>
              <h3 className="font-display uppercase text-3xl md:text-5xl steel-hot mt-4">{s.h}</h3>
              <p className="mt-3 text-neutral-400 max-w-md">{s.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
