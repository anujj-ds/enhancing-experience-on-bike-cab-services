# RideEase — Project Implementation Tracker (Work Log)

This is the single, living work-log required by the CIA-III brief (ECD223-3, §8). It is the group's
work log and individual-contribution record — update it whenever a task is planned, started,
completed, blocked, or reopened. Do **not** reconstruct this at the end of the project.

**Rule:** the AI tool is never entered under "Completed By" — only the student who reviewed,
integrated, tested, and verified the implementation.

**Allowed status values:** `Pending` · `In Progress` · `Completed` · `Blocked` · `Reopened`

---

## Work Log

| Task ID | Task | Component | Assigned To | Status | Completed By | Date Completed | AI Assistance | Evidence |
|---|---|---|---|---|---|---|---|---|
| T001 | Set up Flask project skeleton (`app.py`, folder structure) | Backend | _Student A_ | Completed | _Student A_ | _DD Mon YYYY_ | Yes | Commit `______` |
| T002 | Build booking panel UI + Leaflet map init | Frontend | _Student B_ | Completed | _Student B_ | _DD Mon YYYY_ | Yes | Commit `______` |
| T003 | Integrate OSRM routing (pickup → drop, GeoJSON route) | Frontend | _Student B_ | Completed | _Student B_ | _DD Mon YYYY_ | Yes | Commit `______` |
| T004 | Implement `/api/estimate-fare` endpoint | Backend | _Student A_ | Completed | _Student A_ | _DD Mon YYYY_ | Yes | Commit `______` |
| T005 | Integrate Google Gemini translation API (`/api/translate`) | Backend | _Student C_ | Completed | _Student C_ | _DD Mon YYYY_ | Yes | Commit `______` |
| T006 | Build chat modal UI + translation display | Frontend | _Student C_ | Completed | _Student C_ | _DD Mon YYYY_ | Yes | Commit `______` |
| T007 | Simulate vehicle marker + route-deviation alert | Frontend | _Student B_ | Completed | _Student B_ | _DD Mon YYYY_ | Yes | Commit `______` |
| T008 | Build SOS modal placeholder + `/api/sos` stub | Frontend/Backend | _Student D_ | Completed | _Student D_ | _DD Mon YYYY_ | Yes | Commit `______` |
| T009 | Design database schema (6 entities, ER diagram) | Data Layer | _Student A_ | Pending | — | — | Yes | — |
| T010 | Implement database models (SQLite/Flask-SQLAlchemy) | Data Layer | _Student A_ | Pending | — | — | Yes | — |
| T011 | Implement CRUD for ride records | Backend | _Student A_ | Pending | — | — | Yes | — |
| T012 | Implement driver-matching / surge-pricing algorithm | Backend/Algorithm | _Student D_ | Pending | — | — | Yes | — |
| T013 | Build admin/manager dashboard (ride records + KPIs) | Frontend | _Student C_ | Pending | — | — | Yes | — |
| T014 | Add authentication (session-based or Cognito) | Auth | _Student D_ | Pending | — | — | Yes | — |
| T015 | Write `docs/architecture.md` (stack, diagrams, cloud proposal, scaling) | Documentation | _Student B_ | Completed | _Student B_ | _DD Mon YYYY_ | Yes | File `docs/architecture.md` |
| T016 | Quantitative scalability analysis (§8) | Documentation | _Student A_ | Completed | _Student A_ | _DD Mon YYYY_ | Yes | File `docs/architecture.md` §8 |
| T017 | Security analysis table (§9) | Documentation | _Student C_ | Completed | _Student C_ | _DD Mon YYYY_ | Yes | File `docs/architecture.md` §9 |
| T018 | Failure & recovery analysis table (§10) | Documentation | _Student C_ | Completed | _Student C_ | _DD Mon YYYY_ | Yes | File `docs/architecture.md` §10 |
| T019 | Test end-to-end booking workflow | Testing | _Student D_ | Pending | — | — | No | — |
| T020 | Test end-to-end chat translation workflow | Testing | _Student D_ | Pending | — | — | No | — |

> Replace the italicised placeholders (student names, dates, commit hashes) with real values as work
> happens. Add new rows for every meaningful task — do not group unrelated work under one broad row
> such as "Develop backend" (see brief §11).

---

## How to Use This File

1. **Before starting a task** — add a row with `Status = Pending`, the component it touches, and who
   is assigned.
2. **When work begins** — update `Status = In Progress`.
3. **When an AI tool (Claude, ChatGPT, Copilot, etc.) is used** to implement, modify, or debug a task,
   set `AI Assistance = Yes` and keep the row updated as that work is reviewed and verified.
4. **When complete and verified** — set `Status = Completed`, fill in `Completed By` (the student who
   reviewed/tested it, never the AI tool), the completion date, and an evidence link (commit hash, PR,
   screenshot, test result, or working demo reference).
5. **If a completed task turns out to have a problem** — set `Status = Reopened` and add a new row or
   note describing the fix, rather than silently editing history.
6. **If blocked** — set `Status = Blocked` and note the dependency or problem in the Evidence column.

This table is the primary evidence source if there is ever a dispute about individual contribution
(brief §26): Project Implementation Record → GitHub history → actual code → working feature →
student's explanation at viva.
