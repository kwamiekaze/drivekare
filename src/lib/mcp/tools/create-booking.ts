import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_booking",
  title: "Create booking",
  description: "Submit a new mobile auto care service booking request.",
  inputSchema: {
    full_name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().min(5).max(40),
    service: z.string().trim().min(1).max(120).describe("Requested service, e.g. Mobile Detailing."),
    zip: z.string().trim().min(3).max(12),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { error } = await supabaseForUser(ctx).from("bookings").insert(input);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: `Booking submitted for ${input.full_name} (${input.service}).` }] };
  },
});
