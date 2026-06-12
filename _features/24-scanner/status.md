# Status

open

**Product scanner is docs-complete; production is entirely unshipped.** Build-guide `07-scanner/` (8 files) and `brioela-specs/01-product-health-scanning.md` are authoritative sources. No `backend/src/api/scan/`, no `tools/product-scan/`, no scan Zod schemas, no Supabase product/scan tables, no mobile product scanner (legacy Schnl QR at `mobile/app/profile/scan.tsx` only). Verdict assembly — the integration point for **07**, **22**, **23**, **31** — exists only in build-guide draft code.

**Living catalog:** Product sources, community overlay thresholds, verdict drivers, and scan follow-ups extend without renumbering.

# Shipped (partial)

## Brain / foundation
- [x] `constraints` table schema — **07**; scan will read via DO check (`constraint.schema.ts`)
- [x] `log_memory_event` tool — **05**; ready for `product_scanned` dual-write
- [ ] Brain internal routes `/internal/check-constraints`, `/internal/log-scan`
- [ ] `tools/product-scan/check-constraint.ts`
- [ ] `tools/product-scan/log-scan-event.ts`

## Backend API
- [ ] `backend/src/api/scan/` module
- [ ] `POST /api/scans/resolve`
- [ ] `POST /api/scans/vision-extract`
- [ ] `GET /api/scans/:id`, `/history`
- [ ] Product resolution (Redis, OFF, gov DB)
- [ ] `buildVerdict` unified assembly
- [ ] `checkConstraints` Brain RPC wrapper
- [ ] `checkConditions` helper (**23** body)

## Shared / Supabase
- [ ] `shared/validator/scan.schema.ts`
- [ ] `scan_events` Drizzle schema + migration
- [ ] `products`, `product_origin` Drizzle schema
- [ ] `product_fact_evidence`, `product_correction_request`
- [ ] `pending_scans` queue
- [ ] `product_community_health_summary` (**22** schema; **24** reads)

## Mobile
- [ ] Product scanner camera feature (`mobile/features/scanner/`)
- [ ] Verdict compact + expanded UI
- [ ] Hard allergy interrupt
- [ ] Condition flag rows (**23** UI)
- [ ] Offline scan queue
- [ ] Vision fallback hook (3s timeout)
- [x] Legacy Schnl QR scanner — unrelated; do not count as **24**

## Registry / sessions
- [ ] `SessionKind: product_scan` in `get.brain.tools.ts` (**19** — deferred for MVP API)

## Integration consumers (blocked on **24**)
- [ ] **31** recall match on `scan_events`
- [ ] **05** G6 dual-write coordination
- [ ] **45** in-store copilot mid-session scan push
- [ ] **44** kids explanation (needs adult verdict first)
- [ ] **42** Bela live scan relay

## Tests
- [ ] Verdict assembly unit tests
- [ ] Resolve handler integration tests
- [ ] Vision confidence threshold tests

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | **No scan API module** | `rg backend/src/api/scan` — zero |
| G2 | **No `shared/validator/scan.schema.ts`** | `rg VerdictSchema shared/` — zero |
| G3 | **No Supabase `scan_events` schema** | `rg scan_events shared/drizzle` — zero |
| G4 | **No `products` / `product_origin` Drizzle** | `rg products.schema shared/drizzle` — zero |
| G5 | **No `tools/product-scan/`** | Glob — empty |
| G6 | **No `resolveProduct` / Redis cache** | Build-guide only |
| G7 | **No `buildVerdict` helper** | Build-guide only |
| G8 | **No Brain `/internal/check-constraints` route** | No DO handler for constraint check |
| G9 | **Constraint check tools not registered** | **07** propose/confirm + check body all unwired |
| G10 | **No `checkConditions` in scan path** | **23** G19 — zero in `backend/src/api/scan` |
| G11 | **`VerdictSchema` lacks `conditionFlags`** | **23** G8 — cross-feature |
| G12 | **No community health summary read helper** | **22** tables + **24** consumer both absent |
| G13 | **No mobile product scanner** | Only legacy QR in `mobile/app/profile/scan.tsx` |
| G14 | **No vision-extract handler** | `05-gpt4o-mini-vision-fallback.md` — not implemented |
| G15 | **No `product_fact_evidence` provenance layer** | `06-product-data-provenance-correction.md` — schema absent |
| G16 | **No pending_scans retry job** | Unresolved UPC path not wired |
| G17 | **Dual-write memory_event not wired** | **05** G6 — scanner → `product_scanned` |
| G18 | **No scan route registration in backend app** | No Hono mount |
| G19 | **`SessionKind product_scan` missing** | `get.brain.tools.ts` — 5 kinds only |
| G20 | **Community overlay conflates clinical vs cohort tags** | `07-scanner/07` draft `getUserConditionTags(db)` — must split **23** vs **22** |
| G21 | **Ingredient synonym Supabase config absent** | `ingredient_synonyms` cited in **07**/**24** — no Drizzle |
| G22 | **Recall blocked** | **31** status — depends on **24** `scan_events` |
| G23 | **Menu scanning shares vision helpers — not created** | **26** blocked on **24** `enhance.image.helper.ts` |
| G24 | **Bela live scan reuses unresolved pipeline** | `11-bela/04-live-scan-session.md` — **42** blocked |

# Blocked by

- **04-brain-foundation** — Brain DO internal routes, migration runtime
- **05-brain-memory-tools** — `memory_event` + dual-write contract (G17)
- **07-brain-constraint-tools** — `checkProductConstraints` body + confirmed constraints
- **22-health-intelligence** — `medications` table + community summary tables (can ship parallel; scan degrades without)
- **23-medical-conditions** — `conditionFlags` evaluation (MVP can return `[]` until **23** ships)

# Blocks

- **31-recall-alerts** — `scan_events` match target
- **32-illness-detective** — scan history in `memory_event`
- **27-ground** — find-from-scan flow
- **45-in-store-copilot** — mid-session scan verdict push
- **44-kids-mode** — scan explanation requires adult verdict
- **42-bela** — live scan session relay
- **26-menu-scanning** — shared vision helper dependency
- **05-brain-memory-tools** G6 — dual-write ownership

# Sources

- `build-guide/07-scanner/` (all 8 files)
- `brioela-specs/01-product-health-scanning.md`
- `brioela-specs/05-origin-supply-chain-and-boycott-filters.md`
- `brioela-specs/07-allergy-dislike-and-dietary-guardrails.md`
- `_records/connections/02-scanner-connections.md`
- `_records/build-order/05-layer-scanner.md`
- `_records/session-log/007-scanner-complete.md`
- Neighbor: `_features/07-brain-constraint-tools/`, `_features/22-health-intelligence/`, `_features/23-medical-conditions/`, `_features/31-recall-alerts/`
