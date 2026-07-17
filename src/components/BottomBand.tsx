import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Upload, Camera, Send, X, Check, Loader2 } from "lucide-react";
import { supabase } from "../integrations/supabase/client";

const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

const schema = z.object({
  full_name: z.string().trim().min(1, "Required").max(120),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone")
    .max(30),
  email: z.string().trim().email("Enter a valid email").max(255),
  city_zip: z.string().trim().min(1, "Required").max(120),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function BottomBand() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const camRef = useRef<HTMLInputElement | null>(null);

  const pickFile = (f: File | null) => {
    setPhotoErr(null);
    if (!f) return;
    if (f.size > MAX_BYTES) {
      setPhotoErr("Max size is 20MB");
      return;
    }
    if (!/^image\//.test(f.type) && !/\.(heic|heif)$/i.test(f.name)) {
      setPhotoErr("Images only (JPG, PNG, HEIC, WebP)");
      return;
    }
    setPhoto(f);
    const url = URL.createObjectURL(f);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoErr(null);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileRef.current) fileRef.current.value = "";
    if (camRef.current) camRef.current.value = "";
  };

  const onSubmit = async (values: FormValues) => {
    try {
      let photo_url: string | null = null;
      if (photo) {
        const ext = (photo.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("contact-photos")
          .upload(path, photo, { contentType: photo.type || "image/jpeg" });
        if (upErr) throw upErr;
        photo_url = path;
      }

      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("contact_messages" as any)
        .insert({
          full_name: values.full_name,
          phone: values.phone,
          email: values.email,
          city_zip: values.city_zip,
          message: values.message || null,
          photo_url,
        });
      if (error) throw error;

      toast.success("Message sent — we'll be in touch shortly.");
      setSuccess(true);
      reset();
      removePhoto();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
    }
  };

  const sendAnother = () => setSuccess(false);

  return (
    <section
      id="contact"
      className="relative w-full py-24 px-5 md:px-8"
      style={{ background: "#0A0A0B" }}
      aria-label="Request service"
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div
            className="text-[10px] md:text-[11px] tracking-[0.5em] uppercase mb-3"
            style={{ color: "#F08A1D" }}
          >
            Get In Touch
          </div>
          <h2
            className="steel-hot uppercase"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: "clamp(2rem, 6vw, 3.75rem)",
              letterSpacing: "0.01em",
              lineHeight: 1,
            }}
          >
            Request Service.
          </h2>
        </div>

        <div
          className="relative rounded-2xl p-6 md:p-10"
          style={{
            background:
              "linear-gradient(180deg, rgba(24,24,27,0.85) 0%, rgba(14,14,16,0.9) 100%)",
            backdropFilter: "blur(18px) saturate(140%)",
            WebkitBackdropFilter: "blur(18px) saturate(140%)",
            border: "1px solid rgba(240,138,29,0.18)",
            boxShadow:
              "0 30px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(240,138,29,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Glow border shine */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              background:
                "radial-gradient(600px 200px at 50% -20%, rgba(240,138,29,0.15), transparent 60%)",
            }}
          />

          {success ? (
            <div className="relative flex flex-col items-center text-center py-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                style={{
                  background:
                    "linear-gradient(135deg, #F08A1D 0%, #FFA940 100%)",
                  boxShadow: "0 0 40px rgba(240,138,29,0.4)",
                }}
              >
                <Check className="w-8 h-8 text-black" strokeWidth={3} />
              </div>
              <h3
                className="uppercase font-black text-white mb-2"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: "clamp(1.5rem, 4vw, 2rem)",
                  letterSpacing: "0.02em",
                }}
              >
                Message Sent!
              </h3>
              <p className="text-neutral-400 mb-8 max-w-sm">
                Thanks for reaching out — a DriveKare tech will get back to you
                shortly with next steps.
              </p>
              <button
                type="button"
                onClick={sendAnother}
                className="px-6 h-12 rounded-xl border border-white/10 bg-white/5 text-white uppercase text-sm tracking-widest font-semibold hover:bg-white/10 transition"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="relative flex flex-col gap-4"
              noValidate
            >
              <Field label="Full Name" required error={errors.full_name?.message}>
                <input
                  type="text"
                  autoComplete="name"
                  {...register("full_name")}
                  className={inputCls}
                />
              </Field>
              <Field
                label="Phone Number"
                required
                error={errors.phone?.message}
              >
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  {...register("phone")}
                  className={inputCls}
                />
              </Field>
              <Field label="Email" required error={errors.email?.message}>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  {...register("email")}
                  className={inputCls}
                />
              </Field>
              <Field
                label="City / Zipcode"
                required
                error={errors.city_zip?.message}
              >
                <input
                  type="text"
                  autoComplete="postal-code"
                  {...register("city_zip")}
                  className={inputCls}
                />
              </Field>
              <Field
                label="Requested service or details of issue"
                error={errors.message?.message}
              >
                <textarea
                  rows={4}
                  {...register("message")}
                  className={`${inputCls} py-3`}
                  style={{ height: "auto", minHeight: 100, resize: "vertical" }}
                />
              </Field>

              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-neutral-300 mb-2">
                  Attach or take a photo{" "}
                  <span className="text-neutral-500 normal-case tracking-normal">
                    (optional)
                  </span>
                </label>
                <div className="flex gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition"
                  >
                    <Upload className="w-4 h-4" />
                    Choose File
                  </button>
                  <button
                    type="button"
                    onClick={() => camRef.current?.click()}
                    className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition"
                  >
                    <Camera className="w-4 h-4" />
                    Camera
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept={ACCEPT}
                    className="hidden"
                    onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                  />
                  <input
                    ref={camRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                {photoErr && (
                  <p className="mt-2 text-xs text-red-400">{photoErr}</p>
                )}
                {photoPreview && (
                  <div className="mt-3 inline-flex items-start relative">
                    <img
                      src={photoPreview}
                      alt="Selected"
                      className="rounded-lg object-cover"
                      style={{ width: 88, height: 88 }}
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      aria-label="Remove photo"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={3} />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-3 w-full h-14 rounded-xl uppercase font-black tracking-widest text-black inline-flex items-center justify-center gap-2 disabled:opacity-70 transition-transform active:scale-[0.99]"
                style={{
                  background:
                    "linear-gradient(135deg, #F08A1D 0%, #FFA940 100%)",
                  boxShadow:
                    "0 10px 30px -8px rgba(240,138,29,0.55), inset 0 1px 0 rgba(255,255,255,0.25)",
                  fontFamily: 'var(--font-display)',
                  fontSize: "1rem",
                  letterSpacing: "0.14em",
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

const inputCls =
  "w-full h-12 rounded-xl px-4 bg-black/60 border border-white/10 focus:border-[#F08A1D]/60 focus:outline-none focus:ring-2 focus:ring-[#F08A1D]/25 text-white placeholder-neutral-500 text-[15px] transition";

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span
        className="block text-xs uppercase tracking-[0.2em] mb-2"
        style={{ color: error ? "#f87171" : "#F08A1D" }}
      >
        {label}
        {required && <span className="text-white/60"> *</span>}
      </span>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}
