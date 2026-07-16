import { useEffect, useRef } from "react";
import { site, media } from "../content/site";
import { MediaSlot } from "./MediaSlot";
import { useOverlay } from "../lib/overlay-context";

export function BottomBand() {
  const rootRef = useRef<HTMLElement>(null);
  const { open } = useOverlay();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !rootRef.current) return;
    const els = rootRef.current.querySelectorAll<HTMLElement>("[data-reveal]");
    els.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
      el.style.transition = "opacity .8s ease-out, transform .8s ease-out";
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            const delay = Number(el.dataset.reveal) || i * 80;
            setTimeout(() => {
              el.style.opacity = "1";
              el.style.transform = "translateY(0)";
            }, delay);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.15 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="next"
      ref={rootRef}
      className="relative w-full carbon overflow-hidden"
      style={{ background: "#0A0A0B", minHeight: "100dvh" }}
    >
      <div className="absolute inset-0">
        <MediaSlot slot={media.bottomVideo} className="w-full h-full" objectPosition="center" dim />
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,11,0.85) 0%, rgba(10,10,11,0.72) 40%, rgba(10,10,11,0.92) 100%)",
        }}
      />

      <div
        className="relative z-10 max-w-[1100px] mx-auto px-6 md:px-10 flex flex-col items-center text-center"
        style={{
          paddingTop: "clamp(80px, 14vh, 160px)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 64px)",
          minHeight: "100dvh",
        }}
      >
        <span
          data-reveal="0"
          className="text-[10px] md:text-xs tracking-[0.5em] uppercase text-neutral-400"
        >
          {site.bottom.eyebrow}
        </span>

        <div aria-hidden data-reveal="120" className="mt-6 h-px w-16" style={{ background: "linear-gradient(90deg, transparent, #F08A1D, transparent)" }} />

        <h2
          data-reveal="200"
          className="font-display uppercase steel-hot leading-[0.92] tracking-[-0.01em] mt-8 text-[10vw] md:text-[64px] lg:text-[76px] max-w-[16ch]"
        >
          {site.bottom.headline}
        </h2>

        <p data-reveal="320" className="mt-8 text-sm md:text-base text-neutral-300 max-w-[52ch]">
          {site.bottom.line} · {site.bottom.scheduleLabel}:{" "}
          <a
            href={site.phoneHref}
            className="text-[#F8B267] hover:text-[#F08A1D] underline underline-offset-4 decoration-white/20 hover:decoration-[#F08A1D] transition-colors"
          >
            {site.phone}
          </a>
        </p>

        <div data-reveal="440" className="mt-10">
          <button
            onClick={() => open("book")}
            data-interactive
            className="inline-flex items-center gap-3 px-8 py-4 text-[11px] tracking-[0.32em] uppercase font-semibold text-black rounded-full ignition-glow"
            style={{ background: "linear-gradient(180deg,#FFA940,#F08A1D)" }}
          >
            {site.bottom.cta}
            <span aria-hidden>→</span>
          </button>
        </div>

        <div
          data-reveal="560"
          className="mt-14 flex flex-col sm:flex-row gap-3 sm:gap-8 items-center text-xs tracking-[0.28em] uppercase text-neutral-400"
        >
          <a
            href={site.phoneHref}
            data-interactive
            className="hover:text-[#F08A1D] transition-colors"
          >
            Call · {site.phone}
          </a>
          <span aria-hidden className="hidden sm:block w-px h-3 bg-white/15" />
          <a
            href={`mailto:${site.email}`}
            data-interactive
            className="hover:text-[#F08A1D] transition-colors"
          >
            Email DriveKare
          </a>
        </div>

        <div className="mt-auto pt-16" />
        <p
          data-reveal="700"
          className="text-[10px] tracking-[0.32em] uppercase text-neutral-500"
        >
          {site.bottom.microcopy}
        </p>
      </div>
    </section>
  );
}
