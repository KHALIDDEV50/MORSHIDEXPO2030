# MORSHID — API Contracts (v1, proposed)

> Status: **Proposed (part of Gate B)**. These are the **frontend contracts** that both the mock and the future HTTP repositories implement.
> The REST endpoints in §4 are **proposals only**; the backend is not designed yet. Uncertain fields are marked `// ?`, and the types will live in `entities/*/model/types.ts`.

## 1. Shared types

```ts
type Locale = 'ar' | 'en';                       // extensible to 20
type LocalizedText = { ar: string; en: string } & Partial<Record<string, string>>;
type ID = string;                                // stable, prefixed: plc_, booth_, zone_, plan_, stop_, conv_, msg_, prop_, ntf_, usr_
type ISODate = string;                           // '2026-10-11'
type ISODateTime = string;                       // UTC ISO-8601
type LatLng = { lat: number; lng: number };
type Bounds = { north: number; south: number; east: number; west: number };

interface Page<T> { items: T[]; page: number; pageSize: number; total: number }
interface ApiError { code: 'NETWORK' | 'NOT_FOUND' | 'VALIDATION' | 'UNAUTHORIZED' | 'FORBIDDEN'
  | 'CONFLICT' | 'RATE_LIMITED' | 'OUT_OF_CREDITS' | 'NOT_IMPLEMENTED' | 'UNKNOWN';
  status?: number; message: string; details?: Record<string, unknown> }
type Priority = 'high' | 'recommended' | 'optional';   // demo ranking, not AI confidence
type DataProvenance = 'verified' | 'demo';             // shown in UI where relevant
```

## 2. Domain models

