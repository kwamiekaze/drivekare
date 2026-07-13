import { Link } from "@tanstack/react-router";
import { site, media } from "../content/site";
import { MediaSlot } from "./MediaSlot";

export function Finale() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#0A0A0B]">
      <div className="absolute inset-0 opacity-40">
        <MediaSlot slot={media.roadVideo} className="w-full h-full" />
      </div>
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,10,11,0.9), rgba(10,10,11,0.4), rgba(10,10,11,0.95))" }} />
      <div className="relative mx-auto max-w-[1400px] px-5 md:px-10 py-32 w-full">
        <h2 className="font-display uppercase steel text-[18vw] md:text-[13vw] leading-[0.85]">
          {site.finale.title}
        </h2>
        <div className="mt-10">
          <Link
            to={site.hero.ctaHref}
            data-interactive
            className="inline-flex items-center gap-3 px-8 py-5 text-[11px] tracking-[0.32em] uppercase font-semibold text-black rounded-full ignition-glow"
            style={{ background: "linear-gradient(180deg,#FFA940,#F08A1D)" }}
          >
            {site.finale.cta} <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
