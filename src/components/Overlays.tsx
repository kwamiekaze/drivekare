import { useEffect, useRef, useState } from "react";
import { useOverlay } from "../lib/overlay-context";
import { useAuth } from "../lib/auth-context";
import { supabase } from "../integrations/supabase/client";
import { site } from "../content/site";

/* ─────────────  Shell  ───────────── */

function OverlayShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] carbon"
      style={{
        background: "#0A0A0B",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        height: "100dvh",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="h-full w-full overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 pt-6 md:pt-8 pb-16">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <span className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-neutral-500">
              {title}
            </span>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-11 h-11 flex items-center justify-center rounded-full border border-white/10 text-neutral-300 hover:text-[#F08A1D] hover:border-[#F08A1D] transition-colors"
            >
              <span className="text-xl leading-none">×</span>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─────────────  Menu  ───────────── */

export function MenuOverlay() {
  const { active, close, open } = useOverlay();
  const { user, role, signOut } = useAuth();
  if (active !== "menu") return null;

  const items: Array<{
    key: "services" | "about" | "book" | "contact" | "signin" | "admin";
    label: string;
  }> = [
    { key: "services", label: "SERVICES" },
    { key: "about", label: "ABOUT" },
    { key: "book", label: "BOOK" },
    { key: "contact", label: "CONTACT" },
  ];
  if (!user) items.push({ key: "signin", label: "SIGN IN" });
  if (role === "admin") items.push({ key: "admin", label: "ADMIN" });

  return (
    <OverlayShell title="MENU" onClose={close}>
      <ul className="space-y-2 md:space-y-4">
        {items.map((it, i) => (
          <li key={it.key} className="dk-menu-item" style={{ animationDelay: `${i * 60}ms` }}>
            <button
              onClick={() => open(it.key)}
              className="font-display uppercase tracking-tight text-[14vw] md:text-[9vw] leading-[0.9] steel hover:text-[#F08A1D] transition-colors block text-left w-full"
            >
              {it.label}
            </button>
          </li>
        ))}
        {user && (
          <li className="dk-menu-item pt-6" style={{ animationDelay: `${items.length * 60}ms` }}>
            <button
              onClick={async () => {
                await signOut();
                close();
              }}
              className="text-xs uppercase tracking-[0.3em] text-neutral-400 hover:text-[#F08A1D] transition-colors"
            >
              Sign out ({user.email})
            </button>
          </li>
        )}
      </ul>
      <style>{`
        .dk-menu-item { opacity: 0; transform: translateY(24px); animation: dkMenuIn 0.6s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes dkMenuIn { to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </OverlayShell>
  );
}

/* ─────────────  Services  ───────────── */

export function ServicesOverlay() {
  const { active, close, open } = useOverlay();
  if (active !== "services") return null;
  return (
    <OverlayShell title="SERVICES" onClose={close}>
      <h2 className="font-display uppercase text-[12vw] md:text-[6vw] leading-[0.9] steel mb-12">
        {site.services.title}
      </h2>
      <p className="text-neutral-400 text-sm md:text-base mb-10 max-w-md">{site.services.kicker}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {site.services.items.map((s) => (
          <div
            key={s.name}
            className="chrome-border rounded-2xl p-6 md:p-7 hover:-translate-y-1 transition-transform"
          >
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="font-display uppercase text-lg tracking-wide text-white">{s.name}</h3>
              <span className="text-[10px] uppercase tracking-[0.24em] text-[#F08A1D]">
                {s.from}
              </span>
            </div>
            <ul className="space-y-2 text-sm text-neutral-400">
              {s.bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="text-[#F08A1D]">—</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-12">
        <button
          onClick={() => open("book")}
          className="inline-flex items-center gap-3 px-7 py-4 text-[11px] tracking-[0.32em] uppercase font-semibold text-black rounded-full ignition-glow"
          style={{ background: "linear-gradient(180deg,#FFA940,#F08A1D)" }}
        >
          Book a Service <span>→</span>
        </button>
      </div>
    </OverlayShell>
  );
}

/* ─────────────  About  ───────────── */

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    let start = 0;
    const dur = 1400;
    const step = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <span ref={ref}>
      {n.toLocaleString()}
      {suffix}
    </span>
  );
}

export function AboutOverlay() {
  const { active, close } = useOverlay();
  if (active !== "about") return null;
  return (
    <OverlayShell title="ABOUT" onClose={close}>
      <h2 className="font-display uppercase text-[12vw] md:text-[6vw] leading-[0.9] steel mb-8">
        {site.about.title}
      </h2>
      <p className="max-w-2xl text-neutral-300 text-base md:text-lg leading-relaxed mb-16">
        {site.about.body}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 mb-20">
        {site.stats.map((s) => (
          <div key={s.label}>
            <div className="font-display text-3xl md:text-5xl text-white">
              <CountUp value={s.value} suffix={s.suffix} />
            </div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-neutral-500 mt-2">
              {s.label}
            </div>
          </div>
        ))}
      </div>
      <h3 className="font-display uppercase text-3xl md:text-4xl steel mb-8">
        {site.testimonials.title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {site.testimonials.items.map((t) => (
          <blockquote key={t.author} className="chrome-border rounded-2xl p-6">
            <p className="text-sm md:text-base text-neutral-200 leading-relaxed mb-4">
              "{t.quote}"
            </p>
            <footer className="text-[10px] uppercase tracking-[0.24em] text-neutral-500">
              {t.author} · {t.role}
            </footer>
          </blockquote>
        ))}
      </div>
    </OverlayShell>
  );
}

/* ─────────────  Contact  ───────────── */

export function ContactOverlay() {
  const { active, close } = useOverlay();
  if (active !== "contact") return null;
  return (
    <OverlayShell title="CONTACT" onClose={close}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="font-display uppercase text-[12vw] md:text-[6vw] leading-[0.9] steel mb-8">
            {site.contact.title}
          </h2>
          <p className="text-neutral-300 mb-10 max-w-md">{site.contact.copy}</p>
          <dl className="space-y-6 text-lg">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.24em] text-neutral-500 mb-1">
                Phone
              </dt>
              <dd>
                <a
                  href={`tel:${site.phone}`}
                  className="text-white hover:text-[#F08A1D] transition-colors"
                >
                  {site.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.24em] text-neutral-500 mb-1">
                Email
              </dt>
              <dd>
                <a
                  href={`mailto:${site.email}`}
                  className="text-white hover:text-[#F08A1D] transition-colors"
                >
                  {site.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.24em] text-neutral-500 mb-1">
                Service Area
              </dt>
              <dd className="text-white">{site.area.copy}</dd>
            </div>
          </dl>
        </div>
        <div className="relative aspect-square max-w-md w-full mx-auto">
          <div className="absolute inset-0 flex items-center justify-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute rounded-full border border-[#F08A1D]/40"
                style={{
                  width: "60%",
                  height: "60%",
                  animation: `pulse-ring 2.6s ${i * 0.9}s ease-out infinite`,
                }}
              />
            ))}
            <div
              className="relative w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(180deg,#FFA940,#F08A1D)" }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0A0A0B"
                strokeWidth="2.5"
              >
                <path d="M12 22s-8-7-8-13a8 8 0 0116 0c0 6-8 13-8 13z" />
                <circle cx="12" cy="9" r="3" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </OverlayShell>
  );
}

/* ─────────────  Book  ───────────── */

export function BookOverlay() {
  const { active, close } = useOverlay();
  const [form, setForm] = useState<{
    full_name: string;
    phone: string;
    email: string;
    service: string;
    zip: string;
  }>({
    full_name: "",
    phone: "",
    email: "",
    service: site.booking.services[0],
    zip: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const pendingBookingId = useRef<string | null>(null);

  // A page can hand over the service the visitor was looking at (the /nuhome
  // garage does this), so the form opens on it.
  useEffect(() => {
    if (active !== "book") return;
    try {
      const wanted = sessionStorage.getItem("dk_book_service");
      sessionStorage.removeItem("dk_book_service");
      if (wanted && (site.booking.services as readonly string[]).includes(wanted)) {
        setForm((f) => ({ ...f, service: wanted }));
      }
    } catch {}
  }, [active]);

  if (active !== "book") return null;

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoErr(null);
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setPhoto(null);
      return;
    }
    if (!f.type.startsWith("image/")) {
      setPhotoErr("Please choose an image file.");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setPhotoErr("Photo must be under 8 MB.");
      return;
    }
    setPhoto(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!form.full_name.trim() || form.full_name.length < 2)
      return setErr("Please enter your full name.");
    if (!/^[+()\d\s-]{7,}$/.test(form.phone)) return setErr("Please enter a valid phone number.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return setErr("Please enter a valid email.");
    if (!/^\d{5}(-\d{4})?$/.test(form.zip.trim())) return setErr("Please enter a valid ZIP code.");

    setSubmitting(true);

    let bookingId = pendingBookingId.current;

    // A retry after an email outage reuses the saved booking instead of creating
    // a duplicate database row or uploading the same photo again.
    let photo_path: string | null = null;
    if (!bookingId) {
      // Optional photo upload — failure should not block booking
      if (photo) {
        try {
          const ext =
            (photo.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
          const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("booking-photos")
            .upload(path, photo, { contentType: photo.type, upsert: false });
          if (upErr) throw upErr;
          photo_path = path;
        } catch (e) {
          console.error("photo upload failed", e);
        }
      }

      // Generate the ID in the browser so we can notify the email function without
      // needing SELECT access to the otherwise private bookings table.
      bookingId = crypto.randomUUID();
      const { error } = await supabase.from("bookings").insert({
        id: bookingId,
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        service: form.service,
        zip: form.zip.trim(),
        ...(photo_path ? { photo_path } : {}),
      });
      if (error) {
        setSubmitting(false);
        setErr(error.message);
        return;
      }
      pendingBookingId.current = bookingId;
    }

    // Wait for delivery acceptance and retry transient failures. The booking ID
    // is also used as Resend's idempotency key, so a retry cannot send duplicates.
    let notificationSent = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error: emailError } = await supabase.functions.invoke("send-booking-email", {
        // Keep the form fields during the deployment transition so this remains
        // compatible with the previous function version.
        body: { booking_id: bookingId, ...form, photo_path },
      });
      if (!emailError && data?.sent === true) {
        notificationSent = true;
        break;
      }
      console.error("booking email attempt failed", emailError ?? data);
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 700 * 2 ** attempt));
    }

    if (!notificationSent) {
      setSubmitting(false);
      setErr(
        "Your booking was saved, but the notification email could not be sent. Please try again in a moment.",
      );
      return;
    }

    pendingBookingId.current = null;
    setSubmitting(false);
    setSuccess(true);
  };

  return (
    <OverlayShell
      title="BOOK"
      onClose={() => {
        setSuccess(false);
        close();
      }}
    >
      {success ? (
        <div className="relative py-16 text-center">
          <Confetti />
          <h2 className="font-display uppercase text-[12vw] md:text-[6vw] leading-[0.9] steel mb-6">
            {site.booking.successTitle}
          </h2>
          <p className="text-neutral-300 max-w-md mx-auto mb-10">{site.booking.successCopy}</p>
          <button
            onClick={() => {
              setSuccess(false);
              close();
            }}
            className="inline-flex items-center gap-3 px-7 py-4 text-[11px] tracking-[0.32em] uppercase font-semibold text-black rounded-full ignition-glow"
            style={{ background: "linear-gradient(180deg,#FFA940,#F08A1D)" }}
          >
            Done
          </button>
        </div>
      ) : (
        <>
          <h2 className="font-display uppercase text-[12vw] md:text-[6vw] leading-[0.9] steel mb-10">
            {site.booking.title}
          </h2>
          <form onSubmit={submit} className="max-w-xl space-y-5">
            <Field label="Full Name">
              <input
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                className={inputCls}
                autoComplete="name"
                required
              />
            </Field>
            <Field label="Phone Number">
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className={inputCls}
                autoComplete="tel"
                inputMode="tel"
                required
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={inputCls}
                autoComplete="email"
                required
              />
            </Field>
            <Field label="Service Requested">
              <select
                value={form.service}
                onChange={(e) => set("service", e.target.value)}
                className={inputCls}
                required
              >
                {site.booking.services.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="ZIP">
              <input
                value={form.zip}
                onChange={(e) => set("zip", e.target.value)}
                className={inputCls}
                autoComplete="postal-code"
                inputMode="numeric"
                required
              />
            </Field>
            <Field label="Photo (optional)">
              <input
                type="file"
                accept="image/*"
                onChange={onPhotoChange}
                className="block w-full text-sm text-neutral-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:tracking-[0.24em] file:uppercase file:font-semibold file:bg-white/5 file:text-[#F08A1D] hover:file:bg-white/10"
              />
              {photo && (
                <p className="mt-2 text-xs text-neutral-500">
                  {photo.name} · {(photo.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              )}
              {photoErr && <p className="mt-2 text-xs text-red-400">{photoErr}</p>}
            </Field>
            {err && <p className="text-sm text-red-400">{err}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 text-[11px] tracking-[0.32em] uppercase font-semibold text-black rounded-full ignition-glow disabled:opacity-60"
              style={{ background: "linear-gradient(180deg,#FFA940,#F08A1D)" }}
            >
              {submitting ? "Sending…" : "Confirm Booking"}
            </button>
          </form>
        </>
      )}
    </OverlayShell>
  );
}

const inputCls =
  "w-full bg-transparent border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#F08A1D] transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.24em] text-neutral-500 mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}

function Confetti() {
  const dots = Array.from({ length: 40 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((i) => {
        const x = Math.random() * 100;
        const y = Math.random() * 40 + 30;
        const s = Math.random() * 6 + 3;
        const d = Math.random() * 400 + 200;
        return (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: s,
              height: s,
              background: Math.random() > 0.5 ? "#F08A1D" : "#FFD6A0",
              animation: `sparkOut 900ms ${d}ms ease-out forwards`,
              opacity: 0,
            }}
          />
        );
      })}
      <style>{`
        @keyframes sparkOut {
          0% { transform: translate(0,0) scale(0.4); opacity: 1; }
          100% { transform: translate(var(--dx,0), 120px) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ─────────────  Sign In  ───────────── */

export function SignInOverlay() {
  const { active, close } = useOverlay();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (active !== "signin") return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { error } = mode === "in" ? await signIn(email, pw) : await signUp(email, pw, name);
    setBusy(false);
    if (error) return setErr(error);
    close();
  };

  return (
    <OverlayShell title="ACCOUNT" onClose={close}>
      <div className="max-w-md mx-auto pt-8 md:pt-16">
        <h2 className="font-display uppercase text-5xl md:text-6xl steel mb-8 text-center">
          {mode === "in" ? "SIGN IN" : "CREATE ACCOUNT"}
        </h2>
        <div className="flex justify-center gap-1 mb-8 border border-white/10 rounded-full p-1 max-w-xs mx-auto">
          {(["in", "up"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setErr(null);
              }}
              className={`flex-1 py-2 text-[10px] uppercase tracking-[0.24em] rounded-full transition-colors ${
                mode === m ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white"
              }`}
            >
              {m === "in" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "up" && (
            <Field label="Full Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                autoComplete="name"
                required
              />
            </Field>
          )}
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className={inputCls}
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              required
              minLength={6}
            />
          </Field>
          {err && <p className="text-sm text-red-400">{err}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-3 px-7 py-4 text-[11px] tracking-[0.32em] uppercase font-semibold text-black rounded-full ignition-glow disabled:opacity-60"
            style={{ background: "linear-gradient(180deg,#FFA940,#F08A1D)" }}
          >
            {busy ? "…" : mode === "in" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </OverlayShell>
  );
}

/* ─────────────  Admin  ───────────── */

type UserRow = { id: string; email: string | null; full_name: string | null; role: string };

export function AdminOverlay() {
  const { active, close } = useOverlay();
  const { role } = useAuth();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (active !== "admin" || role !== "admin") return;
    let alive = true;
    (async () => {
      setLoading(true);
      const { data: profiles } = await supabase.from("profiles").select("id, email, full_name");
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      if (!alive) return;
      const roleMap = new Map<string, string>();
      roles?.forEach((r) => {
        const prev = roleMap.get(r.user_id);
        if (prev === "admin") return;
        if (r.role === "admin" || !prev) roleMap.set(r.user_id, r.role);
      });
      setRows(
        (profiles ?? []).map((p) => ({
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          role: roleMap.get(p.id) ?? "customer",
        })),
      );
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [active, role]);

  if (active !== "admin") return null;
  if (role !== "admin") {
    return (
      <OverlayShell title="ADMIN" onClose={close}>
        <p className="text-neutral-400">Access denied.</p>
      </OverlayShell>
    );
  }

  const setUserRole = async (userId: string, newRole: "customer" | "karebear") => {
    // Remove non-admin roles then insert new
    await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .in("role", ["customer", "karebear"]);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    if (error) return alert(error.message);
    setRows((rs) => rs.map((r) => (r.id === userId ? { ...r, role: newRole } : r)));
  };

  return (
    <OverlayShell title="ADMIN" onClose={close}>
      <h2 className="font-display uppercase text-4xl md:text-5xl steel mb-8">TEAM & CUSTOMERS</h2>
      {loading ? (
        <p className="text-neutral-500">Loading…</p>
      ) : (
        <div className="chrome-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-[0.24em] text-neutral-500 bg-white/[0.02]">
              <tr>
                <th className="text-left p-4">Name / Email</th>
                <th className="text-left p-4">Role</th>
                <th className="text-right p-4">Change</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isAdmin = r.role === "admin";
                return (
                  <tr key={r.id} className="border-t border-white/5">
                    <td className="p-4">
                      <div className="text-white">{r.full_name || "—"}</div>
                      <div className="text-xs text-neutral-500">{r.email}</div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] uppercase tracking-[0.24em] px-2 py-1 rounded-full ${
                          isAdmin
                            ? "bg-[#F08A1D]/20 text-[#F08A1D]"
                            : r.role === "karebear"
                              ? "bg-white/10 text-white"
                              : "bg-white/[0.03] text-neutral-400"
                        }`}
                      >
                        {r.role}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {isAdmin ? (
                        <span className="text-[10px] uppercase tracking-[0.24em] text-neutral-600">
                          Locked
                        </span>
                      ) : (
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => setUserRole(r.id, "customer")}
                            className={`text-[10px] uppercase tracking-[0.24em] px-3 py-1 rounded-full border transition-colors ${
                              r.role === "customer"
                                ? "border-[#F08A1D] text-[#F08A1D]"
                                : "border-white/10 text-neutral-400 hover:border-white/30"
                            }`}
                          >
                            Customer
                          </button>
                          <button
                            onClick={() => setUserRole(r.id, "karebear")}
                            className={`text-[10px] uppercase tracking-[0.24em] px-3 py-1 rounded-full border transition-colors ${
                              r.role === "karebear"
                                ? "border-[#F08A1D] text-[#F08A1D]"
                                : "border-white/10 text-neutral-400 hover:border-white/30"
                            }`}
                          >
                            Karebear
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </OverlayShell>
  );
}

/* ─────────────  Mount all  ───────────── */

export function Overlays() {
  return (
    <>
      <MenuOverlay />
      <ServicesOverlay />
      <AboutOverlay />
      <ContactOverlay />
      <BookOverlay />
      <SignInOverlay />
      <AdminOverlay />
    </>
  );
}