```ts
// AI characters (static config, not an API)
interface AiCharacter { id: 'arif' | 'roaya'; name: LocalizedText; accent: 'teal' | 'violet';
  persona: LocalizedText; greeting: LocalizedText; suggestedPrompts: LocalizedText[];
  images: { full: string; avatar: string } }

// Places (tourism)
type PlaceCategory = 'heritage' | 'museums' | 'nature' | 'food' | 'shopping' | 'entertainment'
  | 'family' | 'culture';
interface Place { id: ID; name: LocalizedText; categories: PlaceCategory[];
  region: { city: LocalizedText; district?: LocalizedText; regionCode: string };
  location: LatLng; locationSource: string;              // e.g. 'osm:node/123' — verified only
  summary: LocalizedText; description: LocalizedText; history?: LocalizedText;
  tips: LocalizedText[]; suggestedDurationMin: number;
  bestTime?: LocalizedText; openingHours?: { text: LocalizedText; provenance: DataProvenance };
  attributes: { familyFriendly: boolean; indoor: boolean; freeEntry?: boolean };
  images: { src: string; alt: LocalizedText; placeholder: boolean; credit?: string }[];
  narration?: LocalizedText;                              // character "did you know" bubble
  featured: boolean; collectionIds: ID[]; relatedPlaceIds: ID[] }
interface PlaceQuery { q?: string; categories?: PlaceCategory[]; regionCode?: string;
  maxDurationMin?: number; familyFriendly?: boolean; indoor?: boolean; bounds?: Bounds;
  sort?: 'relevance' | 'name' | 'duration'; page?: number; pageSize?: number; locale: Locale }
interface Collection { id: ID; title: LocalizedText; placeIds: ID[] }

// Expo (separate model — D-012, D-023)
interface ExpoZone { id: ID; name: LocalizedText; color: string; polygon: [number, number][];  // local coords
  provenance: 'demo' }
interface ExpoBooth { id: ID; zoneId: ID; number: string; name: LocalizedText;
  category: 'ai-tech' | 'sustainability' | 'culture' | 'mobility' | 'health' | 'countries';
  summary: LocalizedText; description: LocalizedText; activities: { title: LocalizedText;
  time?: string }[]; suggestedDurationMin: number; position: [number, number];   // local coords
  images: Place['images']; provenance: 'demo' }
interface ExpoFacility { id: ID; kind: 'entrance' | 'restroom' | 'prayer' | 'info' | 'food' | 'firstaid';
  position: [number, number] }

// Plans (one model for chat proposals, Discover, Expo — D-016..D-021)
type PlanType = 'tourism' | 'expo';
type PlanStatus = 'draft' | 'upcoming' | 'in_progress' | 'completed';   // derived except 'draft'
interface PlanStop { id: ID; order: number; ref: { kind: 'place'; placeId: ID } | { kind: 'booth'; boothId: ID };
  startTime?: string /* 'HH:mm' */; durationMin: number; objective?: LocalizedText;
  completedAt?: ISODateTime | null }
interface Plan { id: ID; ownerId: ID; name: string; type: PlanType; date?: ISODate;
  startTime?: string; isDraft: boolean; stops: PlanStop[]; startedAt?: ISODateTime | null;
  sourceProposalId?: ID; coverImage?: string; createdAt: ISODateTime; updatedAt: ISODateTime }
// derived (selectors): status, progress { completed, total }, currentStopId, totalDurationMin

// Conversations & assistant
interface Conversation { id: ID; characterId: AiCharacter['id']; title: string;
  context?: { kind: 'place'; placeId: ID } | { kind: 'booth'; boothId: ID } | { kind: 'planner' };
  createdAt: ISODateTime; updatedAt: ISODateTime }
type MessageBlock =
  | { type: 'text'; text: string }
  | { type: 'recommendations'; items: { ref: PlanStop['ref']; priority: Priority; reason: LocalizedText }[] }
  | { type: 'itinerary-proposal'; proposal: ItineraryProposal }
  | { type: 'notice'; kind: 'demo' | 'out_of_credits' | 'error'; text: LocalizedText };
interface ChatMessage { id: ID; conversationId: ID; role: 'user' | 'assistant'; blocks: MessageBlock[];
  status: 'sending' | 'streaming' | 'done' | 'error'; createdAt: ISODateTime }
interface ItineraryProposal { id: ID; title: LocalizedText; type: PlanType; date?: ISODate;
  startTime: string; rationale: LocalizedText;
  stops: (Omit<PlanStop, 'id' | 'completedAt'> & { priority: Priority; reason: LocalizedText; kept: boolean })[];
  savedPlanId?: ID }

// Notifications, credits, subscriptions, users
interface AppNotification { id: ID; kind: 'reminder' | 'plan_update' | 'recommendation' | 'announcement';
  title: LocalizedText; body: LocalizedText; link?: string; read: boolean; createdAt: ISODateTime }
interface NotificationPrefs { reminder: boolean; plan_update: boolean; recommendation: boolean; announcement: boolean }
interface CreditsBalance { balance: number; monthlyAllowance: number; renewsAt?: ISODate }
interface CreditTransaction { id: ID; delta: number; reason: 'chat_reply' | 'monthly_grant' | 'plan_change';
  conversationId?: ID; createdAt: ISODateTime }
interface SubscriptionPlan { id: 'free' | 'explorer' | 'pro'; name: LocalizedText;
  priceLabel: LocalizedText /* "demo" */; monthlyCredits: number; features: LocalizedText[] }
interface Subscription { planId: SubscriptionPlan['id']; status: 'active' | 'canceled'; renewsAt?: ISODate }
interface User { id: ID; name: string; email: string; locale: Locale; theme: 'light' | 'dark' | 'system';
  isGuest: boolean }
interface Session { user: User; token?: string /* http only */ }
```

## 3. Repository interfaces

