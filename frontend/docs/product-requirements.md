# MORSHID — Product Requirements (v1, first frontend release)

> Status: **Proposed for Gate A approval** (P-002). Approved decisions are referenced as `D-xxx` (see `docs/decisions.md`).
> Items marked **[ASSUMPTION]** are Claude's design-judgment calls, listed again in §9 for confirmation.

## 1. Product summary

MORSHID (مرشد) is a multilingual AI tourism companion for **Riyadh, Saudi Arabia, and Expo 2030 Riyadh**. Two AI characters, **Arif (عارف)** and **Roaya (رؤية)**, help visitors decide **what to visit, why it matters, and how to organize it** into a practical itinerary.

The first release is a **frontend-first demo**:
- It runs entirely on mock data and mock adapters. No AI key, backend, or payment provider is needed.
- It is architected so real services can replace the mocks without UI rewrites.

## 2. Users and primary journeys

| User | Need |
|---|---|
| International tourist (EN) | Understand what Riyadh offers and plan days efficiently |
| Arabic-speaking / Gulf visitor (AR) | Explore heritage and modern Riyadh in Arabic, plan family trips |
| Expo 2030 visitor (AR/EN) | Find relevant pavilions and booths, and plan a focused Expo visit |

**Primary journeys**

1. **Ask → Plan:** chat with Arif or Roaya → get recommendations or an itinerary proposal → adjust it → **Save to My Plans** (D-021) → view it in List or Map → **Start Plan** (guided mode).
2. **Discover → Plan:** browse or search places → place details → **Add to plan** or **Ask Arif/Roaya about this place** (D-022).
3. **Expo → Plan:** browse the Expo zones and booths on the illustrative map → booth details → add to an Expo plan.
4. **Follow a plan:** open a plan → Start → for each stop, optionally "Navigate with Google Maps" → mark complete → plan completed (D-017 to D-019).
5. **Account:** sign up or log in (mock) → settings (language, theme, notifications) → credits and subscription (demo).

## 3. Global rules (all modules)

- **Navigation:** 5 destinations: Chat, Discover, Expo 2030, My Plans, Profile (D-010 to D-015).
- **Languages:** Arabic (default, RTL) and English (LTR). Every label comes from a translation dictionary. Demo content exists in both languages.
- **Language switching** keeps the current page, plan, and conversation state.
- **Themes:** light, dark, and system. The choice is persisted.
- **Responsive:** 360px to ≥1536px. Every screen has a defined mobile layout, never a shrunk desktop.
- **States:** every data view has loading (skeleton), empty, error (with retry), and success states.
- **Honesty rules:**
  - No fabricated ratings, reviews, or distances from the user.
  - No live GPS or navigation.
  - The Expo layout is labeled illustrative (D-023).
  - Mock priorities are labeled as demo, never as real AI confidence.
  - Opening hours are marked "demo — verify before visiting".
- **No inert controls:** every visible button works (mock behavior is fine) or is not shown.
- **Not in v1 (removed from references):**
  - "Save" / favorites hearts (D-022).
  - Star ratings and review counts.
  - Distance-from-user ("5.8 km").
  - Mic (voice input) and attach buttons in the composer **[ASSUMPTION]**.
  - Social login (Google/Apple).
  - Slash-command shortcuts and "tone" tabs in the docked chat **[ASSUMPTION]**.

## 4. Modules

### 4.1 Chat — Arif & Roaya (Module A)

**Layout:** see the reviewed references for Screens 1–8 and D-013 to D-015.
- **Desktop:** rail, collapsible history panel, chat, and a **Chat ↔ Map** view toggle.
- **Map mode:** the chat floats as a card over the map.
- **Tablet:** history in a drawer; map mode uses a bottom sheet.
- **Mobile:** top bar with a Chat/Map segmented toggle; the composer sits above the bottom nav.

