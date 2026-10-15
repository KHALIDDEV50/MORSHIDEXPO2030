# MORSHID Frontend Integration Progress

## Implemented in the first integration step

- `GET /api/v1/places` supports `q`, repeated `category`, `region`, `maxDuration`, `family`, `indoor`, `bounds`, `sort`, `page`, `pageSize`, `featured`, and repeated `ids` query parameters.
- `GET /api/v1/places/{placeId}` supports stable frontend IDs such as `plc_masmak`, with numeric-backed IDs retained as a fallback.
- `GET /api/v1/collections` currently returns an empty array because curated collection persistence has not been implemented.
- Responses use the frontend `Place` and `Page<Place>` shape, including localized Arabic/English fields and labelled image placeholders.
- Four illustrative tourism records are seeded idempotently and marked `DEMO`; coordinates include the OSM/Nominatim source string from the frontend's demo fixture.
- CORS is configured for localhost development and Vercel preview/deployment origins.

## Known limitations to address next

- Place images, collections, related places, full tips/history, and all categories are not yet persisted by the backend; image placeholders are returned for now.
- The backend currently has no user authentication, so these public read endpoints are not protected. User-owned resources must not be integrated until authorization is implemented.
- Expo layout/booths and the unified frontend plan model are not yet implemented against the proposed frontend contracts.
- Build/test execution could not be completed in this environment because Maven Wrapper could not download Maven from Maven Central. Run `./mvnw test` locally once network access is available.

## Local frontend configuration

Set the frontend API base URL to `http://localhost:8080/api/v1` and data source to `http` only after the backend starts successfully.

## Implemented in the second integration step

- The tourism catalogue was expanded to align with the 19 frontend demo place IDs; existing records are updated/inserted idempotently and are not deleted.
- Stable frontend place IDs such as `plc_masmak` are preserved in API responses.
- Important note: demo descriptions, opening hours, and any non-verified details must not be presented as official facts.

## Implemented in the third integration step — Expo map and booths

- `GET /api/v1/expo/layout` returns the frontend-compatible `ExpoLayout` shape: zones, facilities, site boundary, paths, and overview concept images.
- `GET /api/v1/expo/booths` returns the frontend-compatible booth array and supports `q`, `category`, `zone`, and repeated `ids` filters.
- `GET /api/v1/expo/booths/{boothId}` returns a booth by stable ID such as `booth_green_energy`.
- The layout uses the same illustrative fixture data as the frontend: 5 zones (4 thematic districts plus the central hub), 22 booths, and 8 facilities.
- All Expo site-plan coordinates are local 0–1000 by 0–700 coordinates, not GPS. Zone boundaries, booths, events, and facilities are illustrative demo data and are not official Expo 2030 Riyadh information.
- The original `Pavilion` and `Event` entities, APIs, repositories, and seed data have been preserved. These new frontend-compatible read endpoints do not delete or replace them.
- Expo fixtures are stored in classpath JSON files so they are deterministic and can be versioned with the project. Image paths refer to frontend public assets and should be served by the frontend origin.

## Next recommended step

Implement the frontend-compatible `VisitPlan` contract and stop-management endpoints, while preserving the existing `/api/v1/visit-plans/...` endpoints. Before modifying persistence or data, inspect current `VisitPlan` and `VisitPlanItem` models and add compatible DTO/controller/service methods alongside the existing ones.

## Implemented in the fourth integration step — frontend connection

- The frontend runs in `hybrid` mode: places and Expo use this API; plans, chat, notifications, auth and subscriptions stay on frontend demo data until compatible, authenticated endpoints exist.
- `ExpoDataSeeder` seeds the Expo layout, zones, facilities and 22 booths from `demo/expo-layout.json` and `demo/expo-booths.json` on startup (idempotent, never overwrites). Before this, `GET /expo/layout` returned 404 on a fresh database.
- Booth payload validation accepts the frontend contract key `id` (previously required `boothId`, which made the bundled fixtures impossible to insert).
- Configurable via environment: `PORT` (default 8080), `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `MORSHID_CORS_ALLOWED_ORIGINS`.
- Verified end-to-end: 19 places, 5 zones, 22 booths returned and accepted by the frontend Zod schemas; unknown IDs return 404 with `{ "message": … }`.
