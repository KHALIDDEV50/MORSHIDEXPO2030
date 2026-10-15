# MORSHID — public website

**Status: implemented 2026-10-12 at the user's request (P-020), redesigned the same day with a warm Saudi identity (P-021) and MORSHID brand colours plus light/dark themes (P-022). Not approved; unverified (D-039).**

This guide covers the public, marketing-facing website. It sits next to the product and does not replace it: the platform routes (`/chat`, `/discover`, `/expo`, `/plans`, …) keep their own `AppShell`.

## 0. Visual system (P-021 → P-022)

**One product, one theme system.**
- **Same app:** the public pages live in the same Next.js app, routing, localization, tokens and components as the platform. They have their own layout (`PublicShell`), separate from the product's `AppShell`.
- **One preference:** themes use the app's single `next-themes` provider and one saved choice (`localStorage` key `theme`).
- **Default (P-022):** light until the visitor chooses. "System" stays available.
- **No flash:** next-themes applies the saved choice before the page paints.
- **Controls:** a sun/moon `ThemeToggle` in the public header, and Light / Dark / System in the phone menu and footer. They change the real application theme, which carries over to the platform.

**Why light mode looked inconsistent earlier (fixed in P-021):**
- Sections forced the dark palette with `.dark` subtrees.
- Three cool backgrounds disagreed (body `#f5f7fc` with a glow, white shell, `#eef2f8` "muted" sections).
- Each section added its own gradient.

**Tokens.** `.site-public` (on the shell and on `<html>` while a public page is open, via `SitePalette`) re-declares the semantic tokens for both themes. It never forces a theme. Light:

| Token | Value |
|---|---|
| page (ivory) | `#FAF8F3` |
| surface | `#FFFFFF` |
| secondary surface (sand) | `#F1E9DC` |
| text | `#252820` |
| secondary text | `#5F6057` |
| muted text | `#66675E` |

Two greys are slightly darker than the brief so they pass 4.5:1 on sand.

Dark is a warm charcoal stack, designed rather than inverted:

| Token | Value |
|---|---|
| page | `#161512` |
| surface | `#1F1D19` |
| elevated | `#28251F` |
| secondary (sand) | `#24211C` |
| text (off-white) | `#F3EEE6` |
| secondary text | `#C4BCAE` |
| muted text | `#A39A8B` |

Dark mode also gets its own warm hairlines, input borders, shadows and status colours.

