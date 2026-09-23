# DriveKare Polish

Build "DRIVEKARE" (drivekare.com) — a luxury MOBILE auto care company site engineered to win Awwwards/FWA for motion design and interactivity. Slogan everywhere it belongs: "AUTO CARE ANYWHERE." Dark, cinematic, obsessively polished — this must feel like a high-end automotive brand film (think Porsche configurator meets a fragrance ad), not a mechanic's site. DriveKare comes TO the customer: mobile detailing, oil changes, diagnostics, tire & battery service, full auto care at your driveway or office. The entire site's job: wow, then convert to a booking.

## Booking email setup

Every successful booking is emailed to both `drivekarellc@gmail.com` and
`kwamiekaze@gmail.com` by the `send-booking-email` Supabase Edge Function.

Production requires these Supabase Edge Function secrets:

- `RESEND_API_KEY`: an API key from Resend.
- `BOOKING_FROM_EMAIL`: a sender on a domain verified in Resend, for example
  `DriveKare <bookings@drivekare.com>`.

After changing the function, deploy it with:

```sh
supabase functions deploy send-booking-email --project-ref zyyrlamgjltcgfewvhwq
```

The booking form waits for Resend to accept the message, retries transient
failures three times, and uses the booking ID as an idempotency key to avoid
duplicate notification emails.

CRITICAL ARCHITECTURE RULE — EDITABLE EVERYTHING:
Create src/content/site.ts as the single source of truth for ALL text (headlines, taglines, services, stats, process steps, testimonials, footer, meta, phone/booking copy) AND a media config object with named slots: { heroVideo, revealVideo, roadVideo, heroModel } each with { src, poster, fallback }. Zero copy hardcoded in components. Real video srcs and the 3D model URL arrive in follow-up messages — until then every video slot uses a procedural fallback: a requestAnimationFrame canvas effect of streaking headlight/taillight light-trails and drifting chrome reflections on black asphalt (long horizontal cyan-white and orange streaks with motion blur feel), so every section looks stunning from day one. All videos, when wired, must be muted, playsinline, loop — every background film loops seamlessly. No text ever baked into media.

ART DIRECTION (derived from the DK emblem — brushed gunmetal steel + ignition orange on black):

