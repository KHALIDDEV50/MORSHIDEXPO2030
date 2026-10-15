# MORSHID — backend integration guide

**Status: every contract below is PROPOSED by the frontend and awaits backend confirmation.** Nothing here describes an existing server. The detailed models live in `docs/api-contracts.md` (§1–3f); this guide is the checklist the backend team needs to connect the `api-ready` branch.

## 0. Current connection (hybrid mode)

The MORSHID-Expo2030 Spring Boot API now serves **places** and **Expo** with the frontend contracts below; everything else stays on demo data.

| Piece | Value |
|---|---|
| Frontend (Next.js) | `npm run dev` → http://localhost:3000 |
| Backend (Spring Boot) | `./mvnw spring-boot:run` → http://localhost:8080/api/v1 (MySQL on 3306, database `morshid_expo2030` is created automatically) |
| Mobile wrapper (Expo) | Metro on 8081; the WebView loads the deployed web app (`expo.extra.webUrl`), so the API URL is configured in the web app, not in `mobile/` |
| `.env.local` | `NEXT_PUBLIC_DATA_SOURCE=hybrid`, `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1`, `NEXT_PUBLIC_LIVE_DOMAINS=places,expo` |
| CORS | Backend allows `http://localhost:*`, `http://127.0.0.1:*`, `https://*.vercel.app`; add the production domain with `MORSHID_CORS_ALLOWED_ORIGINS` |

| Domain | Source in hybrid mode | Endpoints |
|---|---|---|
| Places (discover, place details, map, place lookups inside plans and chat) | **API** | `GET /places`, `GET /places/:id` |
| Featured places | **API** (falls back to the demo picks, loaded from the API, while no place is flagged `featured`) | `GET /places?featured=true` |
| Collections | demo (backend `GET /collections` is still a stub returning `[]`) | — |
| Expo site plan, booths, booth details | **API** | `GET /expo/layout`, `GET /expo/booths`, `GET /expo/booths/:id` |
| Plans, chat/assistant, notifications, auth/profile, subscription & credits, articles | demo | backend has no compatible contract or no user authentication yet |

Errors: 404 → `NOT_FOUND`, 5xx → `SERVER`, no connection → `NETWORK`, slow → `TIMEOUT`; each has an Arabic/English message in `ErrorState`.

## 1. How the frontend talks to an API

| Piece | Where | Notes |
|---|---|---|
| Data-source switch | `src/shared/config/env.ts` | `NEXT_PUBLIC_DATA_SOURCE`. `main`/`development` default to `mock`; `api-ready` defaults to `http` and needs an explicit `mock` to use the local demo fixtures. |
| HTTP client | `src/shared/api/http-client.ts` | Base URL from `NEXT_PUBLIC_API_BASE_URL`; JSON in and out; **every response is validated with the domain's Zod schema**, so a contract drift becomes `VALIDATION` instead of corrupting the UI. 15 s timeout (`TIMEOUT`), the caller's AbortSignal, and a bearer-token hook (`setAuthTokenProvider`). |
| Errors | `src/shared/api/errors.ts` | One `ApiError` with codes `NETWORK · TIMEOUT · UNCONFIGURED · NOT_FOUND · VALIDATION · UNAUTHORIZED · FORBIDDEN · CONFLICT · RATE_LIMITED · OUT_OF_CREDITS · NOT_IMPLEMENTED · ABORTED · UNKNOWN`. The UI (`ErrorState error=…`) explains each one; **an empty list is never an error** and gets its own empty state. |
| Repositories | `src/entities/*/api/repository.ts` (+ `*.http.ts`, `*.mock.ts`) | UI code only imports the repository interface and the TanStack Query hooks. Demo fixtures never reach components. |
| Assistant | `src/features/send-chat-message/api/assistant.ts` | `AssistantGateway.reply()` → an async stream of `AssistantEvent` (`block-start`, `text-delta`, `done`). |

## 2. Environment variables (`.env.example`, placeholders only)

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_DATA_SOURCE` | yes | `http` (real API) or `mock` (local demo fixtures). |
| `NEXT_PUBLIC_API_BASE_URL` | when `http` | e.g. `https://api.example.com/v1`. Without it every request fails with `UNCONFIGURED` and the UI says the service isn't connected. |
| `NEXT_PUBLIC_MAP_PROVIDER`, `NEXT_PUBLIC_MAP_STYLE_LIGHT/DARK` | no | Map tiles (free OpenFreeMap by default). |

**No secrets belong in the frontend.** Everything prefixed `NEXT_PUBLIC_` is visible to the browser.

## 3. Conventions (proposed)

