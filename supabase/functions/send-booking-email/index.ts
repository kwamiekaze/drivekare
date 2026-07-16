// Sends the booking email to the DriveKare owner via Resend.
// Failures are logged; caller ignores failure so the UI still confirms.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: CORS });

  try {
    const { full_name, phone, email, service, zip } = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured — skipping email send");
      return new Response(JSON.stringify({ sent: false, reason: "no_api_key" }), {
        status: 200,
        headers: { ...CORS, "content-type": "application/json" },
      });
    }

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;background:#0A0A0B;color:#F2F3F5;padding:32px;border-radius:12px;max-width:560px">
        <h1 style="color:#F08A1D;font-size:22px;margin:0 0 24px;letter-spacing:0.1em">NEW DRIVEKARE BOOKING</h1>
        <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.7">
          <tr><td style="color:#9BA0A8;padding:6px 0;width:130px">Name</td><td>${escape(full_name)}</td></tr>
          <tr><td style="color:#9BA0A8;padding:6px 0">Phone</td><td>${escape(phone)}</td></tr>
          <tr><td style="color:#9BA0A8;padding:6px 0">Email</td><td>${escape(email)}</td></tr>
          <tr><td style="color:#9BA0A8;padding:6px 0">Service</td><td><strong style="color:#FFA940">${escape(service)}</strong></td></tr>
          <tr><td style="color:#9BA0A8;padding:6px 0">ZIP</td><td>${escape(zip)}</td></tr>
        </table>
        <p style="color:#6E7278;font-size:12px;margin-top:32px">DriveKare — Care that comes to you.</p>
      </div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DriveKare <onboarding@resend.dev>",
        to: ["kwamiekaze@gmail.com"],
        subject: `New DriveKare Booking — ${full_name} — ${service}`,
        html,
        reply_to: email,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Resend failed [${res.status}]: ${err}`);
      return new Response(JSON.stringify({ sent: false, reason: "provider_error", status: res.status }), {
        status: 200,
        headers: { ...CORS, "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ sent: true }), {
      status: 200,
      headers: { ...CORS, "content-type": "application/json" },
    });
  } catch (e) {
    console.error("send-booking-email error", e);
    return new Response(JSON.stringify({ sent: false, reason: "exception" }), {
      status: 200,
      headers: { ...CORS, "content-type": "application/json" },
    });
  }
});

function escape(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
