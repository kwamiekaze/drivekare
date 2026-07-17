import { useCallback, useEffect, useRef, useState } from "react";
import { site } from "../content/site";
import dkLogo from "../assets/dk-logo.png.asset.json";

const KEY = "dk_splash_done_v1";
const SPLASH_MP4 = "/videos/garage-splash-v1.mp4";
const SPLASH_WEBM = "/videos/garage-splash-v1.webm";
const SPLASH_POSTER = "/videos/garage-splash-poster-v1.jpg";

export function Splash() {
  const [gone, setGone] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [reduced, setReduced] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const leftRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const done = sessionStorage.getItem(KEY);
    if (!done) setGone(false);
  }, []);

  const leave = useCallback(() => {
    if (leftRef.current) return;
    leftRef.current = true;
    setLeaving(true);
    try { sessionStorage.setItem(KEY, "1"); } catch {}
    // Fire dismiss immediately inside user gesture so hero video play() is allowed
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("dk-splash-dismissed"));
    }
    setTimeout(() => setGone(true), 900);
  }, []);

  const videoCbRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;
    el.setAttribute("muted", "");
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");
    el.setAttribute("autoplay", "");
    const tryPlay = () => {
      el.muted = true;
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    tryPlay();
    el.addEventListener("loadedmetadata", tryPlay);
    el.addEventListener("canplay", tryPlay);
    el.addEventListener("ended", () => leave());
  }, [leave]);

  // Safety cap: never block longer than the clip duration + small buffer (~9s)
  useEffect(() => {
    if (gone) return;
    const t = setTimeout(() => leave(), 9000);
    return () => clearTimeout(t);
  }, [gone, leave]);

  if (gone) return null;

  return (
    <div
      onClick={leave}
      className="fixed inset-0 z-[200] bg-[#0A0A0B] overflow-hidden cursor-pointer"
      style={{
        clipPath: leaving ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)",
        transition: "clip-path 0.9s cubic-bezier(0.76,0,0.24,1)",
      }}
      aria-label="Intro"
    >
      {reduced ? (
        <img
          src={SPLASH_POSTER}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.85 }}
        />
      ) : (
        <video
          ref={videoCbRef}
          className="absolute inset-0 w-full h-full object-cover"
          poster={SPLASH_POSTER}
          muted
          playsInline
          autoPlay
          preload="auto"
          aria-hidden
        >
          <source src={SPLASH_WEBM} type="video/webm" />
          <source src={SPLASH_MP4} type="video/mp4" />
        </video>
      )}

      {/* Vignette to lift overlay legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(70% 60% at 50% 45%, rgba(0,0,0,0) 0%, rgba(10,10,11,0.55) 78%, rgba(10,10,11,0.85) 100%)",
        }}
      />

      {/* Wordmark centered */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img
          src={dkLogo.url}
          alt={site.brand}
          draggable={false}
          className="select-none"
          style={{
            height: "clamp(96px, 18vw, 220px)",
            width: "auto",
            opacity: 0,
            transform: "scale(0.92)",
            animation: "dkSplashMark 1.1s cubic-bezier(0.2,0.9,0.2,1) 0.25s forwards",
            filter: "drop-shadow(0 6px 30px rgba(0,0,0,0.55))",
          }}
        />
      </div>

      <div
        className="absolute bottom-8 inset-x-0 flex justify-center text-[10px] tracking-[0.4em] text-neutral-300 pointer-events-none"
        style={{ opacity: 0, animation: "dkSplashTap 0.8s ease 0.9s forwards" }}
      >
        {site.splash.tapLabel}
      </div>

      <style>{`
        @keyframes dkSplashMark {
          0% { opacity: 0; transform: scale(0.92); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes dkSplashTap {
          to { opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}
