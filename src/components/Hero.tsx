import { useEffect, useRef } from "react";
import { site, media, wordmark } from "../content/site";
import { MediaSlot } from "./MediaSlot";
import { HeroModel } from "./HeroModel";
import { useOverlay } from "../lib/overlay-context";

export function Hero() {
  const wordmarkRef = useRef<HTMLImageElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const { open } = useOverlay();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    (async () => {
      const { default: gsap } = await import("gsap");
      const img = wordmarkRef.current;
      if (img) {
        gsap.fromTo(
          img,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.0, ease: "power3.out", delay: 0.1 },
        );
      }
    })();
  }, []);

  const scrollNext = () => {
    const el = document.getElementById("next");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      className="relative w-full overflow-hidden carbon"
      style={{ height: "100dvh", background: "#0A0A0B" }}
    >
      {/* Video background */}
      <div className="absolute inset-0 z-0">
        <MediaSlot slot={media.heroVideo} className="w-full h-full" objectPosition="center 68%" eager />
      </div>

      {/* Spotlight warm glow near bear */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(30% 20% at 50% 72%, rgba(255,214,150,0.28) 0%, rgba(240,138,29,0.10) 45%, rgba(0,0,0,0) 72%)",
        }}
      />
      {/* Edge vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 50%, rgba(0,0,0,0) 55%, rgba(10,10,11,0.75) 100%)",
        }}
      />

      {/* SEO h1 */}
      <h1 className="sr-only">{site.meta.title}</h1>

      {/* Wordmark — absolutely positioned near top, plain img, zero processing */}
      <div
        className="absolute left-0 right-0 z-20 flex justify-center pointer-events-none px-5"
        style={{ top: "calc(env(safe-area-inset-top) + 84px)" }}
      >
        <img
          ref={wordmarkRef}
          src={wordmark.src}
          alt={wordmark.alt}
          fetchPriority="high"
          decoding="async"
          draggable={false}
          className="block h-auto select-none wordmark-hero"
          style={{
            width: "min(88vw, 720px)",
            filter: "none",
            opacity: 1,
            mixBlendMode: "normal",
            WebkitFilter: "none",
          }}
        />
        <style>{`
          @media (min-width: 768px) {
            .wordmark-hero { width: min(60vw, 900px) !important; }
          }
        `}</style>
      </div>

      {/* Bear — center-stage in the spotlight pool (morning composition) */}
      <div
        className="absolute left-1/2 z-10 pointer-events-none"
        style={{
          top: "48%",
          transform: "translate(-50%, -50%)",
          width: "min(92vw, 560px)",
          height: "min(62vh, 560px)",
        }}
      >
        <div className="w-full h-full pointer-events-auto">
          <HeroModel />
        </div>
      </div>

      {/* Bottom stack: CTA + Scroll, both below the bear */}
      <div
        className="absolute left-0 right-0 z-20 flex flex-col items-center gap-3"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 20px)" }}
      >
        <button
          ref={ctaRef}
          onClick={() => open("book")}
          data-interactive
          className="dk-cta group inline-flex items-center gap-3 px-8 py-4 text-[11px] tracking-[0.32em] uppercase font-semibold text-black rounded-full"
        >
          <span className="dk-cta__label">{site.hero.cta}</span>
          <span aria-hidden className="dk-cta__arrow">→</span>
        </button>

        <button
          type="button"
          onClick={scrollNext}
          aria-label="Scroll to next section"
          className="flex flex-col items-center gap-1.5 group focus:outline-none"
          data-interactive
        >
          <span className="block w-px h-7 bg-white/25 relative overflow-hidden">
            <span
              className="absolute left-1/2 -translate-x-1/2 top-0 w-[6px] h-[6px] rounded-full"
              style={{
                background: "#F08A1D",
                boxShadow: "0 0 12px rgba(240,138,29,0.9), 0 0 24px rgba(240,138,29,0.5)",
                animation: "scroll-dot 2.2s ease-in-out infinite",
              }}
            />
          </span>
          <span className="text-[9px] tracking-[0.42em] uppercase text-neutral-500 group-hover:text-[#F08A1D] transition-colors">
            Scroll
          </span>
          <style>{`
            @keyframes scroll-dot {
              0%   { transform: translate(-50%, 0); opacity: 0.9; }
              50%  { transform: translate(-50%, 22px); opacity: 1; }
              100% { transform: translate(-50%, 0); opacity: 0.9; }
            }
          `}</style>
        </button>
      </div>
    </section>
  );
}
