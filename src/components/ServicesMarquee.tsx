import { useEffect, useState } from "react";

const ITEMS = [
  "OIL & FLUIDS",
  "MOBILE DETAILING",
  "TIRE SERVICE",
  "BATTERY & ELECTRICAL",
  "DIAGNOSTICS",
  "FLEET CARE",
];

function Row() {
  return (
    <span className="inline-flex items-center shrink-0">
      {ITEMS.map((it) => (
        <span key={it} className="inline-flex items-center shrink-0">
          <span>{it}</span>
          <span
            aria-hidden
            className="inline-block mx-6 md:mx-10 rounded-full"
            style={{
              width: "0.55em",
              height: "0.55em",
              background: "#F08A1D",
              boxShadow: "0 0 12px rgba(240,138,29,0.55)",
            }}
          />
        </span>
      ))}
    </span>
  );
}

export function ServicesMarquee() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  return (
    <div
      className="absolute inset-x-0 bottom-[6%] pointer-events-none overflow-hidden"
      aria-hidden
      style={{
        maskImage:
          "linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%)",
      }}
    >
      <div
        className="absolute inset-x-0 top-0 bottom-0 -z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <div
        className="whitespace-nowrap font-black uppercase text-white/90"
        style={{
          fontFamily: '"Anton", "Archivo Black", system-ui, sans-serif',
          fontSize: "clamp(2.2rem, 7vw, 5.5rem)",
          letterSpacing: "0.02em",
          lineHeight: 1,
          textShadow: "0 2px 20px rgba(0,0,0,0.6)",
          display: "flex",
          width: "max-content",
          animation: reduced ? undefined : "dk-marquee 38s linear infinite",
        }}
      >
        <Row />
        <Row />
      </div>
      <style>{`@keyframes dk-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}
