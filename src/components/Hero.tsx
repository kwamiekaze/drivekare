import { useCallback, useEffect, useRef } from "react";
import { site, media } from "../content/site";
import { HeroModel } from "./HeroModel";
import { useOverlay } from "../lib/overlay-context";

// One-time document-level unlock (last-resort for iOS Low Power Mode etc.)
let unlockInstalled = false;
const pausedHeroVideos = new Set<HTMLVideoElement>();
function installHeroUnlock() {
  if (unlockInstalled || typeof document === "undefined") return;
  unlockInstalled = true;
  const retry = () => {
    pausedHeroVideos.forEach((v) => {
      v.muted = true;
      v.play().catch(() => {});
    });
  };
  document.addEventListener("touchstart", retry, { capture: true, passive: true });
  document.addEventListener("pointerdown", retry, { capture: true });
  document.addEventListener("click", retry, { capture: true });
}

export function Hero() {
  const titleRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { open } = useOverlay();

  const videoCbRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;
    el.setAttribute("muted", "");
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");
    el.setAttribute("autoplay", "");
    el.setAttribute("loop", "");
    const tryPlay = () => {
      el.muted = true;
      const p = el.play();
      if (p && typeof p.then === "function") {
        p.then(() => pausedHeroVideos.delete(el)).catch(() => pausedHeroVideos.add(el));
      }
    };
    tryPlay();
    el.addEventListener("loadedmetadata", tryPlay);
    el.addEventListener("canplay", tryPlay);
    installHeroUnlock();
  }, []);

  useEffect(() => {
    const onSplashDismiss = () => {
      const v = videoRef.current;
      if (!v) return;
      v.muted = true;
      v.play().catch(() => pausedHeroVideos.add(v));
    };
    window.addEventListener("dk-splash-dismissed", onSplashDismiss);
    return () => window.removeEventListener("dk-splash-dismissed", onSplashDismiss);
  }, []);


  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cleanup: (() => void) | undefined;

    (async () => {
      const { default: gsap } = await import("gsap");
      const title = titleRef.current;
      const cta = ctaRef.current;
      if (!title) return;
      const letters = title.querySelectorAll<HTMLSpanElement>("[data-polish]");

      letters.forEach((l) => {
        l.classList.remove("dull");
        l.classList.add("steel-hot");
      });

      if (!reduced) {
        gsap.fromTo(
          letters,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.025 }
        );

        const onMove = (e: MouseEvent) => {
          if (!cta) return;
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

  return (
    <section
      className="relative w-full overflow-hidden carbon"
      style={{ height: "100dvh", background: "#0A0A0B" }}
    >
      <div className="absolute inset-0 overflow-hidden" style={{ filter: "brightness(0.62)" }}>
        <video
          ref={videoCbRef}
          className="w-full h-full object-cover"
          style={{ objectPosition: "center 68%" }}
          poster={media.heroVideo.poster}
          muted
          playsInline
          loop
          autoPlay
          preload="auto"
          aria-hidden
        >
          {media.heroVideo.webm ? <source src={media.heroVideo.webm} type="video/webm" /> : null}
          <source src={media.heroVideo.src} type="video/mp4" />
        </video>
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

      <div
        className="relative z-10 h-full flex flex-col px-5 md:px-10 pointer-events-none"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 96px)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 32px)",
        }}
      >
        <div ref={titleRef} aria-hidden className="sr-only" />


        <div className="mt-auto flex justify-center md:justify-end pointer-events-auto">
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
    </section>
  );
}