- **Auth:** prefer an httpOnly session cookie set by the API (the frontend then needs `credentials: 'include'` and CORS with credentials). The alternative is a bearer token supplied through `setAuthTokenProvider`. **Open decision.**
- **Errors:** non-2xx responses with JSON `{ "code": "VALIDATION", "message": "…", "details": { … } }`. HTTP status mapping: 400/422 → VALIDATION, 401 → UNAUTHORIZED, 402 → OUT_OF_CREDITS, 403 → FORBIDDEN, 404 → NOT_FOUND, 409 → CONFLICT, 429 → RATE_LIMITED.
- **Pagination:** `?page=1&pageSize=20` → `{ items, page, pageSize, total }`.
- **Localization:** content fields are `{ ar, en }` objects (the UI picks the language). `?locale=` is only a hint for search ranking.
- **Dates:** ISO 8601 (`YYYY-MM-DD`, `YYYY-MM-DDTHH:mm:ssZ`), times `HH:mm` (local to Riyadh).
- **Images:** absolute HTTPS URLs or paths, plus `alt {ar,en}`, `credit`, `license` and `sourceUrl`. Third-party photos need license metadata (see `docs/image-credits.md`). `placeholder: true` means "no photo".
- **Coordinates:** places use WGS84 `{lat,lng}` with `locationSource`; Expo booths use **local site-plan coordinates** `[x,y]` in a 1000×700 extent. Keep the two models separate.

## 4. Endpoints (proposed)

| Domain | Method & path | Request | Response |
|---|---|---|---|
| Places | `GET /places` | `q, category[], region (riyadh\|saudi), maxDuration, family, indoor, bounds=w,s,e,n, sort, page, pageSize, locale, ids[], featured` | `Page<Place>` |
| | `GET /places/:id` | — | `Place` |
| | `GET /collections` | — | `Collection[]` |
| Expo | `GET /expo/layout` | — | `ExpoLayout` (zones, facilities, site, paths) |
| | `GET /expo/booths` | `q, category, zoneId, ids[]` | `ExpoBooth[]` |
| | `GET /expo/booths/:id` | — | `ExpoBooth` |
| Plans | `GET /plans` | `tab, q, page, pageSize` | `Page<Plan>` |
| | `POST /plans` | `PlanCreateInput` | `Plan` |
| | `POST /plans/from-proposal` | `ProposalToSave` (idempotent per `proposalId`) | `Plan` |
| | `GET/PATCH/DELETE /plans/:id` | `PlanPatch` (stops = full ordered replacement; the server rejects mixed tourism/Expo stops) | `Plan` / 204 |
| | `POST /plans/:id/stops`, `DELETE /plans/:id/stops/:stopId`, `PUT /plans/:id/stops/order`, `PUT /plans/:id/stops/:stopId/completion`, `POST /plans/:id/start` | | `Plan` |
| | `GET /plans/featured`, `POST /plans/featured/:id/copy` | `locale` | `FeaturedPlan[]` / `Plan` |
| Conversations | `GET /conversations` | `characterId, q` | `Conversation[]` |
| | `POST /conversations` | `{ characterId, locale, title, context? }`, context = `place \| booth \| planner \| expo` | `Conversation` |
| | `GET/PATCH/DELETE /conversations/:id` | | `{ conversation, messages }` |
| Assistant | `POST /conversations/:id/messages` | `{ text }` | **SSE**: `event: block-start` (MessageBlock), `event: text-delta` (`{delta}`), `event: done` (the saved `ChatMessage`), `event: error` (`ApiError` body) |
| Notifications | `GET /notifications`, `POST /notifications/:id/read`, `POST /notifications/read-all`, `GET/PUT /notifications/prefs` | | |
| Subscription & credits | `GET /subscription` (snapshot: subscription, balance, history, savedPlans), `GET /subscription/plans`, `POST /subscription/change`, `POST /subscription/cancel`, `POST /subscription/resume` | | `SubscriptionSnapshot` |
| Auth & profile | `POST /auth/login`, `/auth/signup`, `/auth/logout`, `/auth/password/forgot`, `/auth/password/reset`, `GET /auth/session`, `GET/PATCH /me`, `POST /me/password` | | `UserProfile` |

**Server-side rules the frontend relies on:**
1. Credits are debited by the server as part of the message request (1 per reply), and it answers 402 when they are exhausted.
2. Saved-plan limits are enforced by the server (the frontend check is UX only).
3. The proposal save is idempotent.
4. Stop completion is never set automatically.

## 5. Chat and voice

- **Text:** the stream must emit structured blocks (`recommendations` with place/booth refs, `itinerary-proposal`, `notice`) so cards, maps and saving keep working. If the AI returns plain text, the backend (not the browser) must adapt it. **Open decision.**
- **Voice:** today the browser does speech-to-text and text-to-speech (Web Speech API; some browsers send audio to their vendor). A server voice service would plug in behind `shared/lib/speech` providers (`SpeechInputProvider`/`SpeechOutputProvider`): audio upload or WebRTC, plus a voice per character. **Not specified yet.**

## 6. Open decisions for the backend
1. Cookie or bearer token; CORS policy.
2. The source of truth for places and Expo booths (CMS?), and image hosting and licensing.
3. Native structured blocks vs adaptation, for the assistant.
4. Pagination for conversations and messages.
5. Rate limits and the credit-debit semantics on errors or stopped replies.
6. Official Expo 2030 data availability; until then the Expo layout stays illustrative.
