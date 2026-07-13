import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { site } from "../content/site";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "frost py-3" : "py-6"}`}
    >
      <div className="mx-auto max-w-[1400px] px-5 md:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group" data-interactive>
          <DKMonogram />
          <span className="font-display uppercase tracking-[0.2em] text-sm md:text-base steel">
            {site.brand}
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {site.nav.map((n) => {
            const isRoute = n.href.startsWith("/");
            const cls = "relative text-xs uppercase tracking-[0.28em] text-neutral-300 hover:text-white transition-colors dk-nav-link";
            return isRoute ? (
              <Link key={n.href} to={n.href} className={cls} data-interactive>
                {n.label}
              </Link>
            ) : (
              <a key={n.href} href={n.href} className={cls} data-interactive>
                {n.label}
              </a>
            );
          })}
        </nav>
        <Link
          to="/book"
          data-interactive
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-[11px] tracking-[0.28em] uppercase font-medium text-black ignition-glow rounded-full"
          style={{ background: "linear-gradient(180deg,#FFA940,#F08A1D)" }}
        >
          Book Now
        </Link>
        <Link
          to="/book"
          data-interactive
          className="md:hidden inline-flex items-center px-3 py-2 text-[10px] tracking-[0.24em] uppercase text-black rounded-full"
          style={{ background: "linear-gradient(180deg,#FFA940,#F08A1D)" }}
        >
          Book
        </Link>
      </div>
      <style>{`
        .dk-nav-link::after {
          content: ""; position: absolute; left: 0; right: 100%; bottom: -6px;
          height: 1px; background: #F08A1D; transition: right 0.3s ease;
        }
        .dk-nav-link:hover::after { right: 0; }
      `}</style>
    </header>
  );
}

export function DKMonogram({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <defs>
        <linearGradient id="dk-steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F2F3F5" />
          <stop offset="0.5" stopColor="#9BA0A8" />
          <stop offset="1" stopColor="#5B6068" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="8" fill="#0A0A0B" stroke="url(#dk-steel)" />
      <text
        x="50%" y="55%" textAnchor="middle" dominantBaseline="middle"
        fontFamily="Anton, Archivo Black, sans-serif" fontSize="18"
        fill="url(#dk-steel)"
      >DK</text>
      <rect x="6" y="30" width="28" height="2" fill="#F08A1D" />
    </svg>
  );
}
