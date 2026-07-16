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
    let cleanup: (() => void) | undefined;

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
    return () => cleanup?.();
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
      {/* Video background - full brightness, no filter */}
      <div className="absolute inset-0">
        <MediaSlot slot={media.heroVideo} className="w-full h-full" objectPosition="center 68%" eager />
      </div>
      {/* Spotlight warm glow near bear */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(30% 20% at 50% 78%, rgba(255,214,150,0.28) 0%, rgba(240,138,29,0.10) 45%, rgba(0,0,0,0) 72%)",
        }}
      />
      {/* Edge vignette only - does NOT darken wordmark area */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 50%, rgba(0,0,0,0) 55%, rgba(10,10,11,0.75) 100%)",
        }}
      />

      {/* SEO h1 — visual title is the wordmark image */}
      <h1 className="sr-only">{site.meta.title}</h1>

      {/* Vertical flex layout: wordmark → bear → cta → scroll */}
      <div
        className="relative z-10 h-full flex flex-col items-center px-5 md:px-10"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 80px)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
        }}
      >
        {/* Wordmark - top, unfiltered, exact pixels */}
        <picture className="block w-full flex justify-center">
          <source srcSet={`${wordmark.src2x} 1x`} type="image/webp" />
          <img
            ref={wordmarkRef}
            src={wordmark.src2x}
            alt={wordmark.alt}
            fetchPriority="high"
            decoding="async"
            className="block h-auto select-none wordmark-hero"
            style={{
              width: "min(88vw, 720px)",
              maxWidth: "min(88vw, 900px)",
              filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.55))",
              opacity: 1,
              mixBlendMode: "normal",
            }}
            draggable={false}
          />
        </picture>
        <style>{`
          @media (min-width: 768px) {
            .wordmark-hero { width: min(60vw, 900px) !important; }
          }
        `}</style>

        {/* Bear stage - flex grow, contains bear */}
        <div
          className="relative w-full flex-1 flex items-end justify-center pointer-events-none"
          style={{
            minHeight: 0,
            marginTop: "clamp(12px, 3vh, 32px)",
          }}
        >
          <div
            className="relative pointer-events-auto w-[86vw] max-w-[460px] md:w-[42vw] md:max-w-[480px]"
            style={{
              height: "clamp(260px, 42vh, 500px)",
            }}
          >
            <HeroModel />
          </div>
        </div>

        {/* CTA - below bear */}
        <div className="w-full flex justify-center mt-4 md:mt-6">
          <button
            ref={ctaRef}
            onClick={() => open("book")}
            data-interactive
            className="dk-cta group inline-flex items-center gap-3 px-8 py-4 text-[11px] tracking-[0.32em] uppercase font-semibold text-black rounded-full"
          >
            <span className="dk-cta__label">{site.hero.cta}</span>
            <span aria-hidden className="dk-cta__arrow">→</span>
          </button>
        </div>

        {/* Scroll control */}
        <button
          type="button"
          onClick={scrollNext}
          aria-label="Scroll to next section"
          className="mt-3 flex flex-col items-center gap-1.5 group focus:outline-none"
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
