import { useEffect } from "react";

export function useLenis() {
  useEffect(() => {
    let cancelled = false;
    let lenis: any;
    let raf = 0;
    (async () => {
      if (typeof window === "undefined") return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
      const Lenis = (await import("lenis")).default;
      if (cancelled) return;
      lenis = new Lenis({ duration: 1.15, smoothWheel: true, lerp: 0.09 });
      const gsapMod = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsapMod.default.registerPlugin(ScrollTrigger);
      lenis.on("scroll", ScrollTrigger.update);
      const loop = (t: number) => {
        lenis.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (lenis) lenis.destroy();
    };
  }, []);
}
