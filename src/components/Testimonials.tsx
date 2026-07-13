import { useEffect, useRef, useState } from "react";
import { site } from "../content/site";

export function Testimonials() {
  const [i, setI] = useState(0);
  const items = site.testimonials.items;
  const startX = useRef(0);
  const dragging = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % items.length), 6000);
    return () => clearInterval(id);
  }, [items.length]);

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
  };
  const onUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    if (dx < -40) setI((v) => (v + 1) % items.length);
    if (dx > 40) setI((v) => (v - 1 + items.length) % items.length);
    dragging.current = false;
  };

  return (
    <section id="reviews" className="relative py-28 md:py-40 bg-[#0A0A0B]">
      <div className="mx-auto max-w-[1200px] px-5 md:px-10 text-center">
        <div className="text-[10px] tracking-[0.5em] uppercase text-[#F08A1D] mb-4">Testimonials</div>
        <h2 className="font-display uppercase steel text-[9vw] md:text-[5vw] leading-none mb-14">
          {site.testimonials.title}
        </h2>
        <div
          className="relative min-h-[260px] md:min-h-[220px] touch-pan-y"
          onPointerDown={onDown}
          onPointerUp={onUp}
          data-interactive
        >
          {items.map((t, idx) => (
            <div
              key={idx}
              className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-700"
              style={{
                opacity: idx === i ? 1 : 0,
                transform: `translateY(${idx === i ? 0 : 12}px)`,
                pointerEvents: idx === i ? "auto" : "none",
              }}
            >
              <div className="absolute -inset-10 rounded-full pointer-events-none" style={{
                background: "radial-gradient(50% 50% at 50% 50%, rgba(240,138,29,0.15), transparent 70%)",
                animation: "breathe 4s ease-in-out infinite",
              }} />
              <p className="relative text-2xl md:text-4xl font-display uppercase steel leading-tight max-w-3xl">
                "{t.quote}"
              </p>
              <div className="relative mt-6 text-[11px] tracking-[0.35em] uppercase text-neutral-400">
                {t.author} — <span className="text-neutral-500">{t.role}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 flex justify-center gap-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              aria-label={`Testimonial ${idx + 1}`}
              onClick={() => setI(idx)}
              data-interactive
              className="w-8 h-[3px] rounded-full transition-colors"
              style={{ background: idx === i ? "#F08A1D" : "rgba(255,255,255,0.15)" }}
            />
          ))}
        </div>
      </div>
      <style>{`@keyframes breathe { 0%,100% { opacity: 0.7; } 50% { opacity: 1; } }`}</style>
    </section>
  );
}
