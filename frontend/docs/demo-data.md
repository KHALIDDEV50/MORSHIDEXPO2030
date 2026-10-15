# MORSHID — Demo Data Plan (v1)

> Status: **Proposed (part of Gate B)**. Demo data lives in `entities/<x>/api/demo/*.ts`, is typed against `api-contracts.md`, uses stable prefixed IDs, and is **never imported by UI components**.

## 1. Principles

- **Real places use verified data only.** Each place's coordinates are taken from OpenStreetMap or Wikidata during implementation, and the source is recorded in `locationSource`. A place whose coordinates can't be verified is **left out**, not estimated (D-023).
- **Anything not verifiable is labeled demo:** opening hours (`provenance: 'demo'`, shown as "verify before visiting"), priorities, suggested durations, and all Expo data.
- **Everything is written in both languages:** Arabic is first-class, and every text field is `LocalizedText`.
- **No fake ratings, reviews, or user distances.**
- **No real company names** on Expo booths. Booths are fictional and labeled demo.
- **Images:** labeled placeholders until assets are supplied or Wikimedia Commons sourcing is approved (PRD §9 item 11). Nothing is hotlinked.
- Demo users are fictional, with no real people.

## 2. Datasets and planned volumes

| Dataset | Count | Notes |
|---|---|---|
| Places, Riyadh | about 18 | Masmak Fortress; At-Turaif (Diriyah); Al-Bujairi Terrace; National Museum; Murabba Palace; King Abdulaziz Historical Center; Kingdom Centre Sky Bridge; KAFD; Al Faisaliah Tower; Wadi Hanifah; Edge of the World (Jebel Fihrayn); King Abdullah Park; Salam Park; Souq Al-Zal; Riyadh Boulevard City; Diriyah Gate cafés area; Riyadh Zoo; King Fahd Cultural Center. The final list depends on verified coordinates. |
| Places, Saudi highlights | about 4 | Hegra (AlUla), Historic Jeddah (Al-Balad), Abha / Al-Soudah, Al-Ahsa Oasis. Used by the "Beyond Riyadh" collection and scenario. |
| Collections | 3 | Heritage of Riyadh · Modern Riyadh · Beyond Riyadh |
| Categories | 8 | heritage, museums, nature, food, shopping, entertainment, family, culture (configurable in `shared/config`) |
| Expo zones | 5 | Illustrative, labelled demo (P-023): four thematic districts — الأرض Earth (1), التعاون Collaboration (2), التقنيات Technology (3), الإنسانيات Humanity (4) — plus the Central Plaza & Gate hub (5). These are MORSHID's organisation of the demo, not official Expo 2030 Riyadh zones. |
| Expo booths | about 24 | Fictional (e.g. "Digital Innovation Pavilion" / "جناح الابتكار الرقمي", "AI Experience Hall"), 4 or more per category. Includes activities with demo times. |
| Expo facilities | about 12 | Entrances, restrooms, prayer rooms, info, food, first aid |
| AI characters | 2 | Arif and Roaya config, with 4 suggested prompts each |
| Demo users | 2 | `usr_demo` (signed-in, Explorer plan) and the guest profile |
| Plans | 6 | 1 per status (draft, upcoming, in-progress with 2 of 5 done, completed) plus 2 Expo plans |
| Featured plans | 3 | "Riyadh heritage day", "Modern Riyadh evening", "Expo half-day: AI & Tech" (copyable) |
| Conversations | 6 | 3 per character, spread across Today, Last 7 days, and Older; includes 1 saved proposal and 1 unsaved proposal |
| Notifications | 8 | A mix of all 4 kinds; 3 unread |
| Credits | balance 120 / allowance 200 | About 15 transactions |
| Subscription plans | 3 | **Superseded by P-012:** Explorer (free, 30 credits/month) / Traveler (300) / Ultimate Explorer (1000); guest has 10. Prices are `null` ("to be confirmed"). Config: `entities/subscription/config/plans.ts`. |
| Demo subscription profiles | 5 | `guest`, `free`, `free_low` (4 of 30 left), `plus`, `premium` (annual). In memory (`subscription.mock.ts`); the fixed demo "today" is 2026-10-11 and renewal is 2026-11-11. Credit history is generated from the same usage rules. |
| Discover gallery destinations | 12 | Turaif, Edge of the World, Hegra (featured); Masmak, National Museum, Al-Bujairi, Wadi Hanifah, Kingdom Centre Sky Bridge, King Abdullah Park, Souq Al-Zal, Historic Jeddah, Al-Soudah. Gallery copy only (`designSystem.discoverGrid.places`). No coordinates yet (D-023 verification still applies); placeholder images; opening hours labelled demo. |
| Proposal demo | 7 stops | "Old Riyadh in one day": start → Masmak → Murabba → lunch → National Museum → Souq Al-Zal → Al-Bujairi. Times are computed (08:30 start + durations + a 15-min estimated buffer). |

