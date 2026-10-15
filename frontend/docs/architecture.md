# MORSHID — Architecture (v1)

> Status: **Proposed for Gate B approval** (P-003). Related documents: `api-contracts.md`, `demo-data.md`, `implementation-plan.md`.

## 1. Technology stack

Versions are pinned to the latest **stable** release at scaffold time, and each pin is recorded in `decisions.md`. Local environment: Node 24.17, npm 10.8 (pnpm is not installed, so we use **npm**), git 2.48.

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router)**, React, **TypeScript strict** | Required by the brief; server components for static content |
| Styling | **Tailwind CSS v4** + CSS-variable design tokens | Semantic tokens and themes; logical properties for RTL |
| UI primitives | **shadcn/ui** (Radix-based, copied into `shared/ui`) | Accessible dialogs, sheets, menus, tabs, and tooltips that we own |
| Icons | **lucide-react** | The shadcn default; consistent stroke style; directional icons flipped in RTL |
| i18n | **next-intl** | App Router plus RSC support, `[locale]` routing, ICU plurals and dates, typed messages |
| Theme | **next-themes** | Light, dark, and system; no flash; persisted |
| Server state | **TanStack Query v5** | Caching, loading and error states, optimistic updates with rollback |
| Client state | **Zustand** (only where shared) | Active character, chat view mode, guided-session UI, map selection |
| Forms | **React Hook Form + Zod** | Plan editor, auth, settings; the Zod schemas are reused as DTO validators |
| Drag and drop | **@dnd-kit** | Accessible stop reordering (keyboard sensor) |
| Map | **maplibre-gl** with our own thin adapter (D-023) | Free, no key; no react-map-gl, because our abstraction is the wrapper |
| Tiles | **OpenFreeMap** (Positron for light, Dark for dark) | Free, commercial use allowed, attribution shown |
| Unit and integration tests | **Vitest + React Testing Library** (+ jsdom) | Required by the brief |
| E2E and viewport tests | **Playwright** *(added; needs approval)* | The brief requires testing *actual* viewport sizes and RTL; this can't be done in jsdom |
| Lint and format | **ESLint** (Next config + `eslint-plugin-boundaries` for FSD layer rules) + **Prettier** | Enforces the FSD dependency direction automatically |

**maplibre-gl version:** v6.0.0 (July 2026) is ESM-only and needs WebGL2. At scaffold time we use v6 if Next bundles it cleanly; otherwise the latest 5.x. The decision is recorded either way. **Decided in D-041:** `maplibre-gl` 6.11.2. Its worker module is served from `public/vendor/maplibre-gl/<version>/` (copied by `scripts/copy-maplibre-worker.mjs`) and registered with `setWorkerUrl`. No RTL text plugin is needed in v6.

## 2. Feature-Sliced Design on Next.js

Next.js reserves `app/` (routes) and `pages/`. Convention:
- `src/app` is Next routing **and** the FSD *app* layer: thin route files, layouts, and providers.
- The FSD *pages* layer is named **`src/views`**, to avoid the Next `pages/` conflict.

