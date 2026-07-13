import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { site } from "../content/site";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { CustomCursor } from "../components/CustomCursor";
import { ScrollProgress } from "../components/ScrollProgress";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: `Book — ${site.meta.title}` },
      { name: "description", content: "Book your DriveKare mobile auto care service." },
      { property: "og:title", content: `Book — ${site.brand}` },
      { property: "og:description", content: "Book your DriveKare mobile auto care service." },
      { property: "og:url", content: "/book" },
    ],
    links: [{ rel: "canonical", href: "/book" }],
  }),
  component: BookPage,
});

type FormState = {
  service: string;
  make: string;
  model: string;
  year: string;
  address: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
};

const empty: FormState = {
  service: "", make: "", model: "", year: "",
  address: "", date: "", time: "",
  name: "", email: "", phone: "",
};

function BookPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const steps = site.booking.steps;
  const progress = ((step + 1) / steps.length) * 100;

  const update = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  const validateStep = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (step === 0 && !form.service) e.service = "Choose a service.";
    if (step === 1) {
      if (!form.make) e.make = "Required";
      if (!form.model) e.model = "Required";
      if (!form.year || Number(form.year) < 1950) e.year = "Enter a valid year";
    }
    if (step === 2) {
      if (!form.address) e.address = "Required";
      if (!form.date) e.date = "Required";
      if (!form.time) e.time = "Required";
    }
    if (step === 3) {
      if (!form.name) e.name = "Required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
      if (!/[\d]{7,}/.test(form.phone.replace(/\D/g, ""))) e.phone = "Enter a valid phone";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    if (step === steps.length - 1) return submit();
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = () => {
    if (typeof window === "undefined") return;
    const submissions = JSON.parse(localStorage.getItem("dk_bookings") || "[]");
    submissions.push({ ...form, at: new Date().toISOString() });
    localStorage.setItem("dk_bookings", JSON.stringify(submissions));
    setDone(true);
    fireSparks();
  };

  const sparksRef = useRef<HTMLCanvasElement>(null);
  const fireSparks = () => {
    const c = sparksRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const DPR = Math.min(2, window.devicePixelRatio);
    c.width = window.innerWidth * DPR; c.height = window.innerHeight * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    type P = { x: number; y: number; vx: number; vy: number; life: number; hue: number };
    const parts: P[] = [];
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    for (let i = 0; i < 180; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 8 + 2;
      parts.push({ x: cx, y: cy, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 1, hue: 30 + Math.random() * 25 });
    }
    let raf = 0;
    const step = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      parts.forEach((p) => {
        p.vy += 0.15;
        p.x += p.vx; p.y += p.vy;
        p.life -= 0.012;
        ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${Math.max(0, p.life)})`;
        ctx.fillRect(p.x, p.y, 3, 3);
      });
      if (parts.some((p) => p.life > 0)) raf = requestAnimationFrame(step);
      else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
    raf = requestAnimationFrame(step);
    setTimeout(() => cancelAnimationFrame(raf), 4000);
  };

  const summary = useMemo(() => Object.entries(form).filter(([, v]) => v), [form]);

  return (
    <div className="relative bg-[#0A0A0B] text-neutral-100 min-h-screen">
      <ScrollProgress />
      <CustomCursor />
      <Nav />
      <canvas ref={sparksRef} className="fixed inset-0 pointer-events-none z-[300]" />

      <main className="pt-32 md:pt-40 pb-24 px-5 md:px-10">
        <div className="mx-auto max-w-[900px]">
          <div className="text-[10px] tracking-[0.5em] uppercase text-[#F08A1D] mb-4">Booking</div>
          <h1 className="font-display uppercase steel text-[12vw] md:text-[6vw] leading-none">
            {site.booking.title}
          </h1>

          {!done && (
            <>
              <div className="mt-12 mb-4 flex items-center justify-between text-[10px] tracking-[0.3em] uppercase text-neutral-500">
                <span>Step {step + 1} / {steps.length}</span>
                <span className="text-neutral-300">{steps[step]}</span>
              </div>
              <div className="h-[2px] w-full bg-white/5 mb-14">
                <div className="h-full transition-transform duration-500 origin-left" style={{ transform: `scaleX(${progress / 100})`, background: "linear-gradient(90deg,#F08A1D,#FFA940)" }} />
              </div>

              <div className="grid gap-5">
                {step === 0 && (
                  <Field label="Service" error={errors.service}>
                    <select value={form.service} onChange={update("service")} className={inputCls} data-interactive>
                      <option value="">Select service…</option>
                      {site.services.items.map((s) => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </Field>
                )}
                {step === 1 && (
                  <>
                    <Field label="Make" error={errors.make}>
                      <input className={inputCls} value={form.make} onChange={update("make")} placeholder="Porsche" data-interactive />
                    </Field>
                    <Field label="Model" error={errors.model}>
                      <input className={inputCls} value={form.model} onChange={update("model")} placeholder="911" data-interactive />
                    </Field>
                    <Field label="Year" error={errors.year}>
                      <input className={inputCls} value={form.year} onChange={update("year")} placeholder="2024" inputMode="numeric" data-interactive />
                    </Field>
                  </>
                )}
                {step === 2 && (
                  <>
                    <Field label="Address" error={errors.address}>
                      <input className={inputCls} value={form.address} onChange={update("address")} placeholder="1 Main St, City" data-interactive />
                    </Field>
                    <div className="grid grid-cols-2 gap-5">
                      <Field label="Date" error={errors.date}>
                        <input type="date" className={inputCls} value={form.date} onChange={update("date")} data-interactive />
                      </Field>
                      <Field label="Time" error={errors.time}>
                        <input type="time" className={inputCls} value={form.time} onChange={update("time")} data-interactive />
                      </Field>
                    </div>
                  </>
                )}
                {step === 3 && (
                  <>
                    <Field label="Name" error={errors.name}>
                      <input className={inputCls} value={form.name} onChange={update("name")} data-interactive />
                    </Field>
                    <Field label="Email" error={errors.email}>
                      <input className={inputCls} value={form.email} onChange={update("email")} type="email" data-interactive />
                    </Field>
                    <Field label="Phone" error={errors.phone}>
                      <input className={inputCls} value={form.phone} onChange={update("phone")} type="tel" data-interactive />
                    </Field>
                  </>
                )}
                {step === 4 && (
                  <div className="rounded-2xl border border-white/10 p-6 md:p-8 bg-[#0F0F11]">
                    <div className="text-[10px] tracking-[0.4em] uppercase text-[#F08A1D] mb-4">Confirm</div>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {summary.map(([k, v]) => (
                        <div key={k} className="flex justify-between border-b border-white/5 pb-2">
                          <dt className="text-neutral-500 uppercase tracking-widest text-[10px]">{k}</dt>
                          <dd className="text-neutral-200">{String(v)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>

              <div className="mt-10 flex items-center justify-between">
                <button
                  onClick={back}
                  disabled={step === 0}
                  data-interactive
                  className="text-[11px] tracking-[0.32em] uppercase text-neutral-400 hover:text-white disabled:opacity-30"
                >
                  ← Back
                </button>
                <button
                  onClick={next}
                  data-interactive
                  className="inline-flex items-center gap-3 px-7 py-4 text-[11px] tracking-[0.32em] uppercase font-semibold text-black rounded-full ignition-glow"
                  style={{ background: "linear-gradient(180deg,#FFA940,#F08A1D)" }}
                >
                  {step === steps.length - 1 ? "Confirm Booking" : "Next"} →
                </button>
              </div>
            </>
          )}

          {done && (
            <div className="mt-16 text-center">
              <h2 className="font-display uppercase steel-hot text-[12vw] md:text-[7vw] leading-none">
                {site.booking.successTitle}
              </h2>
              <p className="mt-6 text-neutral-400 max-w-md mx-auto">{site.booking.successCopy}</p>
              <div className="mt-10 rounded-2xl border border-white/10 p-6 md:p-8 bg-[#0F0F11] text-left max-w-lg mx-auto">
                <dl className="grid grid-cols-1 gap-3 text-sm">
                  {summary.map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-white/5 pb-2">
                      <dt className="text-neutral-500 uppercase tracking-widest text-[10px]">{k}</dt>
                      <dd className="text-neutral-200">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <Link
                to="/"
                data-interactive
                className="mt-10 inline-flex items-center gap-3 px-7 py-4 text-[11px] tracking-[0.32em] uppercase font-semibold text-black rounded-full ignition-glow"
                style={{ background: "linear-gradient(180deg,#FFA940,#F08A1D)" }}
              >
                ← Back Home
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

const inputCls = "w-full bg-transparent border border-white/15 rounded-lg px-4 py-3.5 text-sm focus:border-[#F08A1D] focus:outline-none transition-colors";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-400">{label}</span>
        {error && <span className="text-[10px] text-[#F08A1D]">{error}</span>}
      </div>
      {children}
    </label>
  );
}