### 2b. As built in Phase 4 (2026-10-11)

| Dataset | Built | Notes |
|---|---|---|
| Places | 13 (9 Riyadh region and 4 Saudi) | Every coordinate was looked up in OpenStreetMap (Nominatim) on 2026-10-11, with the `osm:<type>/<id>` source stored per place. **Left out:** Wadi Hanifah (a ~120 km valley with no single point) and the other planned Riyadh places, which can be added once verified. |
| Collections | 3 | As planned |
| Expo | 8 numbered zones, 22 booths, 9 facilities = 31 numbered locations (revised 2026-10-12) | The zones are: 1 Arrival & Main Entrance, 2 Culture & Heritage, 3 Innovation & Technology, 4 Future Mobility, 5 Sustainability, 6 Food & Hospitality, 7 Events & Gathering (central plaza), 8 Visitor Services. Locations are numbered `zone.index`. All of it is fictional and `provenance: 'demo'`; the single "Nations Pavilion (illustrative)" names no country. Local site-plan coordinates, with a site boundary and walkways. Booth ids referenced by plans and conversations are unchanged. |
| Plans | 6 + 3 featured | Draft, upcoming, in progress (2 of 5 done; saved from the demo proposal), completed, plus 2 Expo plans (1 upcoming, 1 draft). Dates are relative to today. "Old Riyadh in one day" starts at **Qasr Al-Hukm Metro Station** (OSM way/1385940134, Nominatim 2026-10-12) and ends at **Al-Bujairi Terrace**. Stored under `morshid:v1:plans-v2` (bumped when start/end were added; the old `plans` key is removed). |
| Conversations | 6 | 3 per character, in Arabic or English, spread across today / last 7 days / older. Includes 1 saved and 1 unsaved proposal. Generated replies carry a demo notice. |
| Notifications | 8 | All 4 kinds, 3 unread. Announcements are muted in the seed preferences. |
| Subscription | as in §2 | Now persisted (`morshid:v1:subscription`). |

Persisted keys are `morshid:v1:plans`, `conversations`, `notifications` and `subscription`. Places and Expo are read-only catalogs. **Reset demo data** is in Settings → Developer tools (dev builds or `NEXT_PUBLIC_ENABLE_DEV_PAGES=true`, demo mode only).

## 3. Mock assistant scenarios (AR + EN triggers)

| # | Scenario | Output blocks |
|---|---|---|
| S1 | Most important historical sites (Riyadh / Saudi) | text + recommendations (heritage) |
| S2 | Modern Riyadh / architecture | text + recommendations |
| S3 | Family day | text + recommendations (familyFriendly) |
| S4 | Food & cafés | text + recommendations |
| S5 | Beyond Riyadh highlights | text + recommendations (Saudi) |
| S6 | AI and tech booths at Expo | text + recommendations (booths) |
| S7 | Half-day Expo AI and tech itinerary | text + itinerary-proposal (expo) |
| S8 | One-day Riyadh heritage itinerary | text + itinerary-proposal (tourism) |
| S9 | Place follow-ups (history, focus, nearby, add to plan) | text (+ recommendations from **real bounds-based** nearby places) |
| — | Fallback | Honest notice listing the supported topics + suggested prompts |

Itinerary times are computed from `startTime + Σ(duration) + a fixed buffer` (15 min tourism, 5 min Expo). Buffers are labeled "estimated"; there are no travel-time claims.

**As built (Phase 7):**
- The matcher is `features/send-chat-message/model/intent.ts` and the copy is `api/demo/scenarios.ts`, both bilingual.
- **Character voice:** Arif and Roaya have different opening lines; the content is shared.
- **S9:** history comes from `Place.history`, "what to look for" from `tips`, and "nearby" lists the guide places within 4 km by their verified coordinates.
- **Every reply** ends with a "Demo replies — not a real AI" notice.
- **Error injection:** `?demoError=assistant` makes the reply fail, to review Retry.

## 4. Persistence and reset

- **Seed:** read-only catalog plus initial user data.
- **User changes** go to `localStorage` under `morshid:v1:<domain>`. They are validated with Zod on load and fall back to the seed if invalid.
- A dev-only "Reset demo data" action lives in Settings.
- The schema version is bumped whenever the demo data shape changes.

## 5. Enabling and replacing demo mode

- `NEXT_PUBLIC_DATA_SOURCE=mock` is the default.
- Real API: implement `entities/<x>/api/<x>.http.ts` for each domain against agreed endpoints, then set `NEXT_PUBLIC_DATA_SOURCE=http` and `NEXT_PUBLIC_API_BASE_URL`.
- Shared contract tests (`<x>.repository.contract.test.ts`) run against both implementations.
