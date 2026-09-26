import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listBookings from "./tools/list-bookings";
import listContactMessages from "./tools/list-contact-messages";
import createBooking from "./tools/create-booking";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "drivekare-polish",
  title: "DriveKare Polish",
  version: "0.1.0",
  instructions:
    "Tools for DriveKare mobile auto care. Use `create_booking` to request service. Staff accounts can review requests with `list_bookings` and `list_contact_messages`.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [createBooking, listBookings, listContactMessages],
});