**Brand colours (P-022, replacing the temporary green):**
- **Accents:** MORSHID blue and pink. Light uses accessible shades for text: primary `#10619F`, pink `#A8189A`. Dark uses `#6CC0FB` and `#F58AE8`.
- **Gradient, used sparingly:** on primary buttons (the product's accessible CTA gradient in light; the exact brand gradient in dark), on one accent line per hero headline (`text-accent-gradient`), and on small brand details.
- **Terracotta (`--clay`):** used only in decorative cultural motifs, never as an interface colour.

**Backgrounds.**
- **Two grounds per theme:** `base` (page) and `sand` (secondary, used with a purpose), with no section gradients.
- **Media overlays only:** photos needing a scrim keep it inside the frame, using a constant `--ink`.
- **Rhythm tokens:** `--section-y` and `--measure`.

**Saudi identity, used sparingly:** Najdi parapet photo frames, wall-vent eyebrow marks, a thin Sadu band (its colours follow the theme), Arabic coffee and hospitality, photography moving from heritage to the future, and Arabic copy in a warm Saudi voice.

## 1. Why the public content was limited before

Before this round, `/[locale]` was a single landing page (P-017) whose header only linked to anchors on that page. Every other public-facing path led straight into the product. There were no separate pages for features, destinations, guides, the journal, the app, privacy or terms, and the login page offered guest access only as a small link.

## 2. Pages and routes

All public pages sit in the `src/app/[locale]/(public)/` route group, which has its own layout (`PublicShell`) and a `template.tsx` that fades each page in. Each page has localized metadata through `site.meta.*` and `publicMetadata()`.

| Route | View | Contents |
|---|---|---|
| `/[locale]` | `views/landing-page` | Cinematic three-scene hero, the platform shown in three phone mockups, the two guides, Riyadh / Saudi Arabia / Expo 2030 tracks, an animated idea-to-plan demo, a capability index with statuses, a mobile-app teaser, the visitor journey, journal picks and a final call to action. |
| `/features` | `views/features-page` | Eight chapters with a sticky scroll-spy nav. Interactive parts: sample chat, filterable photo mosaic, illustrative Expo map, itinerary demo, plan tools, real map with place preview, bilingual card, and the before/during/after journey. Each chapter carries a status. |
| `/destinations` | `views/destinations-page` | Collections: Riyadh, Saudi Arabia, Culture & heritage, Nature & adventure, Architecture & landmarks (a curated list), and Expo 2030 Riyadh. Also a real "browse by location" map with region filter. Every collection links into the matching Discover filter. |
| `/how-it-works` | `views/how-it-works-page` | Five-step scroll story: a pinned visual on large screens, inline visuals on phones. Ends with an FAQ (`<details>`). |
| `/guides` | `views/guides-page` | Arif and Roaya chapters, each with its own colour, setting, parallax portrait, "good at" list, sample questions that open the chat with that guide, and a voice status. Ends with a "who to ask" table. |
| `/blog`, `/blog/[slug]` | `views/journal-page` | Featured story, category filters (`?category=`), and article pages. Articles have an outline, structured blocks, place links into Discover, sources and related stories. Article pages are statically generated (`generateStaticParams`); unknown slugs return 404. |
| `/mobile-app` | `views/mobile-app-page` | "Coming soon": an interactive three-screen phone, store availability shown as plain status text, "designed for the moment" phones, planned ideas, and an explanation in place of an interest form. |
| `/privacy`, `/terms` | `views/legal-page` | Legal document layout: draft banner, table of contents, numbered sections, and a visible "needs legal review" or "needs technical confirmation" flag per section. |
| `/login` | `views/auth-page` (updated) | Gateway: "Try the demo" and "Continue as a guest" (no credentials) are clearly separate from the demo sign-in form. |

## 3. Shared pieces

**`widgets/public-site`:**
- `PublicShell`, `SiteHeader`, `SiteFooter`.
- `PageHero`, `Section` (tones `page` / `muted` / `night`), `SectionHeading`, `Eyebrow`, `HeadlineLines`, `ArrowLink`, `CtaBand`.
- `StatusTag` / `StatusLegend`, with statuses: live, simulated, planned.
- `MediaImage` / `MediaCredit`, which show the credit and an "illustrative" chip where needed.
- `PhoneFrame` with `ChatScreenMock`, `DiscoverScreenMock` and `PlanScreenMock`.
- `ItineraryDemo`, `ChapterNav`, and `GuideChatLink`, which sets the active character before opening `/chat`.

**Elsewhere:**
- **`shared/content/site-media.ts`:** the site media library. It reuses the licensed catalogue photos with identical credits, which a unit test enforces.
- **`entities/article`:** the article schema, the repository interface, and a local repository with the sample content.
- **`features/auth`:** `DemoEntry`, plus `authRepository.startDemo()` and `continueAsGuest()`.
- **`shared/lib/use-motion.ts`:** `useMotionAllowed`, `useInView`, `useParallax` and `useScrolledPast`.

**Header and theme:** the public header floats over the always-dark page heroes, using the `dark` class on the subtree, and turns into a glass bar on scroll. Below `xl`, its links move into a full-height sheet. It is a new component; the product's rail and mobile navigation are untouched.

## 4. Motion

All motion is CSS-first, with no new dependency (`globals.css`, "Public website motion"):
- `motion-rise`: staggered by `--delay`.
- `motion-settle`: a slow zoom-out on hero photos.
- `motion-drift`: a gentle float for characters and cards.
- `motion-progress`: the hero scene timer.
- `motion-ping`: the "coming soon" dot.
- `hover-lift` and the `.nudge` arrow.
- `[data-parallax]`: driven by `useParallax`; used sparingly in three places.
- `Reveal` variants: `rise`, `clip` (image unveil), `scale` and `fade`.

**Reduced motion:** everything runs only under `prefers-reduced-motion: no-preference`. Under reduce:
- the hero does not auto-advance and its pause control is hidden;
- the itinerary demo shows the finished plan;
- all content is visible in its final state.

**Accessibility:**
- The hero's auto-advance can be paused, and it stops once a scene is chosen (WCAG 2.2.2).
- The scroll-spy and scroll-story only highlight content; every step is complete without JavaScript.

## 5. Content model

**UI copy:** lives in `messages/{en,ar}.json` under `site.*`, plus `auth.gateway.*`. The Arabic is written for Arabic readers, not translated line by line.

**Journal articles:** `entities/article/api/content/articles.ts`, as bilingual structured blocks (`p`, `h2`, `list`, `tip`, `places`). Fields:
- `status: 'sample'`
- `publishedAt: null`, with no invented bylines or dates
- `sources[]` for specific facts (UNESCO inscription years; Expo 2030 dates and theme via the BIE)
- `relatedPlaceIds`, checked by a test

A CMS can implement `ArticleRepository` (`list`, `get`) without touching the pages.

**Legal drafts:** `views/legal-page/model/legal-content.ts`, with per-section `review` flags.

## 6. Honesty rules applied

- **Statuses:** every capability is labelled "Works in the demo", "Simulated" or "Planned".
- **No invented social proof:** no testimonials, usage statistics, partnerships, endorsements, prices, ratings, opening hours or Expo venue details.
- **Expo imagery:** concept renderings of the future Expo 2030 Riyadh site (labelled "Concept rendering — not a photograph") or theme photos, always captioned as illustrative. No photos of previous World Expos (P-026).
- **Mobile app:** no store buttons and no release date. There is no interest form, because there is no server to store emails safely, and the page says so.
- **Login:** never implies a real account. "Try the demo" opens the sample profile and says so; guest mode needs no credentials.
- **Privacy and Terms:** state only what the code confirms (checked 2026-10-12) and mark everything else for legal or technical review. They make no compliance claim.

## 7. Open items

- **Legal review:** Privacy and Terms (operator identity, contact, legal basis and PDPL assessment, children, warranty and liability, governing law, ownership of the name and characters, processor status of the map and voice providers).
- **Language cookie:** confirm its lifetime (next-intl defaults).
- **Unverified checks:** typecheck, lint, unit, e2e and the QA sweep have not been run (D-039). The sweep now covers the public routes, and every internal link on every public page.
- **`api-ready` branch:** not updated. Its login page and public pages would need the same merge. `startDemo` / `continueAsGuest` exist only on the mock auth repository.