```
src/
  app/                         # FSD app layer + Next routes (thin)
    [locale]/
      layout.tsx               # <html lang dir>, fonts, providers, AppShell
      page.tsx                 # → redirect to /[locale]/chat
      (auth)/login|signup|forgot-password|reset-password/page.tsx
      (platform)/
        chat/page.tsx, chat/[conversationId]/page.tsx
        discover/page.tsx, discover/places/[placeId]/page.tsx
        expo/page.tsx, expo/booths/[boothId]/page.tsx
        plans/page.tsx, plans/new/page.tsx, plans/[planId]/page.tsx,
        plans/[planId]/edit/page.tsx, plans/[planId]/guide/page.tsx
        settings/page.tsx, settings/credits/page.tsx
        notifications/page.tsx
      dev/design-system/page.tsx   # dev-only component gallery (Gate C review)
    providers/                 # QueryClient, Theme, Intl, Toaster
    globals.css                # tokens (light/dark), Tailwind layers
  views/                       # FSD "pages": one composition per route
  widgets/                     # app-shell, nav-rail, bottom-nav, top-bar, chat-workspace,
                               # chat-history, discover-explorer, place-detail, expo-explorer,
                               # plans-overview, plan-editor, plan-workspace, guided-plan,
                               # notifications-panel, settings-panels, auth-layout
  features/                    # send-chat-message, switch-ai-character, manage-conversation,
                               # save-proposal-to-plans, add-to-plan, filter-places, search-places,
                               # reorder-stops, toggle-stop-completion, start-plan, delete-plan,
                               # ask-about-place, switch-language, switch-theme,
                               # manage-notifications, authenticate-user, manage-subscription
  entities/                    # user, ai-character, conversation, place, expo, plan,
                               # notification, credits, subscription
    <entity>/
      model/ (types.ts, schema.ts, selectors.ts)
      api/   (<entity>.repository.ts  — interface
              <entity>.mock.ts        — demo impl
              <entity>.http.ts        — HTTP impl (stub until backend)
              index.ts                — resolves impl from config)
      ui/    (entity-level presentational pieces, e.g. PlaceCard, StopMarker)
      index.ts                    # public API
  shared/
    api/      (http-client.ts, errors.ts, types.ts, mock-store.ts, latency.ts)
    config/   (env.ts — validated with Zod, locales.ts, characters registry)
    i18n/     (routing.ts, request.ts, format.ts)
    lib/      (cn, date/number formatting, google-maps-link, geo/bounds)
    map/      (MapAdapter interface, MapView component, maplibre adapter, local-layer)
    ui/       (shadcn components + design-system components)
    hooks/, types/, constants/, assets/
messages/ar.json, messages/en.json     # namespaced per feature
public/images/                          # characters, logo, motif, demo placeholders
tests/e2e/                              # Playwright
```

**Rules** (lint-enforced by `eslint-plugin-boundaries`)
- Imports only go downward: app → views → widgets → features → entities → shared.
- Slices import each other only through `index.ts` public APIs.
- No imports across entities, except through the `@x` cross-import convention. Messages reference places by **ID** to keep entities decoupled.
- Presentational components contain no business logic or repository calls. Data flows through hooks in `features/*/model` or `entities/*/api`.
- **Server components by default.** `"use client"` only for interactive leaves: chat, map, forms, toggles.
- **Static catalog data** (places, booths, characters) is read on the server so Discover and Expo pages render fast and are crawlable.
- **User data** (plans, conversations, progress) is client-side via TanStack Query, because demo persistence lives in the browser.

## 3. Data layer and dependency injection

- **One interface per domain:** `AuthRepository`, `UserRepository`, `ConversationRepository`, `AssistantGateway`, `PlaceRepository`, `ExpoRepository`, `PlanRepository`, `NotificationRepository`, `CreditsRepository`, `SubscriptionRepository`. Full contracts are in `api-contracts.md`.
- **Selection:** `NEXT_PUBLIC_DATA_SOURCE=mock|http`. Each `entities/<x>/api/index.ts` exports the implementation for that value. The UI never imports demo arrays.
- **Mock implementations:**
  - Seeded from `entities/<x>/api/demo/*.ts` (typed, stable IDs).
  - User-generated data is persisted to `localStorage` under a versioned key (`morshid:v1:*`), with a schema check that falls back to the seed on mismatch.
  - Simulated latency (150–600 ms).
  - Optional error injection (`?demoError=plans` or a dev toggle) to exercise error states.
- **HTTP implementations:**
  - Use `shared/api/http-client.ts`: base URL from env, typed responses, `AbortSignal` support, auth header hook, and errors normalized to `ApiError { code, status, message, details }`.
  - They stay stubs that throw `NotImplemented` until a backend contract is agreed.
- **Switching to the real backend** means implementing `*.http.ts` against agreed endpoints and setting `NEXT_PUBLIC_DATA_SOURCE=http`. No UI changes.

