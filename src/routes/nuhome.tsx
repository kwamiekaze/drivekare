import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RigInput } from "../components/garage/CameraRig";
import { Nav } from "../components/Nav";
import { Overlays } from "../components/Overlays";
import { Splash } from "../components/Splash";
import { AuthProvider } from "../lib/auth-context";
import { OverlayProvider, useOverlay } from "../lib/overlay-context";
import { site } from "../content/site";
import { serviceFor, VIEWS, type ViewId } from "../content/nuhome";

const GarageCanvas = lazy(() => import("../components/garage/GarageCanvas"));

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
        <Garage />
        <Overlays />
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

function Garage() {
  const { open } = useOverlay();
  const [activeId, setActiveId] = useState<ViewId>("welcome");
  const [ready, setReady] = useState(false);
  const [introStarted, setIntroStarted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const view = useMemo(() => VIEWS.find((v) => v.id === activeId) ?? VIEWS[0]!, [activeId]);
  const service = serviceFor(view);

  const input = useRef<RigInput>({ dragX: 0, dragY: 0, zoom: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const t = window.setTimeout(() => setReady(true), 1200);
    // Start the camera walk once the intro clip is gone (or straight away if it
    // already played this session).
    let splashSeen = false;
    try {
      splashSeen = sessionStorage.getItem("dk_splash_done_v1") === "1";
    } catch {}
    const start = () => setIntroStarted(true);
    if (splashSeen) start();
    window.addEventListener("dk-splash-dismissed", start);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("dk-splash-dismissed", start);
    };
  }, []);

  const book = useCallback(() => {
    try {
      if (service) sessionStorage.setItem("dk_book_service", service.name);
    } catch {}
    open("book");
  }, [open, service]);

  const select = useCallback((id: ViewId) => {
    setActiveId(id);
    input.current.dragX = 0;
    input.current.dragY = 0;
    input.current.zoom = 0;
  }, []);

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

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-[#0A0A0B] text-neutral-100">
      <Splash />
      <Nav />

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
          <GarageCanvas view={view} input={input} reducedMotion={reducedMotion} introStarted={introStarted} />
        </Suspense>
      </div>

      {/* loading veil */}
      <div
        className={`pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-[#0A0A0B] transition-opacity duration-700 ${
          ready ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden={ready}
      >
        <p className="font-display uppercase text-3xl md:text-5xl steel">Opening the garage</p>
      </div>

      {/* bay rail, desktop */}
      <nav aria-label="Garage bays" className="absolute left-5 top-1/2 z-30 hidden -translate-y-1/2 md:block">
        <ul className="frost chrome-border rounded-2xl p-2 space-y-0.5 w-52">
          {VIEWS.map((v) => (
            <li key={v.id}>
              <button
                onClick={() => select(v.id)}
                aria-current={v.id === activeId}
                className={`w-full text-left rounded-xl px-3 py-2 text-[11px] uppercase tracking-[0.22em] transition-colors ${
                  v.id === activeId ? "bg-[#F08A1D] text-black font-semibold" : "text-neutral-300 hover:bg-white/5"
                }`}
              >
                {v.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* bay panel */}
      <section
        key={view.id}
        aria-live="polite"
        className="nu-panel absolute inset-x-0 bottom-[4.5rem] z-30 mx-auto w-[calc(100%-1.5rem)] frost chrome-border rounded-2xl p-4 sm:p-5 md:inset-x-auto md:right-6 md:bottom-6 md:w-[27rem]"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="font-display uppercase text-2xl sm:text-3xl leading-none steel">{view.title}</h1>
          {service && <span className="text-[11px] uppercase tracking-[0.24em] text-[#F08A1D]">{service.from}</span>}
        </div>
        {service ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {service.bullets.map((b) => (
              <li key={b} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300">
                {b}
              </li>
            ))}
          </ul>
        ) : (
          view.line && <p className="mt-2 hidden max-w-prose text-sm text-neutral-300 sm:block">{view.line}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4">
          <button
            onClick={book}
            className="inline-flex items-center gap-3 px-4 py-3 text-[10px] tracking-[0.2em] sm:px-6 sm:text-[11px] sm:tracking-[0.28em] uppercase font-semibold text-black rounded-full ignition-glow"
            style={{ background: "linear-gradient(180deg,#FFA940,#F08A1D)" }}
          >
            {service ? `Book ${service.name}` : site.hero.cta}
          </button>
          <button
            onClick={() => open("services")}
            className="inline-flex items-center px-4 py-3 text-[10px] tracking-[0.2em] sm:px-5 sm:text-[11px] sm:tracking-[0.28em] uppercase text-neutral-200 rounded-full border border-white/15 hover:bg-white/5"
          >
            All services
          </button>
        </div>
      </section>

      {/* bay chips, phone */}
      <nav aria-label="Garage bays" className="absolute inset-x-0 bottom-0 z-30 md:hidden">
        <ul className="flex snap-x gap-1.5 overflow-x-auto px-3 py-3 [scrollbar-width:none]">
          {VIEWS.map((v) => (
            <li key={v.id} className="snap-start shrink-0">
              <button
                onClick={() => select(v.id)}
                aria-current={v.id === activeId}
                className={`rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.22em] ${
                  v.id === activeId ? "bg-[#F08A1D] text-black font-semibold" : "frost text-neutral-200"
                }`}
              >
                {v.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <p className="pointer-events-none absolute left-6 bottom-6 z-20 hidden text-[10px] uppercase tracking-[0.3em] text-neutral-500 lg:block">
        Drag to look around
      </p>
    </main>
  );
}
