import { useCallback, useEffect, useRef, useState } from "react";
import { ServicesMarquee } from "./ServicesMarquee";

const SCRUB_MP4 = "/videos/garage-scrub-v3.mp4";
const SCRUB_WEBM = "/videos/garage-scrub-v3.webm";
const POSTER = "/videos/garage-scrub-poster-v3.jpg";

export function GarageScroll() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const durationRef = useRef(0);
  const primedRef = useRef(false);
  const [reduced, setReduced] = useState(false);
  const [progress, setProgress] = useState(0);
  const [metaLoaded, setMetaLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // iOS decoder prime: muted play() then pause+seek so subsequent currentTime writes paint.
  const primeDecoder = useCallback(() => {
    const v = videoRef.current;
    if (!v || primedRef.current) return;
    try {
      v.muted = true;
      const p = v.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          try {
            v.pause();
            v.currentTime = 0.001;
            primedRef.current = true;
          } catch {}
        }).catch(() => {
          // Low Power Mode / autoplay blocked — the touchstart backup below will retry.
        });
      } else {
        try { v.pause(); v.currentTime = 0.001; primedRef.current = true; } catch {}
      }
    } catch {}
  }, []);

  // One-time gesture backup for iOS Low Power Mode
  useEffect(() => {
    if (reduced) return;
    const onGesture = () => {
      if (primedRef.current) return;
      primeDecoder();
    };
    document.addEventListener("touchstart", onGesture, { once: true, passive: true });
    document.addEventListener("pointerdown", onGesture, { once: true });
    return () => {
      document.removeEventListener("touchstart", onGesture);
      document.removeEventListener("pointerdown", onGesture);
    };
  }, [reduced, primeDecoder]);

  // Lazy fetch the scrub video as a blob so seeks are instant.
  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    if (!section) return;
    let cancelled = false;
    let started = false;

    const load = async () => {
      if (started) return;
      started = true;
      try {
        const v = videoRef.current;
        // Safari returns "" for webm/vp9 (falsy) → picks MP4. Chromium returns "probably".
        const webmSupport = v ? v.canPlayType('video/webm; codecs="vp9"') : "";
        const preferWebm = webmSupport === "probably" || webmSupport === "maybe";
        const url1 = preferWebm ? SCRUB_WEBM : SCRUB_MP4;
        const res = await fetch(url1);
        if (!res.ok) return;
        const blob = await res.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        if (v) {
          const t = v.currentTime;
          v.src = url;
          v.load();
          v.addEventListener(
            "loadedmetadata",
            () => {
              try { v.currentTime = t; } catch {}
              primeDecoder();
            },
            { once: true }
          );
        }
      } catch {}
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            load();
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "800px 0px 800px 0px" }
    );
    io.observe(section);
    return () => {
      cancelled = true;
      io.disconnect();
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, [reduced, primeDecoder]);

  const onMeta = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    durationRef.current = v.duration || 0;
    setMetaLoaded(true);
    try { v.currentTime = 0; } catch {}
    primeDecoder();
  }, [primeDecoder]);

  // Scroll → target time
  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    if (!section) return;

    const update = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = section.offsetHeight - vh;
      const scrolled = -rect.top;
      let p = total > 0 ? scrolled / total : 0;
      if (p < 0) p = 0;
      if (p > 1) p = 1;
      setProgress(p);
      const dur = durationRef.current;
      if (dur > 0) targetRef.current = p * dur;
    };

    update();
    const onScroll = () => update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);

    const tick = () => {
      const v = videoRef.current;
      if (v && durationRef.current > 0) {
        const t = targetRef.current;
        const c = currentRef.current;
        const next = c + (t - c) * 0.18;
        currentRef.current = next;
        if (v.readyState >= 2 && Math.abs(next - v.currentTime) > 0.008) {
          try {
            // All-intra encode → fastSeek is frame-accurate and much faster on Safari.
            if (typeof (v as HTMLVideoElement & { fastSeek?: (t: number) => void }).fastSeek === "function") {
              (v as HTMLVideoElement & { fastSeek: (t: number) => void }).fastSeek(next);
            } else {
              v.currentTime = next;
            }
          } catch {}
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{ height: reduced ? "100dvh" : "250vh", background: "#0A0A0B" }}
      aria-label="Step inside the workshop"
    >
      <div
        className="sticky top-0 w-full overflow-hidden"
        style={{ height: "100dvh" }}
      >
        {reduced ? (
          <img
            src={POSTER}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <>
            <img
              src={POSTER}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: metaLoaded ? 0 : 1, transition: "opacity 0.4s ease" }}
            />
            <video
              ref={(el) => {
                videoRef.current = el;
                if (el) {
                  el.muted = true;
                  el.defaultMuted = true;
                  el.setAttribute("muted", "");
                  el.setAttribute("playsinline", "");
                  el.setAttribute("webkit-playsinline", "");
                  el.addEventListener("loadedmetadata", onMeta);
                }
              }}
              className="absolute inset-0 w-full h-full object-cover"
              poster={POSTER}
              muted
              playsInline
              preload="auto"
              aria-hidden
            >
              <source src={SCRUB_WEBM} type="video/webm" />
              <source src={SCRUB_MP4} type="video/mp4" />
            </video>
          </>
        )}

        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(80% 65% at 50% 55%, rgba(0,0,0,0) 0%, rgba(10,10,11,0.55) 90%)",
          }}
        />

        {/* Eyebrow */}
        <div
          className="absolute top-[calc(env(safe-area-inset-top)+96px)] inset-x-0 flex justify-center pointer-events-none"
          style={{
            opacity: Math.max(0, 1 - progress / 0.15),
            transition: "opacity 0.15s linear",
          }}
        >
          <span className="text-[10px] md:text-[11px] tracking-[0.5em] uppercase text-neutral-200">
            Step Inside
          </span>
        </div>

        <ServicesMarquee />
      </div>
    </section>
  );
}
