# Status

open

**Recall alerts are docs-complete; production is entirely unshipped.** Build-guide `15-recall-alerts/` (6 files) and `brioela-specs/26-personalized-recall-alerts.md` are authoritative. No `backend/src/api/recall/`, no `backend/src/jobs/recall/`, no recall Drizzle schemas, no QStash poll cron, no Brain `/internal/recall-match`. Critical push kinds `recall_alert_confirmed` / `recall_alert_probable` exist in **21** spec only.

**Living catalog:** Feed sources, exposure source types, and geo rules extend without renumbering.

# Shipped (partial)

## Docs / guides
- [x] `build-guide/15-recall-alerts/` — 6 files (session log 015)
- [x] `brioela-specs/26-personalized-recall-alerts.md`
- [x] `_records/connections/11-recall-alerts-connections.md`
- [x] `_records/build-order/13-layer-recall-alerts.md`

## Global polling + ingestion
- [ ] QStash FDA 15m / others hourly cron
- [ ] FDA / EFSA / RASFF / CFIA feed adapters
- [ ] Recall cursor diff state
- [ ] `recall_entry` Supabase table + migrations

## Matching
- [ ] Batch match worker (one query per recall)
- [ ] `recall_scan_match` table
- [ ] `product_exposure` ledger table
- [ ] `classify.match.confidence` helper
- [ ] Scan-time reverse check hook (**24** caller)

## Path B notification
- [ ] Brain `POST /internal/recall-match` handler
- [ ] Retraction follow-up handler
- [ ] Integration with **21** `send-push` (unshipped)
- [ ] **No** `recall_check` in **14** dispatch (correct by absence)

## User API + mobile
- [ ] `backend/src/api/recall/` module
- [ ] List / get / resolve handlers
- [ ] `mobile/features/recall/` detail screen
- [ ] Push deep link routing

## Shared contracts
- [ ] `shared/drizzle/schema/recall.schema.ts`
- [ ] `shared/validator/recall/`
- [ ] `shared/routes/recall.routes.ts`

## Tests
- [ ] Match confidence unit tests
- [ ] Batch match integration tests
- [ ] Brain notify handler tests

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | **No recall API module** | `rg backend/src/api/recall` — zero |
| G2 | **No recall job/workflow code** | `rg jobs/recall backend` — zero |
| G3 | **No `recall_entry` Drizzle schema** | `rg recall_entry shared/drizzle` — zero |
| G4 | **No `scan_events` match target** | **24** G3 — schema absent |
| G5 | **No Brain recall-match handler** | `rg recall-match backend/src/agents` — zero |
| G6 | **No QStash recall cron** | No poll schedule in Worker bootstrap |
| G7 | **Critical push not wired** | **21** G4–G6 — no Brain send-push; recall kinds spec-only |
| G8 | **`recall_check` scheduled conflict undocumented in code** | **14** `recall.check.boundary.gap.md` — build-guide obsolete |
| G9 | **Brain init recall_check seed** | `06-brain-memory/01-sqlite-schema.md` L830 — must not ship |
| G10 | **No `product_exposure` ledger** | `00-overview.md` requires unified ledger — schema absent |
| G11 | **No mobile recall feature** | `rg features/recall mobile` — zero |
| G12 | **No FDA feed adapter** | No external API integration in repo |
| G13 | **Receipt/pantry/Bela exposure writers** | **33**/**34**/**42** unshipped — ledger empty beyond scans |
| G14 | **Illness detective recall read** | **32** unshipped — consumer blocked on G3 + **32** |
| G15 | **Session log 015 implies complete** | Docs only — no production followed |
| G16 | **Implementable vs build-guide Path B** | `10-scheduled-alarms.md` authoritative; `05-alarm-system.md` scheduled recall_check obsolete |
| G17 | **Geo-scope match rules** | Spec 26 — no implementation |
| G18 | **Retraction notify flow** | `04-recall-detail-and-resolution.md` — not implemented |
| G19 | **Generative grammar recall static layer** | **52** — separate from pipeline |
| G20 | **Monorepo manifest paths** | `02-coding-standards/01-monorepo` lists recall folders — all absent |

# 31 vs neighbor boundaries

| In **31** (this feature) | In separate feature |
|---|---|
| Global feed poll + `recall_entry` | `scan_events` writer (**24**) |
| Batch match + `recall_scan_match` | `send-push` + suppression (**21**) |
| Path B Brain HTTP notify | `dispatchAlarm` / `scheduled_alarms` (**14**) |
| `recall_alert_*` trigger + copy | Alarm schedule tools (**09**) |
| `product_exposure` schema + match | Exposure writers receipt/pantry/Bela (**33**, **34**, **42**) |
| Recall detail + resolve UI | Illness ranking LLM (**32**) |
| Scan-time reverse check handler | Scan resolve orchestration (**24**) |

# Blocked by

- **01-platform-foundation** — QStash, Workflow, Supabase client
- **04-brain-foundation** — Brain DO internal routes
- **24-scanner** — `scan_events` (MVP match target)
- **21-platform-notifications** — `send-push` + critical bypass (partial foundation shipped)

# Blocks

- **32-illness-detective** — active recall cross-reference for suspect ranking
- **27-ground** — recall visual consistency (styling only; data independent)

# Sources

- `build-guide/15-recall-alerts/` (all 6 files)
- `brioela-specs/26-personalized-recall-alerts.md`
- `implementable-specs/10-scheduled-alarms.md`
- `_features/14-brain-alarm-dispatch/draft/recall.check.boundary.gap.md`
- `_features/21-platform-notifications/spec.md`
- `_features/24-scanner/spec.md`
- `_records/session-log/015-recall-alerts-complete.md`
