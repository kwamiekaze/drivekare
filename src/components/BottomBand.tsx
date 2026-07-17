import { site } from "../content/site";
import dkLogo from "../assets/dk-logo.png.asset.json";

export function BottomBand() {
  return (
    <section
      className="relative w-full flex flex-col items-center justify-center gap-5 py-16 px-6"
      style={{ background: "#0A0A0B", minHeight: "60vh" }}
      aria-label="Brand outro"
    >
      <img
        src={dkLogo.url}
        alt={site.brand}
        draggable={false}
        className="select-none"
        style={{ height: "clamp(64px, 10vw, 120px)", filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.5))" }}
      />
      <div className="slogan-amatic uppercase text-center">{site.splash.tagline}</div>
      <div className="text-[10px] tracking-[0.4em] uppercase text-neutral-500 text-center">
        {site.brand} · {site.domain}
      </div>
    </section>
  );
}