**Conversations**
- New conversation; history grouped by Today, Last 7 days, and Older; search; open, rename, and delete (with confirmation) through a ⋯ menu.
- **Each conversation belongs to one character [ASSUMPTION]:**
  - "Switch to Roaya" opens Roaya's most recent conversation, or a new one.
  - The history panel shows the active character's conversations, with a filter for "all".

**Character identity**
- Character config: id, names (AR/EN), accent token (Arif = teal, Roaya = violet), avatar crops, full art, greeting, suggested prompts, persona description.
- Names are rendered as localized text, not baked into images.
- **[ASSUMPTION] personas (demo copy only):**
  - **Arif:** energetic local guide, history and heritage storyteller.
  - **Roaya:** calm planner, culture, family, and Expo/innovation focus.

  Both can answer every scenario.

**Empty state**
- Large character hero with the swoosh motif, a greeting, and **4 suggested prompt chips** per character.
- After the first message, the hero becomes a compact assistant header.

**Message types** (structured blocks, not hardcoded UI text)
1. **Text.** Markdown-lite: paragraphs, lists, bold.
2. **Recommendations:** cards with image, name, category, area, suggested duration, best time (if known), priority (**موصى به بشدة / موصى به / اختياري**), "Why this matches you", and the actions **Details · Show on map · Add to plan · Ask follow-up**.
   - "Add to plan" opens a picker: an existing plan of the matching type, or a new plan.
3. **Itinerary proposal (D-021):**
   - Shows title, type (Tourism or Expo; never mixed), date and start time, total duration, and ordered stops with time, duration, and priority, plus an explanation of the order.
   - Per-stop actions: keep/remove, reorder, details.
   - Card actions: **Save to My Plans** (idempotent, toast, then "Saved · Open plan"), Show on map, and "Edit in planner".
4. **System notices:** for example "Demo response", or "Out of credits" with an upgrade link.

**Composer**
- Multiline input; Enter to send, Shift+Enter for a newline.
- Send button (gradient) with a disabled state.
- Character-count guard.
- Disclaimer: "Morshid can make mistakes" with a Terms link (localized).

**States**
- Typing indicator, simulated streaming, error with **Retry**, and an offline notice.

**Mock assistant**
- Predefined scenarios, matched by AR/EN intent keywords:
  - Riyadh historical sites
  - Modern Riyadh / architecture
  - Family day
  - Food & cafés
  - Saudi highlights beyond Riyadh
  - AI and tech booths at Expo
  - Half-day Expo tech itinerary
  - 1-day Riyadh heritage itinerary
  - Place follow-up questions (history, focus, nearby)
- Any other request gets an honest fallback listing the supported demo topics.
- Each AI reply costs **1 demo credit [ASSUMPTION]**.

**Chat map**
- Shows the active proposal or recommendations on the **tourism** or **Expo** map, chosen automatically by type, with a context badge.
- Numbered markers, start marker, dashed visit-order connectors (not roads).
- Only the selected stop is expanded; selection is synced with the list (A6, D-020).
- The "focus map" mode (Screen 7) collapses the chat to a compact stop list with "Back to conversation".

**Acceptance criteria**
- Each of the 9 scenarios returns coherent, matching content in AR and EN.
- Save creates exactly one plan.
- Switching character changes identity, accent, and conversation list.
- Rename and delete persist across reloads.
- Map and list selection stay in sync.
- Works at 360px in both directions.

### 4.2 Discover (Module B)

**Home** (Screen 9, corrected)
- Headline and search field.
- **Category chips** (configurable list): All · Heritage & History · Museums · Nature & Outdoors · Food & Cafés · Shopping · Entertainment · Family · Culture & Events.
- An "Expo 2030" chip **links to the Expo destination** (D-012).
- Map preview card ("Explore Riyadh on the map").
- Featured carousel.
- **2–3 curated collections with distinct titles** (e.g. "Heritage of Riyadh", "Modern Riyadh", "Beyond Riyadh").

