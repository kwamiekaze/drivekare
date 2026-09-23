// Sends booking notification email to both DriveKare owners via Resend.
// The booking is read from the database instead of trusting browser-supplied details.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RECIPIENTS = ["kwamiekaze@gmail.com", "drivekarellc@gmail.com"];
const ATTACHMENT_MAX_BYTES = 6 * 1024 * 1024; // ~6 MB inline cap

type Booking = {
  id?: string;
  full_name: string;
  phone: string;
  email: string;
  service: string;
  zip: string;
  photo_path?: string | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS });
  }

  try {
    const payload = (await req.json()) as Booking & { booking_id?: string };
    let booking: Booking = payload;

    if (payload.booking_id) {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!SUPABASE_URL || !SERVICE_ROLE) {
        console.error("Supabase server credentials are unavailable");
        return json({ sent: false, reason: "server_configuration" }, 500);
      }

      const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
      const { data, error } = await admin
        .from("bookings")
        .select("id, full_name, phone, email, service, zip, photo_path")
        .eq("id", payload.booking_id)
        .single();

      if (error || !data) {
        console.error("Booking lookup failed", error);
        return json({ sent: false, reason: "booking_not_found" }, 404);
      }
      booking = data;
    }

    const { full_name, phone, email, service, zip, photo_path } = booking;
    if (
      ![full_name, phone, email, service, zip].every(
        (value) => typeof value === "string" && value.trim(),
      )
    ) {
      return json({ sent: false, reason: "invalid_booking" }, 400);
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return json({ sent: false, reason: "no_api_key" }, 500);
    }
    const from = Deno.env.get("BOOKING_FROM_EMAIL");
    if (!from) {
      console.error("BOOKING_FROM_EMAIL not configured");
      return json({ sent: false, reason: "no_sender" }, 500);
    }

    // Prepare optional attachment / signed URL
    let attachments: { filename: string; content: string }[] | undefined;
    let signedUrl: string | null = null;
    let photoFilename: string | null = null;

    if (photo_path) {
      photoFilename = photo_path.split("/").pop() || "photo";
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (SUPABASE_URL && SERVICE_ROLE) {
        try {
          const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
          const { data: blob, error: dlErr } = await admin.storage
            .from("booking-photos")
            .download(photo_path);
          if (dlErr) throw dlErr;
          const bytes = new Uint8Array(await blob.arrayBuffer());
          if (bytes.byteLength <= ATTACHMENT_MAX_BYTES) {
            let bin = "";
            for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
            attachments = [{ filename: photoFilename, content: btoa(bin) }];
          } else {
            const { data: signed } = await admin.storage
              .from("booking-photos")
              .createSignedUrl(photo_path, 60 * 60 * 24 * 7);
            signedUrl = signed?.signedUrl ?? null;
          }
        } catch (e) {
          console.error("photo attach failed", e);
          try {
            const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
            const { data: signed } = await admin.storage
              .from("booking-photos")
              .createSignedUrl(photo_path, 60 * 60 * 24 * 7);
            signedUrl = signed?.signedUrl ?? null;
          } catch (signedUrlError) {
            console.error("photo signed URL fallback failed", signedUrlError);
          }
        }
      }
    }

    const photoBlock = photo_path
      ? `<tr><td style="color:#9BA0A8;padding:6px 0">Photo</td><td>${
          attachments
            ? `Attached (${escape(photoFilename ?? "photo")})`
            : signedUrl
              ? `<a href="${escape(signedUrl)}" style="color:#FFA940">Download photo</a> (valid 7 days)`
              : "Uploaded (link unavailable)"
        }</td></tr>`
      : "";

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;background:#0A0A0B;color:#F2F3F5;padding:32px;border-radius:12px;max-width:560px">
        <h1 style="color:#F08A1D;font-size:22px;margin:0 0 24px;letter-spacing:0.1em">NEW DRIVEKARE BOOKING</h1>
        <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.7">
          <tr><td style="color:#9BA0A8;padding:6px 0;width:130px">Name</td><td>${escape(full_name)}</td></tr>
          <tr><td style="color:#9BA0A8;padding:6px 0">Phone</td><td>${escape(phone)}</td></tr>
          <tr><td style="color:#9BA0A8;padding:6px 0">Email</td><td>${escape(email)}</td></tr>
          <tr><td style="color:#9BA0A8;padding:6px 0">Service</td><td><strong style="color:#FFA940">${escape(service)}</strong></td></tr>
          <tr><td style="color:#9BA0A8;padding:6px 0">ZIP</td><td>${escape(zip)}</td></tr>
          ${photoBlock}
        </table>
        <p style="color:#6E7278;font-size:12px;margin-top:32px">DriveKare — Care that comes to you.</p>
      </div>`;

    const resendHeaders: Record<string, string> = {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    };
    if (booking.id) resendHeaders["Idempotency-Key"] = `booking-notification/${booking.id}`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: resendHeaders,
      body: JSON.stringify({
        from,
        to: RECIPIENTS,
        subject: `New DriveKare Booking — ${full_name} — ${service}`,
        html,
        reply_to: email,
        ...(attachments ? { attachments } : {}),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Resend failed [${res.status}]: ${err}`);
      return json({ sent: false, reason: "provider_error", status: res.status }, 502);
    }

    return json({ sent: true, recipients: RECIPIENTS });
  } catch (e) {
    console.error("send-booking-email error", e);
    return json({ sent: false, reason: "exception" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}

function escape(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
