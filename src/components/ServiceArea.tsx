import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { site } from "../content/site";
import { MapPin } from "lucide-react";

export function ServiceArea() {
  const [zip, setZip] = useState("");
  return (
    <section className="relative py-28 md:py-40 overflow-hidden">
      <div className="absolute inset-0 carbon opacity-40" />
      <div className="relative mx-auto max-w-[1400px] px-5 md:px-10 grid md:grid-cols-2 gap-14 items-center">
        <div>
          <div className="text-[10px] tracking-[0.5em] uppercase text-[#F08A1D] mb-4">Coverage</div>
          <h2 className="font-display uppercase steel text-[12vw] md:text-[7vw] leading-[0.85]">
            {site.area.title}
          </h2>
          <p className="mt-5 text-neutral-400 max-w-md">{site.area.copy}</p>
          <form
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder={site.area.placeholder}
              className="flex-1 bg-transparent border border-white/15 rounded-full px-5 py-4 text-sm placeholder:text-neutral-500 focus:border-[#F08A1D] focus:outline-none transition-colors"
              data-interactive
            />
            <Link
              to="/book"
              search={{ zip } as never}
              data-interactive
              className="inline-flex items-center justify-center px-7 py-4 text-[11px] tracking-[0.32em] uppercase font-semibold text-black rounded-full ignition-glow"
              style={{ background: "linear-gradient(180deg,#FFA940,#F08A1D)" }}
            >
              {site.area.cta}
            </Link>
          </form>
        </div>

        <div className="relative aspect-square max-w-[520px] mx-auto w-full">
          <div className="absolute inset-0 flex items-center justify-center">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="absolute rounded-full border"
                style={{
                  width: 40, height: 40,
                  borderColor: "rgba(240,138,29,0.6)",
                  animation: `pulse-ring 3.6s cubic-bezier(0.4,0,0.2,1) ${i * 0.9}s infinite`,
                }}
              />
            ))}
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center ignition-glow" style={{ background: "linear-gradient(180deg,#1a1c1f,#0A0A0B)" }}>
              <MapPin size={28} className="text-[#F08A1D]" strokeWidth={1.5} />
            </div>
          </div>
          <div className="absolute inset-0 rounded-full border border-white/5" />
          <div className="absolute inset-6 rounded-full border border-white/5" />
          <div className="absolute inset-16 rounded-full border border-white/5" />
        </div>
      </div>
    </section>
  );
}