**Results** (list or map view)
- **Filters:** category, region (Riyadh districts / Saudi regions), visit duration, family-friendly, indoor/outdoor.
- **Sort:** relevance (default, defined as keyword match score, then featured), name, or suggested duration.
- Filters drive both views identically.
- **Map view:** pan and zoom; "Search this area" filters by the **actual map bounds** (B4); a marker opens a place card.
- **Mobile:** filters in a bottom sheet; a list/map toggle.

**Place details** (Screen 10, corrected)
- Hero image with the **active character's narration bubble** (a short "did you know" fact).
- Name, category, area, suggested duration, opening hours (demo label), description, history & culture, visitor tips, mini map, related places.
- **Actions:** Add to plan · Ask {character} about this place (D-022).
- **Docked contextual chat [ASSUMPTION]:**
  - A floating panel at the bottom corner on desktop; a full sheet on mobile.
  - Shows a context chip ("About: Masmak Fortress") and the suggested questions from brief B3.
  - It is a real conversation saved to history with the place context attached.

**Acceptance criteria**
- Search plus each filter combination updates list and map consistently.
- Bounds search uses real coordinates.
- Place details render in AR and EN.
- Add-to-plan updates the same plan model used by Chat.

### 4.3 Expo 2030

- **Expo home:**
  - The **illustrative interactive map** (zones as areas, booths as points, facilities as icons) with a permanent "Illustrative demo layout — not official" label.
  - A booth list with search and category filters (AI & Tech, Sustainability, Culture, Mobility, Health, Countries) **[ASSUMPTION: demo categories]**.
- **Booth details** (Screen 8): tabs for Activities & sessions · Description · Location; tiles for suggested duration, booth number, and category.
  - Actions: Add to plan (Expo plans only) · Show on map · Ask {character}.
- **Expo plans** use the same plan and stop model with `type: "expo"`. Stops reference booths. "Navigate with Google Maps" is **hidden** for Expo stops; only the illustrative location is shown.
- **Acceptance criteria:** never mixes tourism places into Expo plans; the label is always visible on the Expo map; no path-through-walls routing.

### 4.4 My Plans (Module C)

**Overview** (Screen 11, corrected)
- **Tabs [ASSUMPTION]:** All · Upcoming · In progress · Completed · Drafts.
  - **Upcoming:** saved, not started.
  - **In progress:** started (guided mode entered or at least one stop completed), not all stops completed.
  - **Completed:** all stops completed (D-019).
  - **Drafts:** manually created plans saved before they're finalized (brief C2). Chat proposals never appear here (D-021).
  - **"Featured" is a row of curated ready-made plans** above the tabs that users can **copy** into their own plans.
- Search and pagination.
- **Desktop:** row list (name, type, date and time, duration, stops, status, ⋯ menu). **Mobile:** cards.

**Create / edit** (Screen 12, corrected)
- Name, type (Tourism / Expo), date, start time.
- Stops: add from search, Discover, or Expo; "Generate with {character}" opens the chat with the planner context.
- Reorder (drag plus keyboard buttons), times and durations editable, total stops and duration summary.
- Validation (React Hook Form + Zod); Save draft / Save.
- **Delete** requires a confirmation dialog.

**Plan details** (Screen 13, corrected)
- Title, summary (date, duration, stops, progress).
- **List / Map toggle** (D-016); at ≥1280px the Map view keeps a compact synced stop list beside the map.
- Preparation advice and warnings derived from data (e.g. "Stop 3 closes at 22:00 — demo hours").
- Actions: **Start Plan** (primary), Edit, Delete (danger, confirmation).

**Guided mode:** D-017 to D-019 exactly.

**Acceptance criteria**
- Add, remove, reorder, and complete persist and stay in sync across List, Map, and Guided.
- Completion is undoable.
- A completed plan moves to the Completed tab.
- No duplicate saves.

### 4.5 Settings & Notifications (Module D)

- **Settings sections:**
  - Profile: name, email (read-only in demo), avatar initials.
  - Language.
  - Theme.
  - Notification preferences: four toggles (itinerary reminders, plan updates, recommendations, announcements).
  - Security: change password, mock.
  - Subscription & credits (links to Module E).
  - Sign out.