## 4. Mock AI assistant

- `AssistantGateway.reply(request)` returns a **stream of typed message blocks**: text, recommendations, itinerary-proposal, notice.
- The mock uses an intent matcher (AR/EN keyword sets with normalized Arabic: alef, taa marbuta, diacritics), then a scenario builder that **assembles blocks from repository data** by IDs. There is no hardcoded text in components.
- Simulated token streaming; 1 demo credit per reply; an "out of credits" notice.
- Proposals are stored in the conversation (D-021). `save-proposal-to-plans` is idempotent: the plan stores `sourceProposalId`, and a repeat save returns the existing plan.

## 5. State ownership

| State | Owner |
|---|---|
| Catalog (places, booths, characters) | Server components / TanStack Query (read-only) |
| Conversations, messages, proposals | TanStack Query ← `ConversationRepository` |
| Plans, stops, progress (single source of truth for D-019) | TanStack Query ← `PlanRepository` (optimistic toggles with rollback) |
| Active character | URL for the conversation; Zustand `useCharacterStore` (persisted) for new chats |
| Active conversation | URL `/chat/[conversationId]` |
| Chat view mode (chat/map), map-focus mode | Zustand (UI only) |
| Selected stop or marker | URL search param `?stop=<id>` (shareable, survives language switch) |
| Plan editing draft | React Hook Form (local), saved through the repository |
| Guided session (current stop) | Derived from plan progress + `?stop=`; nothing duplicated |
| Discover filters and sort | URL search params |
| Theme | next-themes (cookie/localStorage) |
| Locale | URL segment `[locale]` + cookie |
| Auth session | `AuthRepository` + TanStack Query `['session']` |

The **language switch** changes only the `[locale]` segment and keeps the path and query, so plan, conversation, and selection state survive.

## 6. Localization

- `shared/config/locales.ts` defines `{ code, dir, label, fontStack }`. v1 ships `ar` (default, rtl) and `en` (ltr). Adding a language means adding a messages file and a config entry.
- Messages are namespaced per slice (`chat.*`, `plans.*`, …) and typed through next-intl's TypeScript augmentation, so a missing key is a compile error.
- Content data uses `LocalizedText = { ar: string; en: string } & Partial<Record<Locale, string>>`, resolved with a fallback chain (requested → en → ar).
- Layout uses logical properties only (`ms-*`, `pe-*`, `start-*`, `text-start`). Directional icons get `rtl:-scale-x-100`.
- Dates, times, and numbers go through `Intl` (next-intl formatters). Arabic UI uses Latin digits by default **[ASSUMPTION: matches references]**.

## 7. Map abstraction (D-023)

```ts
interface MapAdapter {           // shared/map (as built in Phase 5)
  provider: 'maplibre' | 'google'; isSupported(): boolean;          // WebGL2 probe, cached
  mount(el: HTMLElement, opts: MapInitOptions): Promise<MapInstance>; // mode geo|local, theme, locale, dir
}
interface MapInstance {
  setMarkers(anchors: { id; position: LatLng | [x, y] }[]): void;   // creates marker containers
  getMarkerElements(): ReadonlyMap<id, HTMLElement>;                 // React portals buttons into these
  setOrderLine(line: { ids; progressIndex? } | null): void;          // visit-order connector (not a road route)
  setSelected(id | null): void; reveal(id): void; fitTo(ids?): void;
  getBounds(): Bounds;                                                // local x/y in Expo mode
  on('boundsChange' | 'poiClick' | 'backgroundClick' | 'markers' | 'ready' | 'error', cb): Unsubscribe;
  setTheme('light' | 'dark'): void; setLocalLayer(layer): void; resize(): void; destroy(): void;
}
```

