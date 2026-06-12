# Status

open

**Wearables build-guide complete; production is entirely unshipped.** Seven `build-guide/20-wearables/` files and spec 40 are done. Zero Brain wearables tables, zero API routes, zero mobile connectors, zero CGM pipeline, zero tests. `mobile/biomarker/` is unrelated placeholder.

# Shipped (partial / docs only)

## Docs & ledgers
- [x] `build-guide/20-wearables/00-overview.md` through `06-privacy-disconnect.md`
- [x] `brioela-specs/40-wearables-integration.md`
- [x] `_records/connections/16-wearables-connections.md`
- [x] `_records/build-order/18-layer-wearables.md`
- [x] `_records/session-log/022-wearables-complete.md`
- [x] `_features/36-wearables/spec.md`, `build.md`, `status.md`, `draft/` (this migration)

## Unrelated placeholders (not wearables)
- [x] `mobile/biomarker/types/biomarker-data.types.ts` — "implementation deferred"
- [x] `backend/src/core/ai/prompts/standardize-units.prompt.ts` — glucose unit example only

## Not shipped
- [ ] `wearable_connection` Brain SQLite table
- [ ] `glucose_meal_window` Brain SQLite table
- [ ] `health_captures` table (**22** G1 — blocks operational ingest)
- [ ] `POST /api/wearables/daily-summary`
- [ ] Brain `ingest.wearable.daily.summary` handler
- [ ] `route.wearable.memory` dual-write helper
- [ ] Apple HealthKit connector (mobile)
- [ ] Oura OAuth V2 connector (mobile)
- [ ] Connected Devices settings screen
- [ ] CGM meal window open/derive/spike pipeline
- [ ] Scan glucose verdict overlay
- [ ] Disconnect + delete-by-connection purge
- [ ] Wearable audit events
- [ ] Wearables API routes mounted
- [ ] Wearables tests

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | **No Brain wearables schemas** | `rg wearable.connection\|glucose_meal backend/src/agents/brain` — zero |
| G2 | **`health_captures` table missing (**22** G1)** | **36** ingest has no append target |
| G3 | **No `/api/wearables` routes** | `rg wearables backend/src/api` — zero |
| G4 | **No mobile `features/wearables/`** | `rg HealthKit\|WearableConnector mobile` — zero |
| G5 | **No HealthKit permission strings in app.json** | Product HealthKit UX not configured |
| G6 | **No daily summary Zod validator** | `shared/validator/wearables/` missing |
| G7 | **No Brain ingest RPC** | `ingest.wearable.daily.summary` — spec only |
| G8 | **Dual routing not implemented** | `health_captures` + `user_memory` per **22** G16 |
| G9 | **No `glucose_meal_window` table** | `04-cgm-food-response.md` SQL — not migrated |
| G10 | **No scan-triggered window open** | **24** scan path has no CGM hook |
| G11 | **No CGM 15-min window upload** | Mobile sync helper absent |
| G12 | **No spike trigger evaluator** | 3+ window rule — not coded |
| G13 | **No scan glucose overlay** | **24** verdict has no personal line |
| G14 | **No disconnect/delete handler** | `06-privacy-disconnect.md` — not built |
| G15 | **No wearable audit log** | Audit spec — no table |
| G16 | **Personality flag on delete not wired** | Brain maintenance hook missing |
| G17 | **Ambient `wearable_corroboration` field** | Spec 17 mentions; **35** wellbeing schema has no column yet |
| G18 | **Meal plan readiness modulation unwired** | **34** consumer — no memory reads |
| G19 | **Tonight readiness unwired** | **54** blocked-by **36** |
| G20 | **Kin contribution has no window source** | **50** blocked-by **36** |
| G21 | **Illness Sift wearable join unwired** | **32** optional v2 in draft only |
| G22 | **Push policy conflict unresolved in code** | **21** G10 — wearables must not push routine stats |
| G23 | **Spec 40 `readings_json` long-term vs build-guide ephemeral** | Prefer ephemeral raw — document in implementation |
| G24 | **Universal visual intake `health_signal_event` legacy** | Session 037 → `health_captures`; do not build Supabase table |
| G25 | **No implementation ledger entries** | `_records/implementation-ledger/` grep wearables — zero |
| G26 | **Oura API V1 must not be used** | Session 022 — V2/OAuth only; verify at implementation |
| G27 | **Dexcom API details unverified in docs** | Session 022 JS-gate — implement against current vendor docs |
| G28 | **Health Connect docs incomplete in session 022** | Re-verify Android permissions at implementation |
| G29 | **OAuth token storage location undefined** | Decide device Keychain vs encrypted Brain field |
| G30 | **No wearables tests** | Zero test files |