- **Notifications:**
  - Bell in the top bar on desktop and mobile; a popover on desktop, a full page on mobile.
  - Read/unread, mark one or all as read, empty state.
  - Preference toggles filter which demo notifications are generated.

### 4.6 Credits & Subscriptions (Module E)

- Balance, usage history (per chat reply), current plan, plans comparison (**Free / Explorer / Pro**, demo prices labeled "demo"), and feature limits.
- **"Upgrade" opens a dialog** explaining that payments are not integrated in the demo. It can **simulate** switching the plan in mock data **[ASSUMPTION]**.
- No payment provider; no secrets in the frontend.

### 4.7 Authentication (Module F)

- Login, sign up, forgot password, reset password, sign out; loading and error states.
- **Layout [ASSUMPTION]:** the reference is a third-party sample. MORSHID version:
  - Desktop: split screen, with a brand-gradient panel (character, tagline, swoosh) beside the form.
  - Mobile: compact gradient header above the form.
  - **No Google/Apple buttons** (social login not approved).
- **Guest mode [ASSUMPTION]:** guests can use Chat, Discover, and Expo with **10 demo credits**. **Saving a plan, Settings, and Credits require sign-in.** Saving prompts a sign-in sheet and then completes the save.
- **Mock auth:** any well-formed email and a password of 8+ characters succeeds. There is also a prefilled demo account. The UI states that this is not production security.

## 5. Accessibility & quality

Semantic landmarks; full keyboard support (including the map: marker list fallback, focusable markers); visible focus; WCAG AA contrast; labelled forms with useful errors; reduced motion; accessible dialogs, sheets, and drawers; meaningful alt text.

## 6. Dependencies & demo limitations

| Area | v1 (demo) | Later (real) |
|---|---|---|
| AI | Mock scenario engine | AI backend through the `AssistantGateway` interface |
| Data | In-memory and `localStorage` mock repositories | HTTP repositories (same contracts) |
| Tourism map | MapLibre + OpenFreeMap (D-023) | Optional Google Maps adapter |
| Expo map | Illustrative layout, labeled | Official venue data, if published |
| Navigation | Google Maps link only (D-018) | — |
| Auth | Mock adapter | Real auth API |
| Payments | Simulated dialog | Payment provider (after security review) |
| Images | Labeled placeholders until assets are supplied | Licensed photography |

## 7. Future (not v1)

Favorites; voice input; attachments; social login; real AI; real payments; 18 more languages; booking; offline mode; dedicated Heritage/Nature landing pages (D-011); live events feed.

## 8. Release acceptance (Definition of Done)

Every module meets the brief's §14 Definition of Done:
- Approved design, shared design system, demo data via typed repositories.
- Responsive, AR/EN with RTL/LTR, light and dark.
- Loading, empty, and error states.
- Tests, type check, and lint run and passing.
- Limitations documented.

## 9. Assumptions to confirm at Gate A

1. Mic and attach buttons are hidden in v1.
2. Each conversation belongs to one character; switching opens that character's conversations.
3. Demo personas: Arif is the heritage storyteller; Roaya is the calm planner with a culture/Expo focus.
4. 1 demo credit per AI reply; guests get 10.
5. Docked contextual chat on place details, without slash commands or tone tabs.
6. My Plans tabs: All / Upcoming / In progress / Completed / Drafts, plus a "Featured" row of copyable curated plans.
7. Expo demo booth categories as listed in §4.3; Google Maps link hidden for Expo stops.
8. Guests can chat and browse; saving plans, Settings, and Credits require (mock) sign-in.
9. "Upgrade" simulates a plan change in the demo, with no payment.
10. Auth layout: MORSHID split screen, no social buttons.
11. **Images:** labeled placeholders until you supply photos. Alternatively, Claude can source **CC-licensed Wikimedia Commons** photos, downloaded locally with attribution (not hotlinked). This option needs your OK.
