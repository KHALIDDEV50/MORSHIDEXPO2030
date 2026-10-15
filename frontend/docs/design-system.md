# MORSHID — Design System (v1 foundations)

> Status: **Proposed (Gate C)**. Foundations follow D-003 to D-007 and D-009. The visual review happens in implementation Phase 1 on `/dev/design-system`, in AR and EN, light and dark.
> Contrast: key pairs were calculated on 2026-10-11 (WCAG formula). Body and secondary text pass AA in both themes. White on the CTA gradient is 4.9–5.2:1. Ink on the brand gradient (dark mode) is 6.2–8.6:1. The muted text and input-border fixes are noted in §2.
> **Implementation:** tokens are in `src/app/globals.css` and components in `src/shared/ui/`. The live review page is `/[locale]/dev/design-system`, available in `npm run dev`.
> **Update 2026-10-11 (P-009 to P-011, pending approval):** see §11 for the surface stack (dark theme v2), §12 for route and stop states, and §13 for voice mode. Where they differ, the dark values in §11 replace those in §2.

## 23. Phases 8–11 screens (2026-10-12)

- **Place details flow (chat):**
  - The recommendation's place name and **View details** open a **place summary dialog**: placeholder image, category, duration, description, area, best time, opening hours (demo-labelled), tips, and **Open full details**, which goes to `/discover/[id]` (booths go to `/expo/[id]`).
  - On the chat map, the selected marker or row shows a **Place details** bar at the top-end; with nothing selected there's a hint instead.
  - The place page has a floating **chat shortcut**: a 56px gradient circle at the bottom-end corner, above the phone bottom nav, with a menu to pick Arif or Roaya. It opens `/chat?place=<id>`.
- **My Plans:**
  - **Overview:** featured plans (copy → editor), tabs and search with pagination in the URL; desktop table rows with a ⋯ menu (Open, Edit, Delete), phone cards with a progress bar.
  - **Editor:** RHF + Zod. Type is locked while there are stops; drag (dnd-kit, keyboard sensor) plus ↑/↓ buttons; minutes and an optional fixed time per stop; estimated times; a sticky action bar (Cancel · Save draft · Save).
  - **Details:** status/type/date badges; Start, Edit, Delete (confirmed); progress summary; "Before you go" advice (info or warning, from the data only); List (the §12 route timeline) or Map, with a synced compact list beside the map at xl.
- **Guided mode (`/plans/[id]/guide`):**
  - Exit, "All stops" sheet, "Stop X of Y" with a gradient progress bar.
  - The current stop card: marker, name, area, time, duration, description, the companion's note, tips, the Google Maps link (tourism only), and a route toggle.
  - A fixed bottom bar with Skip and **Mark as done** (or "I've arrived" at the end); Undo comes in a toast. When every stop is done, a completion screen appears.
- **Expo:**
  - **Home:** a permanent warning-tone disclaimer note, the §20 site plan, and a pavilion directory (search, category chips, numbered cards with Add to plan).
  - **Pavilion page:** placeholder hero, number, name, tiles for duration, number and category; Add to plan (Expo plans only), Show on the site plan, Ask {character}; tabs for Activities & sessions, Description, and Location (the local map).
- **Auth:**
  - Split screen: a brand-gradient panel with the swoosh, Arif and the tagline beside the form; on phones a compact gradient header. No social buttons.
  - Forms with inline errors, a "Use the demo account" button, and a demo-security note.
  - The sign-in sheet opens from any gated save.
- **Notifications:** a bell with a pink unread badge (popover on desktop, page on phones); rows show an unread dot and bold title; "Mark all as read"; an All / Unread filter on the page.
- **Settings:** a guest card, Profile (bilingual name, read-only email, initials avatar), Appearance & language, Notification preferences (4 switches), Security (mock change password), Subscription & credits, Sign out, Developer tools.

## 22. Chat screens (Phase 7)

