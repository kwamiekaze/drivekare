import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Details = { client?: { name?: string } | null; redirect_url?: string; redirect_to?: string } | null;
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: Details; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: Details; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: Details; error: { message: string } | null }>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  head: () => ({
    meta: [
      { title: "Authorize access — DriveKare" },
      { name: "description", content: "Approve an app to connect to your DriveKare account." },
      { property: "og:title", content: "Authorize access — DriveKare" },
      { property: "og:description", content: "Approve an app to connect to your DriveKare account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Consent,
});

function Consent() {
  const { authorization_id } = Route.useSearch();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [details, setDetails] = useState<Details>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  useEffect(() => {
    if (!signedIn || !authorization_id) return;
    oauth()
      .getAuthorizationDetails(authorization_id)
      .then(({ data, error }) => {
        if (error) return setError(error.message);
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) return void (window.location.href = immediate);
        setDetails(data);
      });
  }, [signedIn, authorization_id]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setError(error.message);
    setSignedIn(true);
  }

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    const target = data?.redirect_url ?? data?.redirect_to;
    if (error || !target) {
      setBusy(false);
      return setError(error?.message ?? "No redirect returned.");
    }
    window.location.href = target;
  }

  const name = details?.client?.name ?? "an app";
  const field = "w-full rounded-lg bg-background border border-border px-4 py-3 text-foreground";
  const btn = "rounded-lg px-5 py-3 font-semibold disabled:opacity-50";

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 space-y-5">
        {!authorization_id ? (
          <p>Missing authorization request.</p>
        ) : signedIn === null ? (
          <p>Loading…</p>
        ) : !signedIn ? (
          <form onSubmit={signIn} className="space-y-4">
            <h1 className="text-2xl font-bold">Sign in to DriveKare</h1>
            <p className="text-muted-foreground text-sm">Sign in to continue connecting your account.</p>
            <input className={field} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className={field} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
            <button disabled={busy} className={`${btn} w-full bg-primary text-primary-foreground`}>Sign in</button>
          </form>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Connect {name} to your account</h1>
            <p className="text-muted-foreground">This lets {name} use DriveKare as you.</p>
            {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
            <div className="flex gap-3">
              <button disabled={busy || !details} onClick={() => decide(true)} className={`${btn} bg-primary text-primary-foreground`}>Approve</button>
              <button disabled={busy || !details} onClick={() => decide(false)} className={`${btn} border border-border`}>Deny</button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