- `<MapView>` (client-only, `next/dynamic` with `ssr:false`, lazy-loaded) takes props and calls the adapter.
- **Providers:** `maplibre` (v1) and `google` (later). Selected with `NEXT_PUBLIC_MAP_PROVIDER`.
- **Tourism:** OpenFreeMap style. Base-map POIs are muted. Clicking a base-map POI shows its OpenStreetMap name and category, plus "Not in MORSHID guide" or our place card when it matches.
- **Expo:** the same engine with **no tile basemap**. Zones, booths, and facilities come from GeoJSON in a local coordinate system. A permanent "illustrative" label is always shown.
- **Accessibility:** every map has a synchronized list fallback. Markers are focusable buttons rendered as HTML markers.

## 8. Theming and design tokens

CSS variables live in `globals.css` (`:root` and `.dark`) and map to Tailwind v4 `@theme`. Components use only semantic tokens. Values are in `design-system.md`.

## 9. Testing strategy

- **Unit tests (Vitest):** repositories (mock contract tests shared with the future HTTP implementation), the intent matcher, plan operations (add, remove, reorder, toggle, progress), filters and bounds, the Google Maps link builder, and Arabic normalization.
- **Component tests (RTL):** chat history operations, proposal save idempotency, filter panels, stop list sync, language and theme switching.
- **E2E (Playwright):** the main journeys (§2 of the PRD) at viewports **360, 390, 768, 1024, 1280, 1536** × **ar/en** × **light/dark** smoke runs, plus screenshots for visual review.
- **Per-phase gate:** `tsc --noEmit`, `eslint`, `vitest run`, and the relevant Playwright specs must pass. Results are reported faithfully.

## 10. Environment variables (`.env.example`)

```
NEXT_PUBLIC_DATA_SOURCE=mock          # mock | http
NEXT_PUBLIC_API_BASE_URL=             # used when DATA_SOURCE=http
NEXT_PUBLIC_MAP_PROVIDER=maplibre     # maplibre | google
NEXT_PUBLIC_MAP_STYLE_LIGHT=https://tiles.openfreemap.org/styles/positron
NEXT_PUBLIC_MAP_STYLE_DARK=           # OpenFreeMap dark style URL, verified at scaffold
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=      # optional, only after approval
```

No secrets are committed. `.env.local` is git-ignored.

## 12. Voice (proposal P-005, pending approval with Gate C)

**Contracts** (`src/shared/lib/speech/types.ts`)
- `SpeechInputProvider`: `support()` and `start({lang}, handlers) → { stop, cancel }`.
- `SpeechOutputProvider`: `support(lang)`, `speak`, `pause`, `resume`, `stop`, and `canPause`.
- `SpeechServicesProvider` (React context) swaps providers per subtree: simulated in the gallery and tests, a backend later.
- A single `PlaybackController` guarantees that only one message speaks at a time.

| Capability | v1 implementation | Works locally? | Needs a future backend for… |
|---|---|---|---|
| Mic permission, recording, waveform, cancel | `getUserMedia` + Web Audio analyser | ✅ Free, all modern browsers | — |
| Speech → text | Web Speech `SpeechRecognition` (Chrome, Edge, Safari) | ⚠️ Free, but **Chrome/Edge send audio to the vendor's speech service**; not available in Firefox | Consistent recognition on all browsers, and offline use |
| Text → speech | `speechSynthesis` with device voices; sentence chunking; per-character pitch/rate tweak | ✅ Free; offline when the device has local voices; Arabic depends on installed voices | **Custom Arif/Roaya voices**, consistent Arabic quality |
| Simulated providers | `createSimulatedSpeechInput` / `createSimulatedSpeechOutput` | ✅ For the gallery and tests; always labelled "Simulated" | — |

**Rules**
- Audio is captured only after an explicit tap. Nothing records in the background.
- MORSHID never stores or uploads audio.
- Transcripts are inserted for editing and never sent automatically.
- TTS is always labelled as a demo device voice.
- Every failure shows an explanation, never a broken control.

## 11. Security notes

- Mock auth is not security. Real protection belongs to the future backend.
- No payment secrets in the frontend.
- External links (Google Maps) use `rel="noopener noreferrer"`.
- User-entered text is rendered as text; there is no `dangerouslySetInnerHTML` for chat.