- **`/chat`:**
  - `?c=<conversationId>` opens a conversation and `?view=map` switches to the map; with no `c`, the active character's welcome (§13 hero, 4 suggestion cards) shows.
  - **Layout:** history side panel (lg+, collapsible) or drawer (< lg); a toolbar (history, assistant header, Chat/Map segmented, "Switch to …", New conversation); the conversation.
  - **Messages:** bubbles (§13) with markdown-lite text.
    - **Recommendation cards:** thumbnail, name, category · area, duration, best time, priority with a "Demo ranking" label, "Why this matches you", and Details · Show on map · Add to plan · Ask follow-up.
    - **Proposal card:** type badge, stops, total duration, start time, rationale, numbered stops with times, and Save to My Plans (gradient) → "Saved · Open plan", Review & edit (opens the §17 sheet with the real route map), Show on map.
    - **Notices:** demo (caption), out of credits (warning with a "See plans" link), error.
  - **States:** typing indicator → streaming text with a Stop button; a failed reply shows the error and Retry on the user's message; an offline banner disables sending.
  - **Map mode:**
    - The chat map takes the area, and the conversation floats in a card (start side on wide containers, a bottom panel on narrow ones).
    - **Focus map** collapses the card to a numbered stop list where only the selected stop is expanded, with "Back to conversation".
    - A context badge says "Itinerary · Riyadh map" or "… Expo map (illustrative)". Tourism and Expo are never mixed.
