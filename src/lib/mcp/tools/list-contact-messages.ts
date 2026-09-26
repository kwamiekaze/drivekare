import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_contact_messages",
  title: "List contact messages",
  description: "List recent messages sent through the contact form (visible to DriveKare staff accounts only).",
  inputSchema: { limit: z.number().int().min(1).max(100).default(20).describe("Max rows to return.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await supabaseForUser(ctx)
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const messages = (data ?? []).map((m: Record<string, unknown>) =>
      Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v == null ? null : String(v)])),
    );
    return { content: [{ type: "text", text: JSON.stringify(messages) }], structuredContent: { messages } };
  },
});
