# DriveKare 3D Garage Award-Level Upgrade

## Scope and guardrails

- Upgrade `/nuhome`, its garage scene/components, and only the shared service copy explicitly requested.
- Keep `/` visually and behaviorally unchanged. Garage glass variants will be opt-in from `/nuhome`, not global replacements.
- Preserve booking, authentication, contact, and admin behavior; only the requested service name/options and garage presentation change.
- Implement and validate in the required phase order. Phase 1 is a hard stability gate before visual expansion.

## Phase 1 — Eliminate flicker and shimmer

- Move the neon assembly clear of the back wall, separate backing and lettering planes, add negative polygon offsets to both decals, and remove tube flutter.
- Audit all back-wall and floor-mounted planes: posters, pegboard details, trims, labels, bay markings, stencil, hero rings, screens, and vehicle decals. Give geometry physical clearance and flat decals polygon offset/depth settings.
- Upgrade generated textures to trilinear mipmapping with mipmaps enabled; apply anisotropy capped by each device renderer’s supported maximum.
- Keep desktop multisampling and add SMAA on mobile rather than leaving mobile without anti-aliasing.
- Use stable warm concrete on mobile with a subtle generated normal map and one-frame contact shadows. Retain the desktop reflector only after frame-diff validation proves it stable.
- Apply the requested key-light shadow bias/normal-bias. Disable shadow casting on wall-mounted pieces, shelf contents, and other tiny repeated parts that cannot produce meaningful shadows.
- Remove default sparkles and gate all continuously animated displays/objects behind the later idle system.
- Gate: capture stationary 3-second samples at 390 and 1440, compare fixed regions frame-to-frame, and proceed only after the neon, wheels, toolboxes, and wall tools remain stable.

## Phase 2 — Warm, premium working garage

- Port the warm office lighting recipe: cool-warm hemisphere balance, stronger ambient fill, 3500K ceiling fixtures, warm bear key, corrected shadow settings, golden door light, and soft bounce with no blue rim.
- Lift navy surfaces toward a warmer premium finish while preserving ignition orange and brushed steel.
- Add detailed commercial garage props: wall hose reel, work lights, cabinets, cable spools, rags, DK-logo wall television, rolling chest, and framed posters.
- Improve tires with shared lathe geometry and generated tread normal maps. Reuse materials, instance repeated fasteners/sockets/tires where practical, and batch static decorations using the reference `StaticBatch` merge pattern.
- Keep mobile geometry and shadow budgets lower without visibly removing the signature details.

## Phase 3 — Golden-hour commercial exterior

- Build the visible exterior through the open door: paved parking lot, stalls, curb, sidewalk, planters, grass, trees, shrubs, street lamps, neighboring parts store/café/office, lit windows, and a warm sky with subtle clouds.
- Adapt the reference foliage into instanced, deterministic trees/shrubs/grass with reduced mobile counts.
- Rebuild the exterior van from the detailed reference as a white Transit-style DriveKare van with orange striping, wordmark, domain, slogan, DK bear graphic, roof rack, windows, lights, trim, and detailed wheels.
- Frame and light the exterior so the van is a strong welcome-view signal without overpowering the indoor bear.

## Phase 4 — Services, lift showpiece, and guided play

- Replace Fleet Care with Brakes & Suspension in garage view data, service cards, booking options, and all displayed service references.
- Remove all prices and price-like labels from garage panels and the Services overlay while preserving bullets.
- Rebuild the lift car as a detailed modern performance sedan: clearcoat body, grille, lamps, mirrors, glass, badge, underbody, exhaust/subframe/oil pan, visible suspension, drilled front rotor, orange caliper, removed wheel on a stand, and aimed work light.
- Set bay navigation order to Battery → Tires → Oil & Fluids → Brakes & Suspension → Diagnostics → Detailing, with Welcome separate.
- Add the reference-style play/pause control. Playback pans through each bay at fixed framing, opens its glass service panel for about five seconds, then advances.
- Any pointer, touch, wheel, or keyboard input stops playback immediately. Playback will not alter zoom or field of view.

## Phase 5 — See-through garage interface

- Port the exact reference visual recipe for `.glass-card`, `.glass-chip`, and `.play-fixes-ring`, adapting only color tokens to DriveKare orange/navy.
- Convert `/nuhome` bay panels and chips to low-blur transparent glass with strong text shadow and orange active states.
- Add a garage-only transparent glass menu with stacked, staggered items while the 3D scene remains visible and softly blurred.
- Add garage-only glass variants for Services, About, Book, Contact, Sign In, and Admin overlays. Shared form logic, submissions, validation, success states, and permissions stay unchanged.
- Verify text contrast against the brightest door/exterior frames.

## Phase 6 — Fixed-framing camera and true idle mode

- Remove automatic camera-distance changes, automatic FOV changes, and welcome walk/dolly behavior. Bay transitions become position/target pans with each bay’s framing fixed.
- Keep pinch/wheel zoom as the only distance/FOV control.
- Introduce one shared `lastInput` clock for pointer movement/down, touch, wheel/scroll, drag, and keys. Idle mode begins only after 25 seconds, only with no overlay open and no guided tour running.
- Gate bear gestures, diagnostic screen motion, dust/sparkles in door light, lift movement, van light blink, neon warm-up, and slow lateral camera drift behind idle mode.
- Any input disables idle effects immediately and resets the timer. Reduced-motion mode never enables them.

## Phase 7 — Live DriveKare calendar and clock

- Port the reference calendar to the empty upper back-left wall with a dark paper/steel frame, orange masthead, DK mark, slogan, current month grid, and today highlighted.
- Redraw only when the visitor’s local date changes.
- Port the steel-bezel wall clock with dark face and live local hour/minute/second hands.
- Keep both wall-mounted, shadow-light, physically separated from the wall, and crisp through adequate texture resolution, mipmaps, anisotropy, and polygon offset.

## Technical implementation

- Split the expanding scene into focused modules for exterior, fixtures, calendar/clock, idle state, and detailed vehicles; record the structural decision in `AGENTS.md`.
- Pass garage-only UI mode and overlay-open state explicitly rather than changing homepage presentation.
- Use shared cached geometries/materials and deterministic procedural textures; avoid runtime network assets and high-poly repeated geometry.
- Preserve React Three Fiber SSR boundaries and existing lazy loading.

## Verification and evidence

- Test Chromium and WebKit at 390×844 and 1440×1000.
- Capture stationary frame sequences and numeric image diffs for flicker-sensitive regions.
- Verify warm lighting, exterior and branded van visibility, lift-car details, left-to-right chip order, full guided tour, no zoom during playback, immediate stop on input, no prices, glass visibility, 25-second idle gate, reduced-motion behavior, local calendar/clock, and no console/runtime errors.
- Measure frame cadence during a representative stationary view and guided tour, reporting observed desktop/mobile FPS rather than claiming an unsupported device result.
- Provide final screenshots for mobile and desktop plus the stability/FPS summary.
