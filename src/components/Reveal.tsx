import { useCallback, useEffect, useRef, useState } from "react";
import { site, media } from "../content/site";
import { renderPolishTitle } from "../lib/polish-title";

export function Reveal() {
  const [pct, setPct] = useState(50);
  const wrapRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    (async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      const letters = titleRef.current?.querySelectorAll<HTMLSpanElement>("[data-polish]") ?? [];
      gsap.fromTo(
        letters,
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, stagger: 0.02, duration: 0.6, ease: "power3.out",
          scrollTrigger: { trigger: titleRef.current, start: "top 80%" },
          onUpdate() {
            const p = (this as any).progress?.() ?? 0;
            const n = letters.length;
            letters.forEach((el, i) => {
              const t = i / Math.max(1, n - 1);
              if (p >= t - 0.02) {
                el.classList.remove("dull");
                el.classList.add("steel-hot");
              }
            });
          },
        },
      );
    })();
  }, []);

  const setFromEvent = useCallback((clientX: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
    setPct(p);
  }, []);

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setFromEvent(e.clientX);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setFromEvent(e.clientX);
  };
  const onUp = () => (dragging.current = false);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") setPct((p) => Math.max(0, p - 4));
    if (e.key === "ArrowRight") setPct((p) => Math.min(100, p + 4));
  };

  return (
    <section className="relative py-28 md:py-40 bg-[#0A0A0B]">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="mb-10 md:mb-16">
          <div className="text-[10px] tracking-[0.5em] uppercase text-[#F08A1D] mb-4">The Reveal</div>
          <h2
            ref={titleRef}
            className="font-display uppercase leading-[0.86] text-[12vw] md:text-[8vw]"
            aria-label={site.reveal.title}
          >
            {renderPolishTitle(site.reveal.title, "rv")}
          </h2>
          <p className="mt-4 text-neutral-400 text-sm">{site.reveal.copy}</p>
        </div>

        <div
          ref={wrapRef}
          className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden select-none chrome-border touch-none"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onKeyDown={onKey}
          tabIndex={0}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          aria-label="Before / after comparison"
          data-interactive
        >
          {/* AFTER (background) */}
          <div className="absolute inset-0" style={{
            background:
              media.revealAfter.src
                ? `url(${media.revealAfter.src}) center/cover`
                : "radial-gradient(80% 60% at 50% 30%, #2A2E33 0%, #0A0A0B 70%), linear-gradient(180deg,#1a1c1f,#0A0A0B)",
          }}>
            <div className="absolute inset-0 opacity-40" style={{
              background: "radial-gradient(60% 40% at 50% 40%, rgba(240,138,29,0.35), transparent 70%)",
            }} />
            <span className="absolute bottom-5 right-5 text-[10px] tracking-[0.4em] uppercase text-neutral-200 px-3 py-1.5 border border-white/10 rounded-full backdrop-blur">
              {site.reveal.afterLabel}
            </span>
          </div>
          {/* BEFORE (clipped) */}
          <div
            className="absolute inset-0"
            style={{
              clipPath: `inset(0 ${100 - pct}% 0 0)`,
              background:
                media.revealBefore.src
                  ? `url(${media.revealBefore.src}) center/cover`
                  : "linear-gradient(180deg,#1a1815,#0d0c0a), repeating-linear-gradient(45deg, rgba(80,60,40,0.2) 0 2px, transparent 2px 6px)",
            }}
          >
            <div className="absolute inset-0" style={{
              background: "radial-gradient(60% 60% at 40% 60%, rgba(80,60,40,0.5), transparent 70%)",
              mixBlendMode: "multiply",
            }} />
            <span className="absolute bottom-5 left-5 text-[10px] tracking-[0.4em] uppercase text-neutral-200 px-3 py-1.5 border border-white/10 rounded-full backdrop-blur">
              {site.reveal.beforeLabel}
            </span>
          </div>
          {/* Handle */}
          <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${pct}%`, transform: "translateX(-50%)" }}>
            <div className="w-px h-full" style={{ background: "linear-gradient(180deg, transparent, #F08A1D 20%, #FFA940 50%, #F08A1D 80%, transparent)" }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full flex items-center justify-center ignition-glow"
              style={{ background: "linear-gradient(180deg,#E8E8EC,#5B6068)" }}
            >
              <span className="text-black text-xs">‹›</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