```ts
interface AuthRepository { getSession(): Promise<Session | null>; login(i: { email: string; password: string }): Promise<Session>;
  signup(i: { name: string; email: string; password: string }): Promise<Session>; logout(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>; resetPassword(i: { token: string; password: string }): Promise<void> }
interface UserRepository { updateProfile(p: Partial<Pick<User, 'name' | 'locale' | 'theme'>>): Promise<User>;
  changePassword(i: { current: string; next: string }): Promise<void> }
interface PlaceRepository { search(q: PlaceQuery, signal?: AbortSignal): Promise<Page<Place>>;
  getById(id: ID): Promise<Place>; getMany(ids: ID[]): Promise<Place[]>; listCollections(): Promise<Collection[]>;
  listFeatured(): Promise<Place[]> }
interface ExpoRepository { getLayout(): Promise<{ zones: ExpoZone[]; facilities: ExpoFacility[] }>;
  searchBooths(q: { q?: string; category?: ExpoBooth['category']; zoneId?: ID }): Promise<ExpoBooth[]>;
  getBooth(id: ID): Promise<ExpoBooth>; getBooths(ids: ID[]): Promise<ExpoBooth[]> }
interface PlanRepository { list(q: { tab?: 'all' | 'upcoming' | 'in_progress' | 'completed' | 'drafts'; q?: string;
  page?: number }): Promise<Page<Plan>>; listFeatured(): Promise<Plan[]>; get(id: ID): Promise<Plan>;
  create(i: Omit<Plan, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>): Promise<Plan>;
  createFromProposal(proposalId: ID): Promise<Plan>;          // idempotent → same plan on repeat (D-021)
  update(id: ID, patch: Partial<Plan>): Promise<Plan>; remove(id: ID): Promise<void>;
  addStop(id: ID, stop: Omit<PlanStop, 'id' | 'order'>): Promise<Plan>; removeStop(id: ID, stopId: ID): Promise<Plan>;
  reorderStops(id: ID, orderedStopIds: ID[]): Promise<Plan>;
  setStopCompleted(id: ID, stopId: ID, completed: boolean): Promise<Plan>;
  start(id: ID): Promise<Plan>; copyFeatured(featuredId: ID): Promise<Plan> }
interface ConversationRepository { list(q: { characterId?: AiCharacter['id']; q?: string }): Promise<Conversation[]>;
  get(id: ID): Promise<{ conversation: Conversation; messages: ChatMessage[] }>;
  create(i: { characterId: AiCharacter['id']; context?: Conversation['context'] }): Promise<Conversation>;
  rename(id: ID, title: string): Promise<Conversation>; remove(id: ID): Promise<void>;
  updateProposal(conversationId: ID, proposal: ItineraryProposal): Promise<void> }
interface AssistantGateway { reply(i: { conversationId: ID; characterId: AiCharacter['id']; text: string;
  locale: Locale; context?: Conversation['context'] }, signal?: AbortSignal): AsyncIterable<AssistantEvent> }
type AssistantEvent = { type: 'block-start'; block: MessageBlock } | { type: 'text-delta'; delta: string }
  | { type: 'done'; message: ChatMessage } | { type: 'error'; error: ApiError };
interface NotificationRepository { list(): Promise<AppNotification[]>; markRead(id: ID): Promise<void>;
  markAllRead(): Promise<void>; getPrefs(): Promise<NotificationPrefs>; setPrefs(p: NotificationPrefs): Promise<NotificationPrefs> }
interface CreditsRepository { getBalance(): Promise<CreditsBalance>; history(page?: number): Promise<Page<CreditTransaction>> }
interface SubscriptionRepository { listPlans(): Promise<SubscriptionPlan[]>; getCurrent(): Promise<Subscription>;
  simulateChange(planId: SubscriptionPlan['id']): Promise<Subscription> }   // demo only, no payment
```

## 3b. Subscription and credits (P-012, supersedes the subscription types in §2–3)

Implemented in `src/entities/subscription/`: model `types.ts`, config `plans.ts`, rules `rules.ts`, contracts `api/subscription.repository.ts`, demo `api/subscription.mock.ts`.

```ts
type PlanId = 'free' | 'plus' | 'premium';            // Explorer · Traveler · Ultimate Explorer
type BillingInterval = 'monthly' | 'annual';
type SubscriptionStatus = 'guest' | 'active' | 'cancel_scheduled' | 'expired';
interface Entitlements { monthlyCredits: number; proposalsPerMonth: number | null; savedPlans: number | null;
  customization: 'basic' | 'extended' | 'advanced'; personalization: boolean; enhancedRecommendations: boolean;
  priorityResponses: 'not_included' | 'future' }
type PlanPrice = { amount: number; currency: string } | null;     // null = not set ("to be confirmed")
interface SubscriptionPlan { id: PlanId; order: number; recommended?: boolean; entitlements: Entitlements;
  prices: Record<BillingInterval, PlanPrice> }
interface UserSubscription { planId: PlanId; status: Exclude<SubscriptionStatus, 'guest'>; interval: BillingInterval;
  startedAt: ISODate; renewsAt: ISODate | null; endsAt: ISODate | null; simulated: true }
type UsageAction = 'ai_reply' | 'voice_reply' | 'itinerary_proposal' | 'save_plan' | 'browse' | 'read_aloud';
interface CreditsBalance { remaining: number; allowance: number; periodEndsAt: ISODate | null }
interface CreditTransaction { id: ID; kind: UsageAction | 'period_grant' | 'plan_change'; delta: number;
  balanceAfter: number; at: ISODateTime }

interface SubscriptionRepository { listPlans(): Promise<SubscriptionPlan[]>; getCurrent(): Promise<UserSubscription | null>;
  changePlan(i: { planId: PlanId; interval: BillingInterval }): Promise<UserSubscription>;
  cancel(): Promise<UserSubscription>;   // schedules cancellation at period end
  resume(): Promise<UserSubscription> }
interface CreditsRepository { getBalance(): Promise<CreditsBalance>; history(): Promise<CreditTransaction[]>;
  consume(action: UsageAction): Promise<CreditsBalance> }   // rejects OUT_OF_CREDITS
```

