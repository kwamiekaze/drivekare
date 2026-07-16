import { useEffect, useRef, useState } from "react";
import { site } from "../content/site";

const KEY = "dk_splash_done_v1";

export function Splash() {
  const [gone, setGone] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Show on every homepage landing (per-session)
    const done = sessionStorage.getItem(KEY);
    if (!done) setGone(false);
  }, []);

  useEffect(() => {
    if (gone) return;
    const t = setTimeout(() => leave(), 3500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gone]);

  const leave = () => {
    if (leaving) return;
    setLeaving(true);
    sessionStorage.setItem(KEY, "1");
    setTimeout(() => setGone(true), 900);
  };

  if (gone) return null;

  const letters = Array.from(site.splash.wordmark);

  return (
    <div
      ref={rootRef}
      onClick={leave}
      className="fixed inset-0 z-[200] bg-[#0A0A0B] flex flex-col items-center justify-center overflow-hidden cursor-pointer"
      style={{
        clipPath: leaving ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)",
        transition: "clip-path 0.9s cubic-bezier(0.76,0,0.24,1)",
      }}
      aria-label="Intro"
    >
      {/* RPM arc */}
      <div className="absolute top-6 right-6 w-14 h-14">
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <circle cx="20" cy="20" r="17" stroke="#1E1F22" strokeWidth="2" fill="none" />
          <circle
            cx="20" cy="20" r="17" fill="none"
            stroke="#F08A1D" strokeWidth="2" strokeLinecap="round"
            strokeDasharray="106.8" strokeDashoffset="106.8"
            transform="rotate(-90 20 20)"
            style={{ animation: "rpm 3.3s cubic-bezier(0.6,0,0.2,1) forwards" }}
          />
        </svg>
        <style>{`@keyframes rpm { to { stroke-dashoffset: 0; } }`}</style>
      </div>

      <div className="flex items-center overflow-hidden px-6" aria-label={site.splash.wordmark}>
        {letters.map((ch, i) => (
          <span
            key={i}
            className="steel inline-block font-display uppercase text-[10vw] md:text-[7vw] leading-none tracking-tight"
            style={{
              transform: "translateY(60%)",
              opacity: 0,
              animation: `dkletter 0.7s cubic-bezier(0.2,0.9,0.2,1) forwards`,
              animationDelay: `${0.1 + i * 0.08}s`,
              filter: "drop-shadow(0 0 24px rgba(240,138,29,0.12))",
            }}
          >
            {ch}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes dkletter {
          0% { transform: translateY(80%) rotateX(40deg); opacity: 0; }
          60% { opacity: 1; }
          100% { transform: translateY(0) rotateX(0); opacity: 1; }
        }
        @keyframes dkline {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @keyframes dktag { to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div
        className="mt-6 h-[2px] w-[62%] max-w-[520px] origin-left"
        style={{
          background: "linear-gradient(90deg,transparent,#F08A1D,#FFA940,#F08A1D,transparent)",
          transform: "scaleX(0)",
          animation: "dkline 1s cubic-bezier(0.6,0,0.2,1) 1.1s forwards",
        }}
      />
      <div
        className="mt-6 slogan-amatic uppercase"
        style={{ opacity: 0, transform: "translateY(8px)", animation: "dktag 0.6s ease 1.9s forwards" }}
      >
        {site.splash.tagline}
      </div>
      <div className="absolute bottom-8 text-[10px] tracking-[0.4em] text-neutral-500">
        {site.splash.tapLabel}
      </div>
    </div>
  );
}
