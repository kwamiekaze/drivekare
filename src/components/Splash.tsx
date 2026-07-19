import { useCallback, useEffect, useRef, useState } from "react";
import { site } from "../content/site";

const KEY = "dk_splash_done_v1";
const SPLASH_MP4 = "/videos/bear-splash-v1.mp4";
const SPLASH_WEBM = "/videos/bear-splash-v1.webm";
const SPLASH_POSTER = "/videos/bear-splash-poster-v1.jpg";

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
    setTimeout(() => setGone(true), 400);
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
        opacity: leaving ? 0 : 1,
        transition: "opacity 350ms ease-out",
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

      <div
        className="absolute bottom-8 inset-x-0 flex justify-center text-[10px] tracking-[0.4em] text-neutral-300 pointer-events-none"
        style={{ opacity: 0, animation: "dkSplashTap 0.8s ease 0.9s forwards" }}
      >
        {site.splash.tapLabel}
      </div>

      <style>{`
        @keyframes dkSplashTap { to { opacity: 0.85; } }
      `}</style>
    </div>
  );
}

