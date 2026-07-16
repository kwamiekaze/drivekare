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
    let cleanup: (() => void) | undefined;

    (async () => {
      const { default: gsap } = await import("gsap");
      const img = wordmarkRef.current;
      const cta = ctaRef.current;

      if (img && !reduced) {
        gsap.fromTo(
          img,
          { y: 24, opacity: 0, filter: "blur(6px)" },
          { y: 0, opacity: 1, filter: "blur(0px)", duration: 1.0, ease: "power3.out", delay: 0.1 },
        );
      }

      if (!reduced && cta) {
        const onMove = (e: MouseEvent) => {
          const r = cta.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          const dist = Math.hypot(dx, dy);
          if (dist < 180) gsap.to(cta, { x: dx * 0.2, y: dy * 0.2, duration: 0.4, ease: "power3.out" });
          else gsap.to(cta, { x: 0, y: 0, duration: 0.6, ease: "power3.out" });
        };
        window.addEventListener("mousemove", onMove);
        cleanup = () => window.removeEventListener("mousemove", onMove);
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
      <div className="absolute inset-0" style={{ filter: "brightness(0.62)" }}>
        <MediaSlot slot={media.heroVideo} className="w-full h-full" objectPosition="center 68%" eager />
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(34% 22% at 50% 82%, rgba(255,214,150,0.22) 0%, rgba(240,138,29,0.08) 45%, rgba(0,0,0,0) 72%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(85% 85% at 50% 55%, rgba(0,0,0,0) 0%, rgba(10,10,11,0.78) 88%)",
        }}
      />

      {/* SEO h1 — visual title is the wordmark image */}
      <h1 className="sr-only">{site.meta.title}</h1>

      <div
        className="relative z-10 h-full flex flex-col items-center px-5 md:px-10 pointer-events-none"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 96px)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 96px)",
        }}
      >
        <picture className="block w-full flex justify-center wordmark-glint">
          <source srcSet={`${wordmark.src1x} 1x, ${wordmark.src2x} 2x`} type="image/webp" />
          <img
            ref={wordmarkRef}
            src={wordmark.src1x}
            srcSet={`${wordmark.src1x} 1x, ${wordmark.src2x} 2x`}
            alt={wordmark.alt}
            fetchPriority="high"
            decoding="async"
            className="block h-auto select-none"
            style={{
              width: "min(88vw, 720px)",
              maxWidth: "min(88vw, 900px)",
              filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.55)) drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
            }}
            draggable={false}
          />
        </picture>
        <style>{`
          @media (min-width: 768px) {
            .wordmark-glint img { width: min(60vw, 900px) !important; }
          }
        `}</style>

        <div className="mt-auto w-full flex justify-center md:justify-end pointer-events-auto">
          <button
            ref={ctaRef}
            onClick={() => open("book")}
            data-interactive
            className="inline-flex items-center gap-3 px-7 py-4 text-[11px] tracking-[0.32em] uppercase font-semibold text-black rounded-full ignition-glow"
            style={{ background: "linear-gradient(180deg,#FFA940,#F08A1D)" }}
          >
            {site.hero.cta}
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-auto z-[5] w-[88vw] max-w-[480px] md:w-[42vw] md:max-w-[480px]"
        style={{
          bottom: "clamp(110px, 15vh, 200px)",
          height: "clamp(300px, 44vh, 520px)",
        }}
      >
        <HeroModel />
      </div>

      {/* Scroll control */}
      <button
        type="button"
        onClick={scrollNext}
        aria-label="Scroll to next section"
        className="absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 group focus:outline-none"
        style={{
          bottom: "calc(env(safe-area-inset-bottom) + 12px)",
        }}
        data-interactive
      >
        <span className="block w-px h-9 bg-white/25 relative overflow-hidden">
          <span
            className="absolute left-1/2 -translate-x-1/2 top-0 w-[6px] h-[6px] rounded-full"
            style={{
              background: "#F08A1D",
              boxShadow: "0 0 12px rgba(240,138,29,0.9), 0 0 24px rgba(240,138,29,0.5)",
              animation: "scroll-dot 2.2s ease-in-out infinite",
            }}
          />
        </span>
        <span
          className="text-[9px] tracking-[0.42em] uppercase text-neutral-400 group-hover:text-[#F08A1D] transition-colors"
        >
          Scroll
        </span>
        <style>{`
          @keyframes scroll-dot {
            0%   { transform: translate(-50%, 0); opacity: 0.9; }
            50%  { transform: translate(-50%, 28px); opacity: 1; }
            100% { transform: translate(-50%, 0); opacity: 0.9; }
          }
          @media (prefers-reduced-motion: reduce) {
            @keyframes scroll-dot { 0%,100% { transform: translate(-50%, 0); } }
          }
        `}</style>
      </button>
    </section>
  );
}