# 36 vs neighbor boundaries

| In **36** (this feature) | In separate feature |
|---|---|
| Connectors, client aggregation, upload API | `health_captures` DDL (**22**) |
| `wearable_connection`, `glucose_meal_window` | `medications`, `health_events` (**22**) |
| Ingest + memory routing + CGM correlation | HealthInsightAgent passes (**22**) |
| Spike trigger memory writes | Kin Supabase aggregates (**50**) |
| Disconnect/delete/audit | Push delivery (**21**) |
| Scan window open + overlay helper body | Scanner constraint orchestration (**24**) |
| SDK + daily summary pipeline | Sift ranking (**32**) |
| | Meal plan generator (**34**) |
| | Ambient wellbeing tables + surfacing (**35**) |
| | Medical condition rules (**23**) |
| | Passport "what Brioela knows" UI (**47**) |

# Blocked by

- **04-brain-foundation** — migrations spine for new tables
- **05-brain-memory-tools** — `write_user_memory` for `health.*` mirrors
- **22-health-intelligence** — `health_captures` table (ingest target)
- **24-scanner** — scan event hook for CGM windows + overlay surface

# Blocks

- **50-kin** — `glucose_meal_window` derived values
- **54-tonight** — readiness modulation
- **35-ambient-intelligence** — wearable corroboration (optional until **36** ships)
- **37-craving-decoder** — physiological evidence tier
- **45-in-store-copilot** — personal glucose swap suggestions
- **32-illness-detective** — optional wearable supporting context (not MVP blocker)

# Obsolete ledger entries

| Ledger | Issue |
|---|---|
| *(none for wearables code)* | No `_records/implementation-ledger/` entries |
| `mobile/biomarker/` | Lab biomarker placeholder — not wearables; do not conflate |
| `brioela-specs/34-universal-visual-intake.md` `health_signal_event` Supabase table | Superseded by Brain `health_captures` per session 037 |
| Spec 40 flow diagram `user_memory` only | Dual write with `health_captures` per **22** G16 — spec 40 still valid for namespace keys |

# Ambiguous / conflicting sources

1. **Storage routing:** Spec 40 emphasizes `user_memory.health.*`; `06-brain-memory/01` + **22** route measurements to `health_captures`. **Resolution: dual write — captures operational; memory mirrors for prompts (G8).**
2. **CGM table split:** Dedicated `glucose_meal_window` vs generic `health_captures` (**22** G17). **Keep dedicated table for scan-linked metrics + Kin; optional capture mirror for HealthInsight (G9).**
3. **Wearables push:** `20-wearables/05` lists weekly summary push; spec 23 + **21** G10 say routine stats in-app/low. **Default: no wearable push (G22).**
4. **Raw CGM readings:** Spec 40 SQL includes `readings_json`; build-guide deletes raw after derivation. **Prefer ephemeral raw (G23).**
5. **health_events vs spike triggers:** Glucose spikes as events vs `user_memory` spike facts. **Spike triggers → `user_memory`; acute symptomatic logs → `health_events` (**22**) if user reports — not automatic from CGM.**
6. **Phase 2 CGM before Health Connect:** Spec 40 prioritizes CGM over Android aggregator — product may ship CGM on iOS before Health Connect (G27).

# Draft count

**20** files in `draft/` (18 gap/production snapshots + `gap-index.md` + this count note in index).

# Sources

- `build-guide/20-wearables/` (all 7 files)
- `brioela-specs/40-wearables-integration.md`
- `build-guide/06-brain-memory/01-sqlite-schema.md`
- `build-guide/29-health-intelligence/00-overview.md`
- `_records/connections/16-wearables-connections.md`
- `_records/build-order/18-layer-wearables.md`
- `_records/session-log/022-wearables-complete.md`
- `_records/session-log/037-health-intelligence-and-doc-cleanup.md`
- `_features/22-health-intelligence/spec.md`, `status.md`
- `_features/21-platform-notifications/status.md` (G10)
- `_features/32-illness-detective/spec.md`
- `_features/34-pantry-meal-plan/spec.md`
- `_features/35-ambient-intelligence/spec.md`
