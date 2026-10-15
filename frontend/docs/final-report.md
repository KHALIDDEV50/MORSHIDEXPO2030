# MORSHID — Phase 12 final report (integration & final QA)

Date: 2026-10-12. Phase 12 is defined in `implementation-plan.md` §12: cross-module consistency, a full viewport × locale × theme sweep, an a11y pass (axe in Playwright), console-error and broken image/link checks, and this report.

**Verification status:** Claude does not run checks (D-039). The automated checks below are written and wired up, but **have not been run**. Run them with `npm run check` and `npm run test:e2e` (or `npm run test:qa` for the sweep only), then record the results here.

## 1. Done

### Cross-module consistency
| Area | Result |
|---|---|
| One plan model | Chat proposals (tourism + Expo), Discover "Add to plan", the Expo assistant, the plan editor and guided mode all write the same `Plan` through `planRepository` and refresh `planKeys.all`. |
| Saved-plan limit | Uses the real plan count (`usePlanCount`) instead of a hard-coded counter (P-018). |
| Places vs Expo | Separate models (`Place` with GPS coordinates; `ExpoBooth` with local site-plan coordinates). Chat's **Explore Map** is tourism-only; **Expo Map** uses the Expo site plan. A plan never mixes the two (validated in the repository). |
| Conversation context | `place`, `booth`, `planner` and `expo` contexts are all answered by one demo gateway. The chat popup (`ChatDock`) is shared by place pages, pavilion pages, the Expo page and itinerary steps. |
| URL state | Chat `?c=` + `?view=` (chat / map / expo; switches create history entries); Discover filters; plan view. Direct links work, including an unknown conversation with `view=expo`. |
| Persistence | Plans, conversations, notifications, subscription and profile in localStorage (`morshid:v1:*`, reset in Settings); language cookie; theme; active character. |

### QA automation (written; run by the user)
- **`tests/e2e/qa-sweep.spec.ts`:** 17 routes × 2 locales × 2 themes on 3 viewports (360, 768, 1280). It checks:
  - **no console errors**;
  - **no failed same-origin requests** (broken images or chunks);
  - **no horizontal overflow**;
  - **axe WCAG 2.1 AA with no serious or critical violations**.
- **Landing link check:** every internal link on `/ar` and `/en` must return < 400.
- **Feature specs:** updated or added for the landing route, chat modes and back/forward, the place popup, step cards and replace, the Expo assistant and booth popup, the Discover region filter, and photo credits.

### Landing (`/[locale]`)
- **Sections:** hero, real-data stats, Expo 2030 preview, Riyadh, beyond Riyadh, AI companion, two separate maps, trip planning, get started, footer.
- **Navigation and links:** a responsive header with an anchor menu (a sheet on phones), language and theme switchers, and every call to action pointing to a real route.
- **Motion:** scroll reveal that respects reduced motion.

### Public website (added after Phase 12, P-020)
Home, Features, Destinations, How it works, Guides, Travel Journal, Mobile app, and draft Privacy and Terms pages, plus the login gateway. See `docs/public-site.md`. The QA sweep and link check now include these routes, and `tests/e2e/public-site.spec.ts` covers navigation, the gateway, the journal and reduced motion. None of these checks has been run yet.

## 2. Not done / limitations
| Item | Why |
|---|---|
| Recorded results of the sweep (a11y, console, overflow, links) | Checks are run by the user (D-039). This report must be updated with the results. |
| Real AI, voice AI, accounts, notifications, payments | No backend. All are clearly labelled demo or simulated (assistant replies come from the guide data; voice uses the browser's own speech with demo replies). |
| Official Expo 2030 content | Not published. The site plan, pavilions and times are illustrative and labelled everywhere. Pavilion photos are theme photos, not the pavilions. |
| Photos for 4 places | No suitable free-licensed photo found (Souq Al-Zal, Al-Bujairi, King Abdullah Park, Al-Soudah); they keep labelled placeholders. |
| Saved destinations / favorites | Not a feature of the product (not in the PRD); deliberately not invented. |
| Mobile header logo → landing | Mobile navigation is frozen by a standing user constraint; only the desktop rail logo links to the landing page. |
| Privacy and Terms | Drafts. Sections flagged in the pages need legal review (operator, legal basis, children, liability, governing law, ownership) or technical confirmation (language cookie). |

## 3. Backend tasks (for the `api-ready` branch)
See `docs/backend-integration.md`: endpoints for places, Expo, plans, conversations + assistant streaming, notifications, subscription/credits, auth/profile; auth mode (cookie vs bearer); the error envelope; image hosting and licensing metadata; server-side enforcement of credits and plan limits.
