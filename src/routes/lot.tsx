import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { OverlayThemeContext, Overlays } from "../components/Overlays";
import { AuthProvider, useAuth } from "../lib/auth-context";
import { OverlayProvider, useOverlay } from "../lib/overlay-context";
import { site } from "../content/site";
import { CUSTOMERS } from "../content/lot";
import { BRAND_LOGO } from "../components/garage/brand";
import { lotStore, useLot } from "../components/lot/store";
import { KindIcon } from "../components/lot/Pin";
import type { LotInput } from "../components/lot/LotCanvas";

const LotCanvas = lazy(() => import("../components/lot/LotCanvas"));

export const Route = createFileRoute("/lot")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `DriveKare Parking Lot | ${site.slogan}` },
      { name: "description", content: "Six drivers, six problems. Watch the DriveKare bear roll up in the van and fix each car where it is parked." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LotPage,
});

function LotPage() {
  return (
    <AuthProvider>
      <OverlayProvider>
        <OverlayThemeContext.Provider value="glass">
          <Lot />
          <Overlays />
        </OverlayThemeContext.Provider>
      </OverlayProvider>
    </AuthProvider>
  );
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function Header({ menuOpen, onMenu }: { menuOpen: boolean; onMenu: () => void }) {
  const { user } = useAuth();
  return (
    <header className="nu-glass absolute inset-x-0 top-0 z-[120] border-x-0 border-t-0" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 md:h-16 md:px-6">
        <a href="/lot" className="flex min-w-0 items-center gap-2.5" aria-label="DriveKare, back to the lot">
          <img src={BRAND_LOGO} alt="" className="h-7 w-auto shrink-0 md:h-8" draggable={false} />
          <span className="slogan-amatic hidden truncate min-[400px]:inline text-[0.95rem] leading-none sm:text-[1.1rem] md:text-[1.35rem]">{site.slogan}</span>
        </a>
        <div className="flex items-center gap-2">
          {user?.email && (
            <span aria-label={`Signed in as ${user.email}`} className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-black" style={{ background: "linear-gradient(180deg,#FFA940,#F08A1D)" }}>
              {user.email[0]!.toUpperCase()}
            </span>
          )}
          <button
            onClick={onMenu}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-10 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3.5 text-[10px] uppercase tracking-[0.28em] text-white hover:border-[#F08A1D] sm:px-4"
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
      <nav aria-label="Main menu" onClick={(e) => e.stopPropagation()} className="nu-glass nu-overlay-in absolute right-3 top-[calc(env(safe-area-inset-top)+4rem)] w-[min(20rem,calc(100%-1.5rem))] rounded-3xl p-2 md:right-6 md:top-[calc(env(safe-area-inset-top)+4.6rem)]">
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
            <span className="text-sm text-white/40" aria-hidden="true">›</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/** Sun and moon on one slider: the same lot at any hour between the two photos. */
function DayNight() {
  const [d, setD] = useState(1);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setD((prev) => (Math.abs(prev - lotStore.day) > 0.01 ? lotStore.day : prev));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const night = d < 0.5;
  return (
    <div className="nu-glass flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-4">
      <button
        onClick={() => {
          lotStore.dayTarget = night ? 1 : 0;
        }}
        aria-label={night ? "Switch to day" : "Switch to night"}
        className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-white/10 text-lg hover:border-[#F08A1D]"
      >
        <span aria-hidden="true">{night ? "🌙" : "☀️"}</span>
      </button>
      <label className="flex w-28 flex-col gap-1 sm:w-40">
        <span className="sr-only">Time of day</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={lotStore.dayTarget}
          onChange={(e) => {
            lotStore.dayTarget = Number(e.target.value);
            lotStore.day = Number(e.target.value);
          }}
          className="lot-range"
          aria-label="Time of day, night to day"
        />
      </label>
    </div>
  );
}

function Lot() {
  const s = useLot();
  const { open } = useOverlay();
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [tour, setTour] = useState(false);
  const input = useRef<LotInput>({ az: 0, pol: 0, zoom: 0, idle: 0 });
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; zoom: number } | null>(null);
  const lastTouch = useRef(0);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setMobile(window.innerWidth < 768);
    lastTouch.current = performance.now();
    const t = window.setTimeout(() => setReady(true), 1400);
    const id = window.setInterval(() => {
      input.current.idle = (performance.now() - lastTouch.current) / 1000;
    }, 500);
    // ?time=night opens on the floodlit lot, as the Fixing365 pages do
    const q = new URLSearchParams(window.location.search).get("time");
    if (q === "night") lotStore.dayTarget = lotStore.day = 0;
    return () => {
      window.clearTimeout(t);
      window.clearInterval(id);
      lotStore.reset();
    };
  }, []);

  // Tour: send the van to each driver in turn, one at a time.
  useEffect(() => {
    if (!tour) return;
    const busy = CUSTOMERS.some((c) => ["enroute", "working", "wrapup", "leaving"].includes(s.jobs[c.id]!.phase));
    if (busy) return;
    const next = CUSTOMERS.find((c) => s.jobs[c.id]!.phase === "issue");
    if (!next) {
      setTour(false);
      return;
    }
    const id = window.setTimeout(() => {
      lotStore.select(next.id);
      lotStore.dispatch(next.id);
    }, 900);
    return () => window.clearTimeout(id);
  }, [tour, s.version, s.jobs]);

  const sel = s.selected ? CUSTOMERS.find((c) => c.id === s.selected) ?? null : null;
  const selJob = sel ? s.jobs[sel.id]! : null;
  const fixed = s.fixed;
  const active = open;
  void active;

  const choose = useCallback((id: string | null) => {
    setTour(false);
    lotStore.select(id);
  }, []);

  const touch = () => {
    lastTouch.current = performance.now();
    input.current.idle = 0;
  };
  const onPointerDown = (e: React.PointerEvent) => {
    touch();
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(a!.x - b!.x, a!.y - b!.y), zoom: input.current.zoom };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    touch();
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      if (pinch.current) input.current.zoom = clamp(pinch.current.zoom - Math.log(dist / Math.max(pinch.current.d, 1)) * 2.2, -1, 1);
      return;
    }
    const k = e.pointerType === "touch" ? 0.009 : 0.006;
    input.current.az -= (e.clientX - prev.x) * k;
    input.current.pol = clamp(input.current.pol - (e.clientY - prev.y) * k * 0.7, -0.6, 0.7);
  };
  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    pinch.current = null;
    if (drag.current?.id === e.pointerId) drag.current = null;
  };

  const book = (service: string) => {
    try {
      sessionStorage.setItem("dk_book_service", service);
    } catch {}
    open("book");
  };

  const remaining = CUSTOMERS.length - fixed;
  const allDone = fixed === CUSTOMERS.length;

  return (
    <main className="lot-ui relative h-[100dvh] w-full select-none overflow-hidden bg-[#0A0A0B] text-neutral-100">
      <div
        className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={endPointer}
        onWheel={(e) => {
          touch();
          input.current.zoom = clamp(input.current.zoom + e.deltaY / 800, -1, 1);
        }}
        role="img"
        aria-label="A 3D parking lot with six customers' cars. Select a car to send the DriveKare van."
      >
        <Suspense fallback={null}>
          <LotCanvas input={input} reducedMotion={reduced} mobile={mobile} />
        </Suspense>
      </div>

      <div className={`pointer-events-none absolute inset-0 z-[130] flex flex-col items-center justify-center gap-4 bg-[#0A0A0B] transition-opacity duration-1000 ${ready ? "opacity-0" : "opacity-100"}`} aria-hidden={ready}>
        <img src={BRAND_LOGO} alt="" className="h-14 w-auto" />
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/60">Pulling into the lot</p>
      </div>

      <Header menuOpen={menuOpen} onMenu={() => setMenuOpen((m) => !m)} />
      {menuOpen && <Menu onClose={() => setMenuOpen(false)} />}

      {/* status and light controls */}
      <div className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+4rem)] z-30 flex items-start justify-between gap-2 px-3 md:top-[calc(env(safe-area-inset-top)+4.8rem)] md:px-6">
        <div className="nu-glass pointer-events-auto rounded-2xl px-4 py-2.5" aria-live="polite">
          <p className="text-[9px] uppercase tracking-[0.3em] text-[#FFB066]">Fixed today</p>
          <p className="font-display text-2xl leading-none text-white">
            {fixed}
            <span className="text-white/45"> / {CUSTOMERS.length}</span>
          </p>
        </div>
        <div className="pointer-events-auto">
          <DayNight />
        </div>
      </div>

      {/* customers, desktop rail */}
      <nav aria-label="Customers in the lot" className="absolute left-5 top-1/2 z-30 hidden -translate-y-1/2 md:block">
        <ol className="nu-glass w-60 space-y-0.5 rounded-2xl p-2">
          {CUSTOMERS.map((c) => {
            const job = s.jobs[c.id]!;
            const on = s.selected === c.id;
            return (
              <li key={c.id}>
                <button
                  onClick={() => choose(c.id)}
                  aria-current={on}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[11px] uppercase tracking-[0.18em] transition-colors ${on ? "bg-[#F08A1D] font-semibold text-black" : "text-white hover:bg-white/10"}`}
                >
                  <KindIcon kind={c.kind} className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{c.owner} · {c.label}</span>
                  <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${job.phase === "done" ? "bg-[#39e07a]" : job.phase === "issue" ? (on ? "bg-black/50" : "bg-[#F08A1D]") : "bg-[#59c8ff]"}`} />
                  <span className="sr-only">{job.phase === "done" ? "fixed" : job.phase === "issue" ? "waiting" : "in progress"}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* card */}
      <section key={sel?.id ?? "welcome"} aria-live="polite" className="nu-panel nu-glass absolute inset-x-0 bottom-[4.25rem] z-30 mx-auto w-[calc(100%-1.5rem)] overflow-hidden rounded-3xl p-4 sm:p-5 md:inset-x-auto md:bottom-6 md:right-6 md:w-[29rem]">
        <div className="nu-stagger">
          {!sel || !selJob ? (
            <>
              <p className="text-[10px] uppercase tracking-[0.34em] text-[#FFB066]">The DriveKare lot</p>
              <h1 className="mt-1 font-display text-[1.7rem] uppercase leading-none text-white sm:text-3xl">{allDone ? "Everyone drives away happy" : site.slogan}</h1>
              <p className="mt-2 text-sm text-white/90">
                {allDone
                  ? "Six cars, six fixes, nobody left their spot. Slide the sun down to see the same lot at night."
                  : "Six drivers are stuck in this parking lot. Tap a car, send the van, and watch the bear fix it where it sits."}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {allDone ? (
                  <button onClick={() => { setTour(false); lotStore.reset(); }} className="inline-flex items-center rounded-full px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-black ignition-glow" style={{ background: "linear-gradient(180deg,#FFA940,#F08A1D)" }}>
                    Start over
                  </button>
                ) : (
                  <>
                    <button onClick={() => { setTour(true); }} className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-black ignition-glow" style={{ background: "linear-gradient(180deg,#FFA940,#F08A1D)" }}>
                      <span aria-hidden="true">▶</span> {tour ? "Touring…" : "Play the day"}
                    </button>
                    <button onClick={() => { setTour(false); lotStore.dispatchAll(); }} className="inline-flex items-center rounded-full border border-white/25 bg-white/5 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-white hover:border-[#F08A1D]">
                      Send every van
                    </button>
                  </>
                )}
                <button onClick={() => open("book")} className="inline-flex items-center rounded-full border border-white/25 bg-white/5 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-white hover:border-[#F08A1D]">
                  Book a service
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.34em] text-[#FFB066]">
                <KindIcon kind={sel.kind} className="h-3.5 w-3.5" />
                {sel.owner} · {sel.car}
              </p>
              <h1 className="mt-1 font-display text-[1.7rem] uppercase leading-none text-white sm:text-3xl">
                {selJob.phase === "done" ? `${sel.label}: fixed` : sel.label}
              </h1>
              <p className="mt-2 text-sm text-white/90">
                {selJob.phase === "issue" ? `“${sel.issue}”` : selJob.phase === "enroute" ? "The DriveKare van is rolling in. ETA under a minute." : selJob.phase === "working" ? sel.fix : selJob.phase === "done" ? `${sel.owner} is back on the road. Same fix at your driveway or office.` : "Wrapping up."}
              </p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {sel.chips.map((b) => (
                  <li key={b} className="nu-chip rounded-full px-3 py-1 text-xs text-white">{b}</li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4">
                {selJob.phase === "issue" && (
                  <button onClick={() => lotStore.dispatch(sel.id)} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-black ignition-glow" style={{ background: "linear-gradient(180deg,#FFA940,#F08A1D)" }}>
                    <span aria-hidden="true">🐻</span> Send the van
                  </button>
                )}
                {selJob.phase !== "issue" && selJob.phase !== "done" && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-white">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#59c8ff]" aria-hidden="true" />
                    {selJob.phase === "enroute" ? "On the way" : "Working"}
                  </span>
                )}
                {(selJob.phase === "done" || selJob.phase === "issue") && (
                  <button onClick={() => book(sel.service)} className={`inline-flex items-center whitespace-nowrap rounded-full px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] ${selJob.phase === "done" ? "text-black ignition-glow" : "border border-white/25 bg-white/5 text-white hover:border-[#F08A1D]"}`} style={selJob.phase === "done" ? { background: "linear-gradient(180deg,#FFA940,#F08A1D)" } : undefined}>
                    Book {sel.service.toLowerCase()}
                    {sel.from ? <span className="ml-2 opacity-70">{sel.from}</span> : null}
                  </button>
                )}
                <button onClick={() => choose(null)} className="ml-auto h-10 rounded-full border border-white/20 bg-white/5 px-4 text-[10px] uppercase tracking-[0.2em] text-white hover:border-[#F08A1D]" aria-label="Back to the whole lot">
                  Whole lot
                </button>
              </div>
            </>
          )}
        </div>
        {tour && <span className="nu-progress absolute inset-x-0 bottom-0 h-[3px] bg-[#F08A1D]" style={{ animationDuration: "24s", animationIterationCount: "infinite" }} aria-hidden="true" />}
      </section>

      {/* customer chips, phone */}
      <nav aria-label="Customers in the lot" className="absolute inset-x-0 bottom-0 z-30 md:hidden">
        <ol className="flex snap-x gap-1.5 overflow-x-auto px-3 py-3 [scrollbar-width:none]">
          {CUSTOMERS.map((c) => {
            const job = s.jobs[c.id]!;
            return (
              <li key={c.id} className="shrink-0 snap-start">
                <button onClick={() => choose(c.id)} aria-current={s.selected === c.id} className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[10px] uppercase tracking-[0.18em] ${s.selected === c.id ? "bg-[#F08A1D] font-semibold text-black" : "nu-chip text-white"}`}>
                  <KindIcon kind={c.kind} className="h-3.5 w-3.5" />
                  {c.owner}
                  <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${job.phase === "done" ? "bg-[#39e07a]" : "bg-[#F08A1D]"}`} />
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      <span className="sr-only" aria-live="polite">{remaining} customers waiting</span>
    </main>
  );
}
