import { useEffect, useState } from "react";
import { useOverlay } from "../lib/overlay-context";
import { useAuth } from "../lib/auth-context";
import { site } from "../content/site";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { open, active, close } = useOverlay();
  const { user } = useAuth();
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const menuOpen = active === "menu";
  const initial = user?.email?.[0]?.toUpperCase() ?? "";

  return (
    <header
      className={`fixed top-0 inset-x-0 z-[110] transition-all duration-300 ${scrolled ? "frost py-3" : "py-5"}`}
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
    >
      <div className="mx-auto max-w-[1400px] px-5 md:px-8 flex items-center justify-between gap-4">
        <span
          className="slogan-amatic whitespace-nowrap leading-none"
          style={{ fontSize: "clamp(1.1rem, 4.5vw, 1.6rem)" }}
        >
          {site.slogan}
        </span>

        <div className="flex items-center gap-3">
          {user && (
            <div
              aria-label={`Signed in as ${user.email}`}
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold border border-white/15"
              style={{ background: "linear-gradient(180deg,#FFA940,#F08A1D)", color: "#0A0A0B" }}
            >
              {initial}
            </div>
          )}
          <button
            onClick={() => (menuOpen ? close() : open("menu"))}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="w-11 h-11 flex flex-col items-center justify-center gap-[5px] group"
            data-interactive
          >
            <span
              className={`block h-[2px] w-6 bg-[linear-gradient(90deg,#E8E8EC,#9BA0A8)] group-hover:bg-[#F08A1D] transition-all ${
                menuOpen ? "rotate-45 translate-y-[7px]" : ""
              }`}
            />
            <span
              className={`block h-[2px] w-6 bg-[linear-gradient(90deg,#E8E8EC,#9BA0A8)] group-hover:bg-[#F08A1D] transition-opacity ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-[2px] w-6 bg-[linear-gradient(90deg,#E8E8EC,#9BA0A8)] group-hover:bg-[#F08A1D] transition-all ${
                menuOpen ? "-rotate-45 -translate-y-[7px]" : ""
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