- Palette: obsidian black (#0A0A0B) base, brushed-steel silver (chrome gradients: #E8E8EC → #9BA0A8 → #5B6068) for primary display treatment, ignition orange (#F08A1D, hover/glow variant #FFA940) as THE accent, glacial white body text. Subtle metallic sheen gradients on headings — headlines should look machined from brushed aluminum with an orange edge-light.
- Typography: massive condensed uppercase display (Anton or Archivo Black) for headlines with huge scale contrast — headlines nearly touch viewport edges; Inter for body.
- Signature texture: fine carbon-fiber weave at ~3% opacity on section backgrounds, orange scanline/edge-glow details on interactive elements.

TECH: React + GSAP + ScrollTrigger + Lenis smooth scroll. Transforms/opacity only, will-change sparingly, 60fps everything. Three + @react-three/fiber + @react-three/drei installed for the hero 3D (mount a placeholder rotating chrome torus-knot with the same lighting rig until the real GLB arrives — same auto-fit code path).

EXPERIENCE, in order:

1. SPLASH SCREEN: full-viewport black. The DRIVEKARE wordmark assembles letter-by-letter like machined parts snapping into place (each letter slides in from alternating sides with a slight metallic glint sweep as it locks), then an orange ignition line sweeps underneath and "AUTO CARE ANYWHERE" fades in below in small tracking-wide caps. A subtle engine-rev progress feel via an orange RPM-style arc filling top-right. "TAP TO CONTINUE" bottom center; tap or auto-complete (~3.5s) wipes upward into the hero with a chrome shutter transition. Plays on every homepage landing. Reduced motion: simple fade.

2. HERO — PINNED SCRUB (the signature): headline "AUTO CARE ANYWHERE" in colossal brushed-steel letters. On first scroll the hero PINS (ScrollTrigger pin: true, scrub: true, pin distance ~110% viewport, anticipatePin: 1, pinSpacing on) and scroll progress drives a letter-by-letter "polish" effect left to right: each letter starts as dull, dusty matte gunmetal and gets wiped to brilliant mirror chrome with an orange glint sweep as it passes — like a detailing cloth polishing each letter. Page cannot scroll past until all letters are polished, then unpins into the marquee. Use ONE shared renderPolishTitle(text) helper that splits on whitespace, wraps each WORD in inline-flex whitespace-nowrap containers with per-character spans inside — contraction/word-break safe at 320/390/430px. Entrance letter animation on load; pin-scrub takes over from scroll 0. Reduced motion: skip pin.
   - CENTER STAGE: reserve a 3D canvas zone between nav and headline (never overlapping any text at mobile/tablet/desktop) where the DK emblem GLB will float — for now the placeholder chrome torus-knot with the full lighting rig: soft key light, ignition-orange rim light from behind/above, low ambient, faint orange point-glow underneath, alpha transparent canvas, dpr [1,2], model floats in void over the hero video slot. Continuous slow Y rotation (~0.15 rad/s) + subtle sin-wave bob (±2%). OrbitControls drag/touch to spin: enableZoom false, enablePan false, enableDamping true — premium product-viewer feel. Auto-fit code REQUIRED: compute Box3 bounding box once in useMemo, recenter by -center, normalize scale = 2.2 / maxDimension, outer group for rotation/bob wrapping inner group with centering offset, initial rotation.y ≈ -0.5 / rotation.x ≈ 0.08 for a three-quarter first frame. useGLTF with draco support (useGLTF(url, true)), Suspense fallback null, preload.
   - Hero CTA: "BOOK YOUR SERVICE" — orange, magnetic hover (cursor-follow tilt), chrome edge on hover.

3. MARQUEE: infinite horizontal scrolling strip, giant outlined steel text "DETAIL • OIL • TIRES • DIAGNOSTICS • BATTERY • WE COME TO YOU •" — two rows opposing directions, speed subtly scroll-velocity-reactive.

4. SERVICES — "THE GARAGE": grid of 6 service cards (Mobile Detailing, Oil & Fluids, Tire Service, Battery & Electrical, Diagnostics, Fleet Care). Cards are dark brushed-metal panels with an orange edge-light that travels around the border on hover, icon etched line-art style, staggered scroll reveal (clip-path wipe from bottom + slight rotateX). Each card lists 2-3 bullet services + "from $XX". revealVideo slot at ~10% opacity blurred behind the grid.

5. REVEAL — BEFORE/AFTER: "DIRT DOESN'T DRIVE HERE." headline with the same polish treatment (reuse renderPolishTitle so they never drift). Interactive drag slider, before = grimy neglected car exterior, after = showroom shine (placeholder gradient panels with BEFORE/AFTER labels until real images arrive — slots in media config as revealBefore/revealAfter). Whole-surface drag + touch + keyboard accessible.

6. PROCESS — "FROM TAP TO SPOTLESS": horizontally scrolling pinned timeline (ScrollTrigger pinned, horizontal scrub) with 4 stops: 01 BOOK ONLINE → 02 WE ROLL TO YOU → 03 WE WORK OUR MAGIC → 04 DRIVE SPOTLESS. Each stop: huge steel number, orange connecting line that draws itself as you scrub, short copy. roadVideo slot ~10% opacity behind.

7. STATS: 4 giant count-up numerals on scroll (Vehicles Serviced 2,500+, 5-Star Reviews 480+, Avg Arrival 45 MIN, Service Radius 30 MI) in chrome with orange underline draw-in.

8. SERVICE AREA / BOOKING BAND: full-width section, "WE COME TO YOU." + zip/city input mock + big orange BOOK NOW button (routes to /book). Orange pulse radar rings animating out from a location pin.

9. TESTIMONIALS: 3 rotating quotes, breathing orange glow behind active card, auto-advance + drag.

10. FINALE/FOOTER: "FEEL THE SHINE." colossal steel headline over roadVideo slot, then footer: nav, phone, service areas, socials, "DRIVEKARE — AUTO CARE ANYWHERE" microcopy, minimal legal.

11. /book page (MVP booking): clean multi-step booking form (Service → Vehicle → Location & Time → Contact → Confirm) matching the design system, client-side validation, success state with confetti of orange sparks; store submissions in localStorage for now (backend later) and show a confirmation summary. Nav links to it; every CTA routes here.

GLOBAL POLISH: custom cursor (small chrome dot + orange ring that scales on interactive targets, hidden on touch), nav that shrinks to a frosted-glass bar on scroll with orange active-link underline, section transitions with clip-path reveals, scroll progress indicator as a thin orange line top of viewport, favicon = DK monogram orange-on-obsidian SVG, full meta/og tags "DriveKare — Auto Care Anywhere", lazy-load everything below the fold, IntersectionObserver mount/unmount for video slots (rootMargin 200px). Verify with Playwright at 1440px and 390px: no horizontal overflow, no console errors, hero pin-scrub behaves (partial scroll = pinned + partially polished, full pin distance = released), reduced-motion paths work. Go hard on creativity — this is a flagship.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://mobile-motion-pro.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2399c2b9-b3c5-40e5-bc64-63537b1c728e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