- **Rules:** `entitlementsFor`, `checkUsage`/`applyUsage`, `creditLevel`, `planChangeKind`, `canSavePlan`, `suggestedUpgrade`, `rebalanceForPlan`. These are pure functions, shared by the UI and the mock. **The backend must enforce the same rules server-side.**
- **Payments:** none. Checkout will be a payment provider's hosted flow after approval. The frontend never stores card data.
- **Proposed endpoints:** `GET /subscription/plans`, `GET /subscription`, `POST /subscription/change` `{planId, interval}`, `POST /subscription/cancel`, `POST /subscription/resume`, `GET /credits`, `GET /credits/history`. Credits are debited server-side as a side effect of `POST /conversations/:id/messages`, not by the client.

## 3c. Proposal editing (P-013)

- **Model:** `entities/plan/model/proposal.ts`, with `ProposalStop { id, kind, durationMin, priority?, position }`.
- **Functions:** `scheduleProposal` (times = start + durations + an estimated buffer), `summarizeProposal`, `moveProposalStop`, `removeProposalStop`, `canMove`, `isMovable`.
- **Saving:** stays `PlanRepository.createFromProposal(proposalId)` (idempotent, D-021). The demo stand-in is `features/save-proposal-to-plans`.

## 3d. Phase 4 implementation (data foundation, 2026-10-11)

Every domain now follows the same pattern:

```
entities/<x>/model/<x>.ts         Zod schemas (runtime contract) + inferred types + pure selectors
entities/<x>/api/<x>.repository.ts interface
entities/<x>/api/<x>.mock.ts       demo implementation (latency, ?demoError, persistent store)
entities/<x>/api/<x>.http.ts       HTTP implementation against §4 (validated responses; not connected)
entities/<x>/api/repository.ts     picks mock | http from NEXT_PUBLIC_DATA_SOURCE
entities/<x>/api/queries.ts        TanStack Query hooks + query keys (mutations live in features)
entities/<x>/api/demo/*.ts         demo data (never imported by UI)
```

- **Shared (`shared/api`):**
  - `request()` is a typed fetch: base URL from env, bearer-token hook, AbortSignal, Zod-validated responses.
  - `ApiError` and `toApiError` normalize errors and add the `ABORTED` code.
  - Demo helpers: `demoCall` (150–600 ms latency, plus `?demoError=<domain|all>` to inject failures), `createDemoStore` (localStorage `morshid:v1:<key>`, validated on load, falls back to the seed), and `resetAllDemoStores`.
- **Domains:**
  - `place`, `expo`, `plan`, `conversation` and `notification` each have a full repository.
  - `subscription` now persists through `createDemoStore`, and its errors are `ApiError` (`UNAUTHORIZED` / `OUT_OF_CREDITS`).
- **Refinements to §2–3** (frontend-side; to be agreed with the backend):
  - `PlanRepository.createFromProposal(proposal: ProposalToSave)` takes the kept stops and the name. It is still idempotent per `proposalId` (D-021); the HTTP call is `POST /plans/from-proposal/:id`.
  - `PlanRepository.copyFeatured(featuredId, locale)` returns a localized draft. Featured plans are a separate `FeaturedPlan` type with localized names (`GET /plans/featured`, `POST /plans/featured/:id/copy`).
  - `Conversation` gains `locale` (the language the chat was held in) and a required `title`.
  - `ConversationRepository.appendMessage` exists for the demo assistant (Phase 7). In production, messages come from `POST /conversations/:id/messages`.
  - `ItineraryProposal` gains `bufferMin` (the estimated buffer) and per-stop `order`.
  - Expo facilities gain a `name`.
  - **Plan start / end points (2026-10-12):** `Plan.start?` and `Plan.end?` are a `PlanEndpoint`: `{kind:'place', placeId}`, `{kind:'booth', boothId}`, or `{kind:'point', name, location, locationSource}` (verified coordinates only, D-023). They are not numbered stops and never "completed". The route line runs start → stops → end.
  - **Expo site plan (2026-10-12):**
    - `ExpoZone` gains `number`, `summary` and `labelAt`.
    - Booths and facilities carry a visible `number` (`"<zone>.<index>"`), and facilities gain a `zoneId`.
    - `ExpoLayout` gains `site` (boundary polygon) and `paths` (walkways).
    - New categories: booth `events`, facility `transport`.
    - Selectors: `expoLocations` (booths and facilities in one list, ordered by number), `compareLocationNumbers`, `pointInPolygon`.
  - Expo positions are local site-plan coordinates (`EXPO_SITE` 1000×700), not GPS.
