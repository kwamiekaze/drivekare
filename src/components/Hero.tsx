import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { site, media } from "../content/site";
import { renderPolishTitle } from "../lib/polish-title";
import { MediaSlot } from "./MediaSlot";
import { HeroModel } from "./HeroModel";

export function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ctxCleanup: (() => void) | undefined;
    (async () => {
      const gsapMod = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      const gsap = gsapMod.default;
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      const title = titleRef.current;
      if (!section || !title) return;
      const letters = title.querySelectorAll<HTMLSpanElement>("[data-polish]");

      // Entrance
      gsap.fromTo(
        letters,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.025 },
      );

      if (reduced) {
        letters.forEach((l) => {
          l.classList.remove("dull");
          l.classList.add("steel-hot");
        });
        return;
      }

      // Pin scrub polish
      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${window.innerHeight * 1.1}`,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          const n = letters.length;
          letters.forEach((el, i) => {
            const t = i / Math.max(1, n - 1);
            if (p >= t - 0.02) {
              el.classList.remove("dull");
              el.classList.add("steel-hot");
            } else {
              el.classList.remove("steel-hot");
              el.classList.add("dull");
            }
          });
        },
      });

      // Magnetic CTA
      const cta = ctaRef.current;
      const onMove = (e: MouseEvent) => {
        if (!cta) return;
        const r = cta.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < 180) {
          gsap.to(cta, { x: dx * 0.25, y: dy * 0.25, duration: 0.4, ease: "power3.out" });
        } else {
          gsap.to(cta, { x: 0, y: 0, duration: 0.6, ease: "power3.out" });
        }
      };
      window.addEventListener("mousemove", onMove);

      ctxCleanup = () => {
        st.kill();
        window.removeEventListener("mousemove", onMove);
      };
    })();
    return () => ctxCleanup?.();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen overflow-hidden carbon"
      style={{ background: "#0A0A0B" }}
    >
      {/* Background media — full-bleed cover, center-anchored spotlight */}
      <div className="absolute inset-0 opacity-55">
        <MediaSlot slot={media.heroVideo} className="w-full h-full" />
      </div>
      {/* Warm ground-spotlight pool (procedural stand-in until real video) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(38% 26% at 50% 82%, rgba(255,214,150,0.28) 0%, rgba(240,138,29,0.10) 40%, rgba(0,0,0,0) 70%)",
        }}
      />
      {/* Edge vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(80% 80% at 50% 45%, rgba(0,0,0,0) 0%, rgba(10,10,11,0.85) 85%)",
        }}
      />

      {/* Copy — headline anchored to upper third */}
      <div className="relative z-10 min-h-screen flex flex-col px-5 md:px-10 pt-24 md:pt-28">
        <div className="text-[10px] md:text-xs tracking-[0.5em] uppercase text-neutral-400 mb-4">
          {site.hero.eyebrow}
        </div>
        <h1
          ref={titleRef}
          className="font-display uppercase leading-[0.86] tracking-[-0.01em] text-[15vw] md:text-[12vw] lg:text-[11vw]"
          aria-label={site.hero.title}
        >
          {renderPolishTitle(site.hero.title, "hero")}
        </h1>

        {/* Spacer — bear owns this zone */}
        <div className="flex-1" />

        <div className="pb-10 md:pb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <p className="max-w-md text-sm md:text-base text-neutral-300 leading-relaxed">
            {site.hero.sub}
          </p>
          <Link
            ref={ctaRef}
            to={site.hero.ctaHref}
            data-interactive
            className="inline-flex items-center gap-3 self-start md:self-end px-7 py-4 text-[11px] tracking-[0.32em] uppercase font-semibold text-black rounded-full ignition-glow"
            style={{ background: "linear-gradient(180deg,#FFA940,#F08A1D)" }}
          >
            {site.hero.cta}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>

      {/* 3D bear stage — center-lower, feet anchored in the spotlight pool */}
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-auto z-[5]"
        style={{
          bottom: "8vh",
          width: "min(78vw, 640px)",
          height: "min(62vh, 640px)",
        }}
      >
        <HeroModel />
      </div>
    </section>
  );
}
