import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RigInput } from "../components/garage/CameraRig";
import { OverlayThemeContext, Overlays } from "../components/Overlays";
import { AuthProvider, useAuth } from "../lib/auth-context";
import { OverlayProvider, useOverlay } from "../lib/overlay-context";
import { site } from "../content/site";
import { VIEWS, type ViewId } from "../content/nuhome";
import { BRAND_LOGO } from "../components/garage/brand";

const dkLogo = { url: BRAND_LOGO };

const GarageCanvas = lazy(() => import("../components/garage/GarageCanvas"));

/** Seconds without a tap, scroll or key before the garage starts moving on its own. */
const IDLE_S = 25;
/** Seconds each bay holds while Play walks through them. */
const PLAY_S = 7;

// Test page for the 3D garage. Kept out of search until it replaces the homepage.
export const Route = createFileRoute("/nuhome")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `DriveKare Garage | ${site.slogan}` },
      { name: "description", content: site.meta.description },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: NuHome,
});

function NuHome() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
  return (
    <AuthProvider>
      <OverlayProvider>
        <OverlayThemeContext.Provider value="glass">
          <Garage />
          <Overlays />
        </OverlayThemeContext.Provider>
      </OverlayProvider>
    </AuthProvider>
  );
}

function wrapAngle(a: number) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/** Header on glass, after Fixing365: logo, slogan, one menu button. */
function Header({ menuOpen, onMenu }: { menuOpen: boolean; onMenu: () => void }) {
  const { user } = useAuth();
  return (
    <header
      className="nu-glass absolute inset-x-0 top-0 z-[120] border-x-0 border-t-0"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 md:h-16 md:px-6">
        <a
          href="/nuhome"
          className="flex min-w-0 items-center gap-2.5"
          onClick={(e) => {
            e.preventDefault();
            window.location.assign("/nuhome");
          }}
          aria-label="DriveKare, back to the garage"
        >
          <img src={dkLogo.url} alt="" className="h-7 w-auto shrink-0 md:h-8" draggable={false} />
          <span className="slogan-amatic hidden truncate min-[400px]:inline text-[0.95rem] leading-none sm:text-[1.1rem] md:text-[1.35rem]">{site.slogan}</span>
        </a>
        <div className="flex items-center gap-2">
          {user?.email && (
            <span
              aria-label={`Signed in as ${user.email}`}
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-black"
              style={{ background: "linear-gradient(180deg,#FFA940,#F08A1D)" }}
            >
              {user.email[0]!.toUpperCase()}
            </span>
          )}
          <button
            onClick={onMenu}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-10 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3.5 text-[10px] sm:px-4 uppercase tracking-[0.28em] text-white hover:border-[#F08A1D]"
          >
            <span className="relative block h-3 w-4" aria-hidden="true">
              <span className={`absolute left-0 h-[2px] w-4 bg-current transition-all ${menuOpen ? "top-[5px] rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 top-[5px] h-[2px] w-4 bg-current transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 h-[2px] w-4 bg-current transition-all ${menuOpen ? "top-[5px] -rotate-45" : "top-[10px]"}`} />
            </span>
            <span className="hidden sm:inline">{menuOpen ? "Close" : "Menu"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

/** A see-through dropdown under the header; the garage stays in view behind it. */
function Menu({ onClose }: { onClose: () => void }) {
  const { open } = useOverlay();
  const items: Array<[Parameters<typeof open>[0], string]> = [
    ["services", "Services"],
    ["about", "About"],
    ["book", "Book"],
    ["contact", "Contact"],
    ["signin", "Sign in"],
  ];
  return (
    <div className="absolute inset-0 z-[110]" onClick={onClose}>
      <nav
        aria-label="Main menu"
        onClick={(e) => e.stopPropagation()}
        className="nu-glass nu-overlay-in absolute right-3 top-[calc(env(safe-area-inset-top)+4rem)] w-[min(20rem,calc(100%-1.5rem))] rounded-3xl p-2 md:right-6 md:top-[calc(env(safe-area-inset-top)+4.6rem)]"
      >
        {items.map(([id, label], i) => (
          <button
            key={id}
            onClick={() => {
              onClose();
              open(id);
            }}
            className="nu-menu-item flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left font-display text-2xl uppercase tracking-wide text-white hover:bg-white/10 hover:text-[#F08A1D]"
            style={{ animationDelay: `${i * 45}ms` }}
          >
            {label}
            <span className="text-sm text-white/40" aria-hidden="true">
              ›
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function Garage() {
  const { open, active } = useOverlay();
  const [activeId, setActiveId] = useState<ViewId>("welcome");
  const [ready, setReady] = useState(false);
  const [idle, setIdle] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const view = useMemo(() => VIEWS.find((v) => v.id === activeId) ?? VIEWS[0]!, [activeId]);

  const input = useRef<RigInput>({ dragX: 0, dragY: 0, zoom: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const lastInput = useRef(0);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    lastInput.current = performance.now();
    const t = window.setTimeout(() => setReady(true), 900);
    const poke = () => {
      lastInput.current = performance.now();
      setIdle(false);
    };
    const events = ["pointerdown", "wheel", "keydown", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, poke, { passive: true }));
    const tick = window.setInterval(() => {
      if (performance.now() - lastInput.current > IDLE_S * 1000) setIdle(true);
    }, 1000);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(tick);
      events.forEach((e) => window.removeEventListener(e, poke));
    };
  }, []);

  // Play walks the bays left to right, then comes back to the start.
  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => {
      const i = VIEWS.findIndex((v) => v.id === activeId);
      const next = VIEWS[(i + 1) % VIEWS.length]!;
      if (next.id === "welcome") setPlaying(false);
      setActiveId(next.id);
    }, PLAY_S * 1000);
    return () => window.clearTimeout(id);
  }, [playing, activeId]);

  // An open pop-up pauses the walk-through.
  useEffect(() => {
    if (active) setPlaying(false);
  }, [active]);

  const book = useCallback(() => {
    try {
      if (view.service) sessionStorage.setItem("dk_book_service", view.service);
    } catch {}
    open("book");
  }, [open, view.service]);

  const select = useCallback((id: ViewId) => {
    setPlaying(false);
    setActiveId(id);
    input.current.dragX = 0;
    input.current.dragY = 0;
    input.current.zoom = 0;
  }, []);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      if (!p && activeId === "welcome") setActiveId(VIEWS[1]!.id);
      return !p;
    });
  }, [activeId]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(a!.x - b!.x, a!.y - b!.y), zoom: input.current.zoom };
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);
  const endPointer = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    pinch.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    lastInput.current = performance.now();
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const i = input.current;
    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      if (!pinch.current) {
        pinch.current = { distance: d, zoom: i.zoom };
        return;
      }
      i.zoom = clamp(pinch.current.zoom - Math.log(d / Math.max(pinch.current.distance, 1)) * 2.5, -1, 1);
      return;
    }
    const touch = e.pointerType === "touch";
    i.dragX = wrapAngle(i.dragX - (e.clientX - prev.x) * (touch ? 0.012 : 0.008));
    i.dragY = clamp(i.dragY + (e.clientY - prev.y) * (touch ? 0.009 : 0.006), -1, 1);
  }, []);
  const onWheel = useCallback((e: React.WheelEvent) => {
    input.current.zoom = clamp(input.current.zoom + e.deltaY / 700, -1, 1);
  }, []);

  const index = VIEWS.findIndex((v) => v.id === activeId);
  // The camera only moves on its own when the visitor has left it alone for a
  // while; Play moves between bays but each bay holds still.
  const autoMotion = idle && !playing && !reducedMotion && !active && !menuOpen;

  return (
    <main className="relative h-[100dvh] w-full select-none overflow-hidden bg-[#0A0A0B] text-neutral-100">
      <div
        className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onLostPointerCapture={endPointer}
        onPointerMove={onPointerMove}
        onWheel={onWheel}
        aria-hidden="true"
      >
        <Suspense fallback={null}>
          <GarageCanvas view={view} input={input} reducedMotion={reducedMotion} introStarted={autoMotion} />
        </Suspense>
      </div>

      <div
        className={`pointer-events-none absolute inset-0 z-[130] flex flex-col items-center justify-center gap-4 bg-[#0A0A0B] transition-opacity duration-1000 ${
          ready ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden={ready}
      >
        <img src={dkLogo.url} alt="" className="h-14 w-auto" />
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/60">Opening the garage</p>
      </div>

      <Header menuOpen={menuOpen} onMenu={() => setMenuOpen((m) => !m)} />
      {menuOpen && <Menu onClose={() => setMenuOpen(false)} />}

      {/* bay rail, desktop: left to right as they stand in the garage */}
      <nav aria-label="Garage bays" className="absolute left-5 top-1/2 z-30 hidden -translate-y-1/2 md:block">
        <ol className="nu-glass w-52 space-y-0.5 rounded-2xl p-2">
          {VIEWS.map((v, i) => (
            <li key={v.id}>
              <button
                onClick={() => select(v.id)}
                aria-current={v.id === activeId}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[11px] uppercase tracking-[0.22em] transition-colors ${
                  v.id === activeId ? "bg-[#F08A1D] font-semibold text-black" : "text-white hover:bg-white/10"
                }`}
              >
                <span className={`w-4 tabular-nums ${v.id === activeId ? "text-black/60" : "text-white/45"}`}>
                  {i === 0 ? "•" : i}
                </span>
                {v.label}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {/* bay card */}
      <section
        key={view.id}
        aria-live="polite"
        className="nu-panel nu-glass absolute inset-x-0 bottom-[4.25rem] z-30 mx-auto w-[calc(100%-1.5rem)] overflow-hidden rounded-3xl p-4 sm:p-5 md:inset-x-auto md:bottom-6 md:right-6 md:w-[29rem]"
      >
        <div className="nu-stagger">
          <p className="text-[10px] uppercase tracking-[0.34em] text-[#FFB066]">
            {index === 0 ? "DriveKare garage" : `Bay ${index} of ${VIEWS.length - 1}`}
          </p>
          <h1 className="mt-1 font-display text-[1.7rem] uppercase leading-none text-white sm:text-3xl">{view.title}</h1>
          {view.bullets?.length ? (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {view.bullets.map((b) => (
                <li key={b} className="nu-chip rounded-full px-3 py-1 text-xs text-white">
                  {b}
                </li>
              ))}
            </ul>
          ) : (
            view.line && <p className="mt-2 hidden max-w-prose text-sm text-white/90 sm:block">{view.line}</p>
          )}
          <div className="mt-3 flex items-center gap-2 sm:mt-4">
            <button
              onClick={book}
              className="inline-flex items-center whitespace-nowrap rounded-full px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-black ignition-glow sm:px-5 sm:text-[11px]"
              style={{ background: "linear-gradient(180deg,#FFA940,#F08A1D)" }}
            >
              {view.service ? `Book ${view.label === "On the Lift" ? "brakes" : view.label}` : "Book a service"}
            </button>
            <button
              onClick={togglePlay}
              aria-pressed={playing}
              aria-label={playing ? "Pause the tour of the bays" : "Play through every bay"}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/25 bg-white/5 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-white hover:border-[#F08A1D] sm:text-[11px]"
            >
              <span aria-hidden="true" className="text-[#F08A1D]">
                {playing ? "❚❚" : "▶"}
              </span>
              {playing ? "Pause" : "Play all"}
            </button>
            <div className="ml-auto hidden gap-1 sm:flex">
              <button
                onClick={() => select(VIEWS[(index - 1 + VIEWS.length) % VIEWS.length]!.id)}
                aria-label="Previous bay"
                className="h-10 w-10 rounded-full border border-white/20 bg-white/5 text-white hover:border-[#F08A1D]"
              >
                ‹
              </button>
              <button
                onClick={() => select(VIEWS[(index + 1) % VIEWS.length]!.id)}
                aria-label="Next bay"
                className="h-10 w-10 rounded-full border border-white/20 bg-white/5 text-white hover:border-[#F08A1D]"
              >
                ›
              </button>
            </div>
          </div>
        </div>
        {playing && (
          <span
            key={`p-${view.id}`}
            className="nu-progress absolute inset-x-0 bottom-0 h-[3px] bg-[#F08A1D]"
            style={{ animationDuration: `${PLAY_S}s` }}
            aria-hidden="true"
          />
        )}
      </section>

      {/* bay chips, phone */}
      <nav aria-label="Garage bays" className="absolute inset-x-0 bottom-0 z-30 md:hidden">
        <ol className="flex snap-x gap-1.5 overflow-x-auto px-3 py-3 [scrollbar-width:none]">
          {VIEWS.map((v) => (
            <li key={v.id} className="shrink-0 snap-start">
              <button
                onClick={() => select(v.id)}
                aria-current={v.id === activeId}
                className={`rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.2em] ${
                  v.id === activeId ? "bg-[#F08A1D] font-semibold text-black" : "nu-chip text-white"
                }`}
              >
                {v.label}
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </main>
  );
}