- **Tests (written; the user runs them, D-039):**
  - `shared/api/demo.test.ts`.
  - `entities/*/api/*.contract.test.ts`, covering schema validation of the demo data, selectors and repository behavior.
  - `app/demo-data-integrity.test.ts`, which checks cross-domain references.

## 3e. Phase 7 implementation (Chat)

- **`AssistantGateway`** (`features/send-chat-message/api/assistant.ts`) streams `block-start`, `text-delta` and `done` events. The demo `mockAssistant`:
  - matches the intent (AR/EN keywords, S1–S9 plus fallback);
  - debits 1 demo credit per reply (`ai_reply` or `itinerary_proposal`), or answers with an `out_of_credits` notice block;
  - streams the text word by word, then the structured blocks;
  - persists the reply with `ConversationRepository.appendMessage`.
  - In production, `POST /conversations/:id/messages` does all of this server-side (SSE).
- **Saving a proposal:** `PlanRepository.createFromProposal` (idempotent per `proposalId`), then `ConversationRepository.updateProposal` stores `savedPlanId` plus the kept and reordered stops (`kept: false` for removed ones).
- **Context:** a conversation started from place details carries `context: {kind:'place', placeId}`, and questions are then answered as follow-ups about that place.

## 3f. Phases 8–11 implementation

- **`Plan`:**
  - gains `endCompletedAt` (the end point is completed like a stop; repository `setStopCompleted(id, 'end', …)`);
  - `PlanPatch` gains `type`, `start`, `end` and `stops` (a full ordered replacement that keeps existing ids and completion);
  - the repository rejects stops that don't match the plan type (`VALIDATION`).
  - **Selectors:** `stopsMatchType`, `scheduleStops`, `END_STOP_ID`; `planProgress` counts the end point.
- **`UserProfile`** gains `email`. `userRepository.updateProfile`, `changePassword` (mock) and `setUser`, persisted as `morshid:v1:user`.
- **Auth (mock, `features/auth`):** `login`, `signup`, `logout`, `requestPasswordReset`, `resetPassword`. Any valid email with 8+ characters works; signing in turns the guest into the free plan, and signing out returns to guest. Not production security; the backend must own sessions.
- **Sign-in gate:** `shared/lib/auth-gate` provides `requestSignIn()`. Gated saves (Add to plan, chat proposals, the plan editor) open the sign-in sheet and continue on success.
- **Expo booth context:** conversations with `context: {kind:'booth'}` get a pavilion overview from the demo assistant.

## 4. Proposed REST mapping (not final; to be agreed with the backend)

| Repository method | Proposed endpoint |
|---|---|
| Auth | `POST /auth/login`, `/auth/signup`, `/auth/logout`, `/auth/password/forgot`, `/auth/password/reset`, `GET /auth/session` |
| Places | `GET /places?q&category&region&bounds=w,s,e,n&sort&page`, `GET /places/:id`, `GET /collections` |
| Expo | `GET /expo/layout`, `GET /expo/booths?q&category&zone`, `GET /expo/booths/:id` |
| Plans | `GET /plans?tab&q&page`, `POST /plans`, `POST /plans/from-proposal/:proposalId` (idempotent), `GET/PATCH/DELETE /plans/:id`, `POST /plans/:id/stops`, `DELETE /plans/:id/stops/:stopId`, `PUT /plans/:id/stops/order`, `PUT /plans/:id/stops/:stopId/completion`, `POST /plans/:id/start` |
| Conversations | `GET /conversations?character&q`, `POST /conversations`, `GET/PATCH/DELETE /conversations/:id`, `PUT /conversations/:id/proposals/:proposalId` |
| Assistant | `POST /conversations/:id/messages` → **SSE stream** of `AssistantEvent` |
| Notifications | `GET /notifications`, `POST /notifications/:id/read`, `POST /notifications/read-all`, `GET/PUT /notifications/prefs` |
| Credits and subscription | `GET /credits`, `GET /credits/history`, `GET /subscription/plans`, `GET /subscription` |

**Open backend questions** (to discuss later):
- Auth mechanism: cookie or bearer token.
- Whether the AI backend returns structured blocks natively or the frontend adapts them.
- Pagination style.
- Where the source of truth lives for places and booths.
- Rate limits and how credits are debited.
