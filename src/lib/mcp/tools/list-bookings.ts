import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_bookings",
  title: "List bookings",
  description: "List recent service bookings (visible to DriveKare staff accounts only).",
  inputSchema: { limit: z.number().int().min(1).max(100).default(20).describe("Max rows to return.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await supabaseForUser(ctx)
      .from("bookings")
      .select("id, created_at, full_name, email, phone, service, zip")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const bookings = (data ?? []).map((b) => ({
      id: String(b.id), created_at: String(b.created_at), full_name: String(b.full_name),
      email: String(b.email), phone: String(b.phone), service: String(b.service), zip: String(b.zip),
    }));
    return { content: [{ type: "text", text: JSON.stringify(bookings) }], structuredContent: { bookings } };
  },
});