- **History:**
  - "New chat with {name}" (gradient), search, and a {name} / All filter.
  - Groups: Today / Last 7 days / Older. Place conversations show a pin.
  - The ⋯ menu offers Rename (dialog) and Delete (confirmation that can't be dismissed by clicking outside).
- **Docked contextual chat (place details):** a floating panel at the bottom end (26rem wide) on md+, or a sheet from 12dvh on phones, with an "About: {place}" chip, 3 suggested questions (history, what to look for, what's nearby), "Open in Chat", and Escape to close.
- **Interim `/plans/[planId]`:** the plan name, status, and start → numbered stops → end. It is replaced by the Phase 8 plan details.

## 21. Discover screens (Phase 6)

- **`/discover`:** a page header and a large search field (it updates the URL after 300 ms of typing).
  - **Home** (no search or filters):
    - Quick category chips, plus an **Expo 2030** link chip that navigates (D-012).
    - The "Explore Riyadh on the map" card: a live map preview that is inert, with one stretched button that opens map view.
    - Featured places (the §16 bento / swipeable row).
    - The 3 curated collections as horizontal card rows.
    - The browse-by-category tiles.
  - **Results** (any search, filter, sort or map view):
    - A toolbar: "Filters (n)" on phones (a bottom sheet with a "Show N places" button), the sort select, and the List/Map segmented control.
    - Desktop filters always visible in a panel: categories, region, visit duration, indoor/outdoor, family-friendly.
    - A results count, an "In the map area ×" chip, and Clear filters.
  - **List view:** destination cards with an "Add to plan" icon.
  - **Map view:**
    - Category-icon markers and a "Search this area" button. It appears once the view differs from the applied area and filters by the real bounds.
    - The selected marker shows a floating place card with "View details" and "Add to plan".
    - After an area search the camera doesn't jump.
  - **States:** skeletons, an empty state (with "Clear search and filters"), and an error state with retry.
- **`/discover/[placeId]`:**
  - **Hero:** the active character's **"Did you know?"** bubble.
  - **Main column:** category badges, name, area, summary, About, History & culture, Visitor tips, Related places.
  - **Side column:** Add to plan and "Ask {character}", a facts list (suggested visit, best time, indoor/outdoor, family, free entry), opening hours labelled **"Demo — verify before visiting"**, and a mini map.
  - On phones the actions sit under the title.
  - No ratings, reviews or distances (PRD §3).
- **Add to plan dialog:**
  - A list of radio options: unfinished tourism plans, where plans that already include the place are shown "Already in this plan" and disabled, plus **New plan** (draft, editable name).
  - Guests and accounts at their saved-plan limit see why "New plan" is locked.
- **Ask {character}:** creates a conversation with the place context and opens Chat.

## 20. Map (Phase 5, D-023 / D-041)

- **Component:** `MapView` in `shared/map`. It is client-only and loads MapLibre lazily. The review page is `/[locale]/dev/map`.
- **Two modes:**
  - `geo`: real OpenFreeMap tiles (Positron for light, Dark for dark). Base-map labels are in the UI language (`name:ar` / `name:en`, falling back to `name`). The attribution is always visible.
  - `local`: the Expo site plan, with no basemap. The badge **"Illustrative layout · not an official map"** is always visible.
- **Expo site plan** (`widgets/expo-site-map`, revised 2026-10-12 at the user's request):
  - **Hierarchy:** site ground → walkways (a ring around the central plaza plus radial boulevards; width scales with zoom) → 8 numbered zones (subtle color fill, colored border; the selected zone gets a thick border) → numbered locations.
  - **Zone titles:** a number badge in the zone color plus the name. On maps narrower than 560px (container query) they collapse to the badge only, and the legend explains the numbers.
  - **Locations** are numbered `zone.index` (3.2 = zone 3, location 2), and the map, legend example, details and list all show the same number.
    - Pavilions and attractions are pills with a zone-color ring.
    - Visitor facilities are neutral rounded squares with an icon.
    - A selected location fills with its zone color.
  - **Legend** (below the map): zone swatches as buttons that select the zone, the two marker types, and how the numbering works.
  - **Details card:** for a zone, its summary and its locations; for a location, its zone, category, summary, activity with a "demo time", and suggested duration.
  - **List:** grouped by zone, kept in sync with the map, and scrolls to the selection.
  - Clicking a zone (its area or its title) selects it. Selecting a location also highlights its zone.
- **Markers are real buttons rendered into MapLibre HTML markers:**
  - Route stops reuse `MapMarker` / `RouteMarkerVisual` (§12): numbered, current, completed, overdue.
  - Places are a primary circle with an icon; facilities are a small neutral rounded square with an icon.
  - Every marker has an accessible name and `aria-pressed` for selection. The selected or focused marker is raised above the others.
- **Start and end points** (plan route): the approved `start` marker (green circle with footprints; it gets a check badge once the plan has started) and the `destination` marker (dark rounded square with a flag). They are not numbered. The list shows them as "Start · …" and "End · …".
- **Order line:** stops are joined in visit order, from the start point to the end point.
  - Up to the current stop the line is solid pink (5px); the rest is dashed blue (4px; deeper blue `#1f6fd1` on light tiles, `#6cc0fb` on dark).
  - A 9px halo runs under the whole line so it reads on both themes.
  - It is drawn above every basemap layer and below the HTML markers.
  - **It is not a road route.**
- **Keyboard and assistive tech:**
  - Tab moves between markers; Enter or Space selects one. A focused off-screen marker is panned into view.
  - The canvas is its own focusable region, with arrow-key pan and +/− zoom, and is named separately from the map region.
  - Zoom buttons sit at the inline-start top corner. The map itself is never mirrored.
- **Fallback:** without WebGL2, or when the style can't load, the map shows a notice plus a selectable list of the same markers, with a retry for load errors.
- **Selection sync:** each page keeps the map and its list in sync through `selectedId` / `onSelect`. Clicking the map background clears the selection.
- **Reduced motion:** camera moves and label fades are instant.

## 19. App shell (Phase 3, with the Gate D desktop refinements, pending Gate D approval)

**Phones (<768px): approved and unchanged.** Logo + title, language button, notifications, avatar-only account menu; 5-item bottom navigation; safe areas.

**Desktop and tablet (≥768px)**

- **Collapsible rail** (`NavRail`):
  - **Expanded (15rem):** logo + "Morshid", then icon + label rows side by side; Profile pinned at the bottom; the toggle at the very bottom.
  - **Collapsed (5rem):** icons only, with tooltips (opening toward the content) and `aria-label`s. The active item keeps its gradient square.
  - **State:** a single preference (`widgets/app-shell/model/sidebar.ts`, saved in localStorage under `morshid:sidebar`) exposed as `data-sidebar` on the shell.
    - `auto` (no preference) = collapsed on 768–1279px, expanded on ≥1280px.
    - The rail width and the content's inline-start padding are both derived from it in CSS, so they move together with a 300ms transition (none with reduced motion). There's no hydration jump, because the server renders `auto`.
  - **Toggle:** `aria-expanded` and `aria-controls`; the panel icon mirrors in RTL. The rail sits on the inline-start edge, so it collapses toward the right in Arabic and the left in English.
- **Header (right/left end):**
  - Credits indicator (coin + remaining; ok/low/empty tones; links to the existing `/settings#subscription`).
  - Notifications.
  - Expiry warning, only when due.
  - Account trigger (avatar · name · plan underneath · chevron).
- **Account menu:** name, plan line, credits, Profile & settings, Subscription & credits, then a **Language ›** row and a **Theme ›** row (each showing its current value), and Sign in for guests. The two rows render only on ≥768px; phones keep the header language button.
- **Language and Theme submenus** (`shared/ui/dropdown-submenu.tsx`, controlled by one `openSub` state in `UserMenu`):
  - **Opening:** click, or Enter/Space/Arrow, opens a submenu beside its row. It's mirrored in RTL and flips near the viewport edges. Hover alone never opens it. Only one is open at a time; opening one closes the other, and the account menu stays open.
  - **Closing:**
    - Clicking the open row closes it.
    - Escape closes the submenu first and returns focus to its row; the next Escape closes the account menu and returns focus to the account button.
    - Choosing a language or theme applies it, closes the submenu and keeps the account menu open. A language change reloads the page in the new locale, which naturally closes the menu.
    - Clicking outside closes everything. Closing the account menu for any reason resets the submenus.
  - **Pointer:** moving from a row into its submenu, or hovering other rows, never closes it.
- **Expiry warning:** `expiryWarningDays(subscription, now)` (entities/subscription) returns N when the subscription will **end** (cancellation scheduled, or non-renewing) within `EXPIRY_WARNING_DAYS` = 7. It's never shown for auto-renewing, expired or guest. It uses calendar days from today, re-checked hourly. The text is localized with plural rules, e.g. "باقي 7 أيام على انتهاء اشتراكك" / "Subscription expires in 7 days".
- **Data sources:**
  - Name and initials: `entities/user` (demo profile).
  - Plan, credits, expiry: the existing subscription store.
  - Nothing is hardcoded in components; there's no second source of truth.

## 14. Cards and avatars (P-013)

**Card anatomy:** media (fixed ratio) → eyebrow → title → description (max 2 lines) → meta row → actions.

| Element | Value |
|---|---|
| Radius | 16 |
| Border | Hairline |
| Padding | 16–20 |
| Gap | 6 |

**Variants**

| Elevation | Use |
|---|---|
| flat | Lists |
| raised | Plans, dashboards |
| floating | Glass over maps |

**Kinds**
- **Destination:** 4:3 media.
- **Featured destination:** editorial; the title sits on the media over a bottom scrim, the only place a scrim is used.
- **Plan:** eyebrow date + status badge, meta, thin progress bar, actions.
- **Recommendation:** horizontal layout, 3:4 media, priority, a "why" line.
- **Category tile:** compact, icon + label + count; a toggle.

**States**

| State | Treatment |
|---|---|
| Hover (interactive) | −2px lift + md shadow |
| Pressed | Settles |
| Focus | 3px focus ring around the whole card (`focus-within`) |
| Selected | Primary ring + brand tint |
| Disabled | 55% opacity, desaturated, not clickable |
| Loading | `aria-busy` + `CardSkeleton` |

- **One click target:** a card has a single primary target via `CardLink` (a stretched link). Secondary actions sit above it with `relative z-10`.
- **Placeholders:** `ImagePlaceholder` has tones (heritage, nature, modern, food, culture, expo, brand) so grids stay varied without external images (D-026). It can move its caption to the top, or hide it.

**Avatars**

| Size | px | Context |
|---|---|---|
| xs | 24 | Compact lists |
| sm | 32 | Message bubbles |
| md | 40 | Chat header |
| lg | 56 | Cards |
| xl | 80 | Selection |
| 2xl | 112 | Hero |

- **Ring:** the character accent ring, its width scaled to the size.
- **selected:** adds an accent halo. **speaking:** adds a live dot.
- **Crop:** the original artwork is cropped with `object-cover` around a fixed focus point, never stretched.
- **`CharacterCard`:** a radio card for picking a character, in vertical or horizontal layout.

## 15. Tables (P-013)

Use a table only when people compare values across rows: plans, credit history, plan features.

| Element | Style |
|---|---|
| Header | 12px bold muted, 40px high |
| Rows | 56px, hairline separators, no outer grid lines |
| Numbers | Tabular, aligned to the end |
| Primary cell | Row header (`th scope=row`), bold |

**States**
- **Hover:** muted tint.
- **Selected:** brand tint, a 3px inline-start bar and `aria-current`.
- **Keyboard:** Tab to a row, Enter or Space selects it.
- **Long text:** truncated, with the full text as a tooltip.
- **Loading / empty:** skeleton rows; an empty state with an action.

**Narrow containers** (`@container`, below 42rem)
- `stack` (default) turns each row into a card of label/value pairs.
- `scroll` keeps the table and scrolls horizontally, for comparison grids.

**Direction:** alignment is logical, so columns mirror automatically in RTL.

## 16. Discover grid (P-013)

**Hierarchy**
1. Featured: 3 at most. Bento on wide screens (one large tile spanning 2 columns and 2 rows, plus two stacked); a swipeable row of ~82%-wide cards on narrow ones.
2. Standard cards: 1 / 2 / 3 / 4 columns at container widths md / 3xl / 6xl.
3. Category tiles: 2 or 4 columns.

**Filters:** search, which ignores Arabic diacritics and alef/taa-marbuta variants; a region segment (All / Riyadh / Beyond Riyadh); multi-select category chips (selected = ink fill + ✓); a results count; clear.

**States:** empty (with clear filters) and loading (card skeletons).

**Details:** cards open details in a responsive sheet built on `PlaceDetailCard`, with Add to plan and Ask Arif.

## 17. Plan Proposal Sheet (P-013)

**Layout:** a bottom sheet (92dvh) on phones; from md, a 32rem panel at the reading-end edge.

**Header:** title + description (the sheet title), then summary chips: stops, total duration, time range, trip type, schedule hint. Below that, a notice: "proposal — nothing saved until you choose Save".

**Route preview:** an illustrative map, always shown from md; on phones it's behind a toggle so the steps keep the space.

**Steps** (`ProposalSteps`)
- The same rail and markers as the trip timeline.
- **Compact rows:** time range · duration, name + priority/kind badge, a one-line summary.
- **Expanded:** area, context, tips, Ask about this stop, Remove.

**Edit mode**
- Arrow buttons reorder stops; ✕ removes one, with an undo toast instead of a confirm dialog.
- Start and destination are fixed.
- Numbers, times (start + duration + a 15-minute estimated buffer), connectors, the summary and the map all re-derive.

**Footer** (fixed, outside the scroll area, so it never covers the last step)
- **Save to My Plans:** a large gradient button with saving, then saved, states (idempotent demo).
- **Edit itinerary / Continue chatting.**

**Empty:** restore the suggestions, or ask for new ideas.

## 18. Subscription UI (P-012)

**Plans page**
- Three plan cards, with the recommended one (Traveler) marked by a primary ring and a small gradient label.
- A current-plan badge, prices ("to be confirmed" until set), benefits with check marks, and a CTA (upgrade / switch / current / sign in first).
- A monthly/annual segment with no discount claims, a comparison `DataTable` (horizontal scroll on narrow screens), and a "not now" way back.

**Credit meter:** a meter with ok (gradient), low (≤20%, amber) and empty (red) states, plus a renewal date or guest note.

**Limit notices:** low credits, out of credits, save limit and sign-in required. They're non-blocking and name what stays free.

**Settings:** plan, status, billing, renewal or end date, change plan, cancel (a confirmation dialog, because it's consequential) or resume, usage meter, and credit history table.

**Labelling:** everything is labelled demo, with no payment.

## 11. Surface stack and dark theme v2 (P-009)

| Layer (back → front) | Token / utility | Light | Dark |
|---|---|---|---|
| Canvas | `bg-background` + `--ambient` glow on `body` | `#F5F7FC` | `#060A16` |
| Navigation (rail, bottom nav, top bar) | `bg-nav` | `#FFFFFF` | `#0A1021` |
| Chat surface | `bg-chat` | `#FAFBFE` | `#0B1226` |
| Card | `bg-surface` | `#FFFFFF` | `#10182F` |
| Dialog, menu, popover | `bg-surface-elevated` | `#FFFFFF` | `#162039` |
| Floating over map | `glass` (surface-floating + 18px blur) | `rgb(255 255 255/.9)` | `rgb(18 26 50/.84)` |

- **Borders:** dark-mode borders are translucent hairlines, `rgb(148 168 222 / .14)` normally and `/ .26` for strong. Form controls keep a solid `--input-border` (`#62719A` dark), so they stay at ≥3:1 even inside dialogs.
- **Shadows:** dark-mode shadows are deep and soft, with a 1px top highlight, so elevation reads without heavy outlines.
- **Brand glows:** `glow-blue` marks listening and active states; `glow-pink` marks the current stop and speaking. Neither is used as a background fill.
- **Ambient light:** faint blue (top-end), pink (top-start) and navy (bottom) radials, fixed to the canvas, give depth without neon.
- **Forced themes:** `.light` / `.dark` on any element force that palette for a subtree, as in the gallery's side-by-side previews.
- **Contrast** (calculated): primary text 14.4–17.6:1; secondary 7.8–9.9:1; muted 5.2–6.7:1 across all dark layers.

## 12. Route and stop states (P-010)

One visual language is shared by map markers and the trip timeline (`RouteMarkerVisual` / `MapMarker` in `shared/ui/map-marker.tsx`):

| Kind / status | Shape and icon | Color | Label |
|---|---|---|---|
| Start | Circle, footprints | Solid success green | "Starting point" / "Departed" |
| Visit, remaining | Circle, number | Outline primary | (number) |
| Visit, current | Circle, number, pulsing ring | Brand gradient + `glow-pink` | "Current stop" |
| Visit, completed | Circle, ✓ | Muted | "Completed" |
| Visit, overdue | Circle, number + "!" badge | Amber | "Overdue" + explanation |
| Lunch / rest | Dashed circle, cup | Pink tint | "Rest break" |
| Destination | Rounded square, flag | Ink | "Final destination" |

- **Route line** (`RouteLine`): a solid brand gradient up to the last reached stop, then a dashed line, drawn over a halo stroke so it stays visible in both themes. It always carries the disclaimer "visit order, not a walking route".
- **Progress:** one segment per stop, plus counts, the current stop, the schedule and planned time.
- **Timeline:** each stop expands to show its description, tips and actions. Removing a stop shows an undo toast, not a confirmation dialog.
- **Responsive:** on wide screens the panel is glass over the map, on the reading-end side. On phones it's a bottom sheet (peek, or 60% open) with a fixed "current / next stop" action bar above the safe area.

## 13. Voice (P-005, P-011)

- **Composer voice input:** mic → recorder (waveform, timer, live words, ✕ / ✓; Esc cancels; focus moves into the recorder). The recognized text is inserted for editing.
- **Message read-aloud:** `SpeakButton` offers listen, pause/resume and stop. Only one message plays at a time, and the voice is labelled as the device's (demo).
- **Voice Conversation Mode:** the character stage, `VoiceVisualizer` (orb + 29 mirrored bars), a status pill, the caption or review card, a transcript toggle, and a control row: mute · talk/done (72px) · pause/resume + stop, or replay.
- **Atmosphere:** the character's tint plus a faint brand-gradient glow.
- **Reduced motion:** with `prefers-reduced-motion`, bars and the orb stay static and the float animation and pings stop.
- **Limitations:** recognition depends on the browser (Chrome and Edge send audio to the vendor's service; Firefox has none). The voice quality and Arabic availability depend on the device. The speaking animation is synthetic. Answers are simulated.

## 1. Brand

- **Blue** `#59B6F9` · **Pink** `#F842E2` (D-003)
- **Brand gradient (exact):** `linear-gradient(220.29deg, #F842E2 -2.91%, #59B6F9 95.51%)` (D-004)
  - **Uses:** logo, swoosh motif, character hero backdrops, the active rail item, and large display accents. In dark mode it is also used on CTAs, with ink text.
- **Accessible CTA gradient (light mode):** `linear-gradient(220.29deg, #C21BAE -2.91%, #1474C4 95.51%)`.
  - This is the same angle and hue family, deepened so white text passes AA. It is used on text-bearing gradient buttons ("New conversation", "Generate with Arif", "Start Plan").
  - Rationale: white on `#59B6F9` is about 2.2:1, which fails AA.
- **Logo:** `logo.svg` (gradient). A mono white variant will be derived for dark and gradient backgrounds.
- **Motif:** `desing-assets.svg` swoosh, decorative only, `aria-hidden`, at 20–30% opacity.

## 2. Color tokens (semantic)

| Token | Light | Dark (midnight, not black) |
|---|---|---|
| `--bg` | `#F7F8FC` | `#0A0F1E` |
| `--surface` | `#FFFFFF` | `#111830` |
| `--surface-elevated` | `#FFFFFF` (+ shadow) | `#18213D` |
| `--surface-muted` | `#F0F3F9` | `#0E1428` |
| `--surface-brand-tint` | `#F2F8FF` | `#14203F` |
| `--border` | `#E3E8F0` | `#25304F` |
| `--border-strong` | `#C9D2E1` | `#35426A` |
| `--text-primary` | `#0E1A33` | `#EEF2FA` |
| `--text-secondary` | `#55607A` | `#A9B4CC` |
| `--text-muted` | `#626C85` (was `#8590A6`, only 3.2:1 → fixed to ≥4.5:1) | `#8A95B0` |
| `--input-border` (form control outlines, WCAG 1.4.11 ≥3:1) | `#848FA5` | `#5A6890` |
| `--text-on-brand` | `#FFFFFF` | `#0A0F1E` |
| `--action-primary` (solid) | `#1474C4` | `#59B6F9` |
| `--action-primary-hover` | `#0F62A8` | `#7CC6FB` |
| `--action-secondary` (outline/ghost) | border `--border-strong`, text `--text-primary` | same tokens |
| `--accent-pink` (text-safe) | `#A8189A` | `#FA7BEA` |
| `--selection` (list active row) | `#EAF4FE` + 3px inline-start bar `#1474C4` | `#16264A` + bar `#59B6F9` |
| `--success` / text | `#16A34A` / `#15803D` | `#22C55E` / `#4ADE80` |
| `--warning` / text | `#D97706` / `#B45309` | `#F59E0B` / `#FBBF24` |
| `--error` / text | `#DC2626` / `#B91C1C` | `#EF4444` / `#F87171` |
| `--focus-ring` | `#1474C4` | `#7CC6FB` |

**Character accents** (used for the assistant header, avatar ring, switcher, and assistant bubble outline):

| | Light | Dark |
|---|---|---|
| Arif (teal) | `#0F9F8F`, text `#0F766E`, tint `#E6F7F4` | `#2DD4BF`, tint `#0F2A2E` |
| Roaya (violet) | `#7C4DEB`, text `#6D28D9`, tint `#F1ECFE` | `#A78BFA`, tint `#221A40` |

**Priority badges.** Each has an icon as well as a color, because color alone isn't enough.

| Level | Label | Icon | Color |
|---|---|---|---|
| High | موصى به بشدة / Highly recommended | ★ | pink tint + `--accent-pink` text |
| Recommended | موصى به / Recommended | ✓ | blue tint + `--action-primary` text |
| Optional | اختياري / Optional | ○ | neutral |

**Stop states (D-019)**

| State | Marker | Card |
|---|---|---|
| Upcoming | Outline numbered marker | Default |
| Current | Brand-gradient filled marker with glow | Emphasized border |
| Completed | Muted marker with ✓ | Muted card, ✓ checkbox, strikethrough-free (readability) |

**Dark theme character.**
- Deep midnight navy surfaces.
- A faint **aurora** of the brand gradient (radial, 6–10% opacity) behind hero areas: chat empty state, Discover header, auth panel.
- Hairline borders instead of heavy shadows.
- Brand blue becomes the primary action, with ink text.
- Map style switches to the dark tiles.

## 3. Typography (D-006)

- **Display:** `--font-display` = **Cairo** (600/700/800). Used for headings, page titles, character names, and large numbers. It is a temporary stand-in for Expo Arabic: changing that token is the only edit needed.
- **Body/UI:** `--font-body` = **Tajawal** (400/500/700). Used for all body text, controls, and labels.
- Both fonts are self-hosted via `next/font/google` with the Arabic and Latin subsets and `display: swap`.

| Style | Size / line-height (EN) | Arabic line-height | Font / weight |
|---|---|---|---|
| display | clamp(32px, 4vw, 48px) / 1.15 | 1.3 | Cairo 800 |
| h1 | 32 / 1.2 (mobile 28) | 1.35 | Cairo 700 |
| h2 | 24 / 1.3 | 1.45 | Cairo 700 |
| h3 | 20 / 1.35 | 1.5 | Cairo 600 |
| h4 | 17 / 1.4 | 1.55 | Cairo 600 |
| body-lg | 17 / 1.6 | 1.75 | Tajawal 400 |
| body | 15 / 1.6 | 1.75 | Tajawal 400 |
| body-sm | 13 / 1.5 | 1.65 | Tajawal 500 |
| caption | 12 / 1.4 | 1.55 | Tajawal 500 |

Rules:
- No letter-spacing and no uppercase transforms on Arabic.
- Mixed AR/EN strings use `dir="auto"` for user and AI content.
- Numbers use tabular figures in tables and timelines.

## 4. Spacing, radius, borders, shadows

- **Spacing (4px base):** 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80.
- **Radius:**
  - `xs` 6, `sm` 8, `md` 12 (inputs, small cards), `lg` 16 (cards), `xl` 24 (panels, sheets), `2xl` 32 (hero media), `pill` 9999 (buttons, chips, composer, search).
  - The references favor pills and soft cards.
- **Borders:** 1px `--border` by default; 1.5px for focusable inputs on focus.
- **Shadows** (blue-tinted, soft):
  - `sm` `0 1px 2px rgb(14 26 51 / .06)`
  - `md` `0 6px 20px rgb(14 26 51 / .08)`
  - `lg` `0 16px 48px rgb(14 26 51 / .14)` for floating cards over the map
  - `glow` `0 8px 24px rgb(248 66 226 / .22)` for gradient CTAs and the current-stop marker
  - Dark mode: shadows at about 2× opacity, plus a 1px top highlight `rgb(255 255 255 / .04)`.

## 5. Layout and breakpoints

- **Breakpoints:** `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 · `2xl` 1536. Small-mobile QA at 360.
- **Rail:** 80px (≥768, D-013). **Bottom nav:** 64px + safe area (<768, D-014).
- **Top bar:** 64px desktop, 56px mobile.
- **Chat history panel:** 320px. **Chat column:** max 820px. **Floating chat card over the map:** 40% width (min 420, max 560).
- **Content max width:** 1280px. **Page gutters:** 16 / 24 / 32px (mobile / tablet / desktop).
- **Touch targets:** at least 44px (48px in the bottom nav).

## 6. Z-index scale

base 0 · sticky 10 · nav (rail/bottom/top) 20 · map overlays 30 · dropdown 40 · sheet/drawer 50 · modal 60 · popover 70 · toast 80 · tooltip 90

## 7. Motion

- **Durations:** fast 120ms (hover, press), base 200ms (popovers, toggles), slow 320ms (sheets, drawers, page sections).
- **Easing:** standard `cubic-bezier(.2,0,0,1)`, emphasized `cubic-bezier(.3,0,0,1)`.
- **Signature moments** (subtle): character hero float (4s loop, 6px), gradient shimmer on the AI typing indicator, marker selection pulse.
- **`prefers-reduced-motion`:** no transforms or loops; opacity fades of 120ms at most.

## 8. Icons

- **Lucide**, 20px default, 24px in navigation, stroke 1.75. Color comes from `currentColor`.
- **Navigation:** Chat `MessageCircle` + sparkle, Discover `Compass`, Expo `Ticket`, Plans `CalendarDays`, Profile `User` (D-010). `ArrowLeftRight` is reserved for "switch character".
- **Directional icons flip in RTL:** chevrons, arrows, send, back. Non-directional icons don't: clock, map pin, check.

## 9. Components (built incrementally, as screens need them)

**Phase 1 core**
- **Button:** primary, gradient, secondary (outline), ghost, danger, link; sizes sm, md, lg, icon; loading and disabled states.
- **IconButton, Input, Textarea, SearchField** (pill), **Select, Checkbox, Switch, Tabs, SegmentedControl** (Chat/Map, List/Map).
- **Badge:** priority, status, category, demo label.
- **Card, Avatar** (with character ring), **Tooltip, DropdownMenu, Dialog, Sheet/Drawer, Toast, Skeleton, EmptyState, ErrorState, Pagination, Breadcrumbs.**

**Added before the Gate C review** (built in their final FSD locations):
- **Chat:** `CharacterAvatar`, `AssistantHeader`, `CharacterHero` (entities/ai-character); `MessageBubble`, `TypingIndicator`, `SuggestedPrompts` (entities/conversation); `Composer` (features/send-chat-message); `CharacterSwitcher` (features/switch-ai-character).
- **Overlays and maps:** `PlaceDetailCard` (entities/place), `Popover`, `MapMarker`, `ImagePlaceholder` (shared/ui).
- **Overlay rules:**
  - Esc closes every overlay.
  - Focus moves in when an overlay opens and returns to the trigger when it closes.
  - Dialogs and sheets trap focus.
  - Delete confirmations ignore outside clicks.
  - Every overlay has a visible ✕ or Cancel.
  - Max size is the viewport; sheets stop at 90dvh.
  - Sheet actions sit in a fixed footer above the safe area.
  - start/end sides are logical.

**Later phases**
- PlaceCard, RecommendationCard, ProposalCard, StopCard (3 states), MapMarker (number/start/end/facility), PlaceCallout, ChatMessage (user/assistant/notice), AssistantHeader, CharacterSwitcher, Composer, ConversationList, PlanRow/PlanCard, ProgressBar ("2 of 5"), CreditMeter, NotificationItem, AuthLayout.

## 10. Imagery

- Characters: transparent PNGs (`arif.png`, `roaya.png`). Circular avatar crops (head and shoulders) are derived in Phase 2.
- Place and booth photos: **labeled placeholders** until assets are supplied (PRD §9 item 11). Placeholders are gradient tiles with a category icon and a "Placeholder image" caption. Images are never hotlinked.
- All images use `next/image`, responsive sizes, and meaningful `alt` text (decorative images: `alt=""`).
