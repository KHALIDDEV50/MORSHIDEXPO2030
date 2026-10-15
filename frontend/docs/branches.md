# Branches

Created locally on 2026-10-12. **Nothing has been pushed.** The GitHub repository (`ouada01/morshid`) was empty when inspected; pushing waits for the owner's go-ahead.

| Branch | Purpose | Base |
|---|---|---|
| `development` | Ongoing development: the full project history, demo data by default, dev tools available. | The first commit: Phases 1–12, landing page, UI/UX rounds. |
| `main` | The user-facing interactive demo for real users. It looks the same as `development` at the Phase 12 snapshot. | The Phase 12 snapshot commit on `development`. |
| `api-ready` | The backend integration foundation. Same UI, routes and landing page; the data layer defaults to HTTP, with explicit unconfigured / empty / error states and HTTP implementations for every domain. | The Phase 12 snapshot, plus API-readiness commits. |

## How they differ
- **Data:**
  - `main` and `development` use `NEXT_PUBLIC_DATA_SOURCE=mock` by default (deterministic local demo data, persisted in localStorage).
  - `api-ready` uses `http` by default. Its demo fixtures are only used with an explicit `NEXT_PUBLIC_DATA_SOURCE=mock`.
- **UI:** identical across branches (one codebase, no per-branch copies).
- **Docs:** `docs/backend-integration.md` lists the proposed contracts on every branch. On `api-ready` it is the working checklist.

## Not committed (kept on disk, listed in .gitignore)
| Path | Why |
|---|---|
| `answer is.txt`, `expoproblem.txt` | The owner's instruction inbox, not product files. |
| `.claude/` | Local tool state. |
| `Read images of design/` | Design reference screenshots (11 MB). Add them if the team wants them in the repo. |
| `fonts/` | Expo Arabic font files. The app doesn't use them (it uses Cairo/Tajawal) and their redistribution license isn't confirmed. |

## Pushing (owner)
```
git remote add origin https://github.com/ouada01/morshid.git
git push -u origin main development api-ready
```
Use your own credentials (credential manager or SSH key). Never put tokens in URLs or files.
