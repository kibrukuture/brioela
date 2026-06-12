# Product Scanner — Spec

Feature **24**. Core product loop: on-device barcode decode (or GPT-4o mini vision fallback), evidence-weighted product resolution, unified verdict assembly (base score + constraints + medications + condition flags + community caution + origin/boycott), mobile scan UX, dual-write scan history (Supabase `scan_events` + Brain `memory_event`), and scan history for downstream recall (**31**), illness detective (**32**), Ground (**27**), and in-store copilot (**45**).

**Not in this feature:** Constraint propose/confirm tools and ingredient matching logic (**07** — Brain DO `check-constraint` body); medical condition rule evaluation (**23** — `evaluateConditionRules`, `conditionFlags`); private `medications` table and community health Postgres tables (**22**); recall feed polling and push delivery (**31**); menu scanning dish pipeline (**26** — reuses vision helpers only); universal visual intake classification (**34** — separate agent route); Bela live scan relay (**42** — reuses **24** handlers); kids co-scan explanation layer (**44** — augments verdict after **24**); `search_web` tool (**18** — not product scan).

**Living catalog note:** Product data sources, community tables, verdict drivers, and scan follow-up actions will grow. New evidence layers must merge into **one** verdict payload — never separate mini-verdict UIs.

---

## Purpose

Point camera at a grocery product → primary verdict (`green` / `yellow` / `red`) in under 3 seconds. Scanning is always free (spec 19). The scanner is Brioela's primary acquisition and retention loop.

1. **Capture** barcode on-device (no network for UPC) or vision-extract label after 3s timeout.
2. **Resolve** product identity via Redis → Supabase `products` → Open Food Facts + gov DBs; build `ResolvedProductFactSnapshot` with provenance.
3. **Check** Brain DO for constraints (**07**), medications (**22**), condition rules (**23**), and cached community association signals (**22**).
4. **Assemble** one unified verdict — base rule-based score with personal and community overlays.
5. **Display** compact result first; expanded evidence on demand; hard allergy interrupt when required.
6. **Log** `scan_events` (Supabase, cross-user) + `memory_event` kind `product_scanned` (Brain, private).

Without **24**, no product scan API, no verdict UI, and recall matching has no scan history source.

---

## Complete component inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/07-scanner/`, `brioela-specs/01-product-health-scanning.md`, `backend/src/api/scan`, `tools/product-scan`, `mobile/`, neighbor `_features/07`, `22`, `23`, `31`, `44`, `45`.

| Component | Type | In **24**? | Shipped? | Owner / trigger | Primary sources |
|---|---|:---:|:---:|---|---|
| **On-device barcode decode** | Mobile Expo Camera | **Yes** | No | Continuous scan while camera open | `01-barcode-decode.md` |
| **Vision fallback (3s timeout)** | Mobile + Worker | **Yes** | No | Auto when no barcode | `05-gpt4o-mini-vision-fallback.md` |
| **`POST /api/scans/resolve`** | Hono handler | **Yes** | No | Barcode path entry | `01-barcode-decode.md` |
| **`POST /api/scans/vision-extract`** | Hono handler | **Yes** | No | Label photo path | `05-gpt4o-mini-vision-fallback.md` |
| **`GET /api/scans/:id`, `/history`** | Hono handlers | **Yes** | No | Scan replay / history | `01-barcode-decode.md` |
| **`resolveProduct` helper** | Backend | **Yes** | No | Redis → Supabase → OFF/gov | `02-product-resolution.md` |
| **`buildResolvedProductFactSnapshot`** | Backend | **Yes** | No | Label Truth Graph boundary | `02-product-resolution.md`, `06-product-data-provenance-correction.md` |
| **`checkConstraints` helper** | Backend → Brain RPC | **Yes** orchestration | No | Calls DO `/internal/check-constraints` | `03-constraint-check.md` |
| **`checkProductConstraints` (Brain DO)** | Brain tool | **07** body, **24** caller | No | Ingredient/synonym/boycott match | `tools/product-scan/check-constraint.ts` |
| **`buildVerdict` helper** | Backend | **Yes** | No | Unified verdict assembly | `04-scan-result-ui.md` |
| **`checkConditions` helper** | Backend → **23** | **23** body, **24** calls | No | `conditionFlags[]` parallel payload | `22-medical-conditions/04-scan-verdict-integration.md` |
| **`getProductCommunityHealthSummary`** | Backend Redis read | **Yes** | No | Cached overlay — not live join | `07-community-product-intelligence.md` |
| **`VerdictSchema` / `CreateScanInputSchema`** | Shared Zod | **Yes** | No | API + mobile contract | `04-scan-result-ui.md`, `01-barcode-decode.md` |
| **Supabase `scan_events`** | Postgres | **Yes** | No | Cross-user recall match target | `01-barcode-decode.md` |
| **Supabase `products`, `product_origin`** | Postgres | **Yes** | No | Canonical product + origin versioning | `02-product-resolution.md` |
| **Supabase `product_fact_evidence`, `product_correction_request`** | Postgres | **Yes** | No | Provenance + correction queue | `06-product-data-provenance-correction.md` |
| **Supabase community health 8 tables** | Postgres | **22** schema, **24** reads summary | No | Materialized into product summary | `07-community-product-intelligence.md` |
| **`log-scan-event` Brain internal** | Brain DO | **Yes** | No | `memory_event` kind `product_scanned` | `01-barcode-decode.md`, `tools/product-scan/log-scan-event.ts` |
| **Mobile scanner screen** | React Native | **Yes** | No | Camera, verdict compact/expanded | `04-scan-result-ui.md` |
| **Hard allergy interrupt UI** | Mobile | **Yes** | No | Inline "I understand" gate | `04-scan-result-ui.md` |
| **Scan follow-up actions** | Mobile | **Yes** | No | Save, Avoid, Map, Ground Find, Share | `04-scan-result-ui.md` |
| **Offline scan queue** | Mobile React Query | **Yes** | No | Queue resolve when offline | `01-barcode-decode.md` |
| **`SessionKind: product_scan`** | Brain registry | Deferred | No | **19** — enables `search_web` in scan context | `implementable-specs/brioela-tools/18-search-web.md` |
| **Recall match hook** | **31** cron | **No** — consumer | No | Reads `scan_events` after **24** writes | `build-guide/15-recall-alerts/` |
| **Kids scan explanation** | **44** LLM call | **No** — augments | No | After adult verdict | `21-kids-mode/02-scan-explanation.md` |
| **In-store copilot mid-session push** | **45** Mira DO | **No** — consumer | No | Receives scan verdict events | `brioela-specs/45-in-store-copilot.md` |
| **Legacy Schnl QR scanner** | `mobile/app/profile/scan.tsx` | Out of scope | Legacy | Payment QR — not product health | Ignore unless replaced |

### Shipped in repo today (scanner-related)

- `constraints` Brain SQLite schema (**07**) — scan safety reads this via DO check; tools not wired.
- `log_memory_event` tool (**05**) — can write `product_scanned` when scanner dual-write ships.
- `get.brain.tools.ts` — no `product_scan` SessionKind; no scan-specific tools.
- **No** `backend/src/api/scan/`, **no** `tools/product-scan/`, **no** `shared/validator/scan.schema.ts`.
- **No** Supabase Drizzle schemas for `scan_events`, `products`, community health tables.
- `mobile/app/profile/scan.tsx` — legacy Schnl payment QR scanner only.

---

## Architecture — unified scan spine

The user sees **one** verdict. Product facts, constraints, medications, conditions, community caution, and origin are evidence layers inside one computation.

```text
scan input (barcode | vision frame)
        │
        ▼
write scan_events (Supabase, status=pending)
        │
        ▼
resolve product identity
  Redis product:{upc} → Supabase products → Open Food Facts + gov DB
        │
        ▼
buildResolvedProductFactSnapshot
  products + product_origin + product_fact_evidence
        │
        ├── getProductCommunityHealthSummary (cached/materialized)
        │
        ├── Brain DO POST /internal/check-constraints  [07 body]
        │     ├── constraints (allergies, identity, boycott, dislike)
        │     ├── medications → medication-food interactions [22 data]
        │     └── communityHealthAssociations (Redis index lookup) [22]
        │
        ├── checkConditions [23 body, 24 orchestrates]
        │     └── conditionFlags[] — separate from constraint.matches
        │
        ▼
buildVerdict — one Verdict object
        │
        ├── update scan_events (product_id, verdict level, status=resolved)
        └── Brain POST /internal/log-scan → memory_event product_scanned
        │
        ▼
mobile compact UI → optional expanded details
        │
        └── [44] optional kids explanation (after adult verdict)
        └── [31] async recall match on scan_events (not inline)
```

### Verdict assembly order (display + logic)

1. Hard allergy / dietary identity / boycott → **red** + interrupt (**07**).
2. Base health score (rule-based, no LLM).
3. Medication-food interactions → yellow/red by severity (**22** + **23** reviewed rules).
4. **Condition flag rows** — separate UI slot (**23**); hard conditions (celiac, PKU, pregnancy triggers) → red condition row.
5. Community association cautions → may upgrade green → yellow; never hard-block alone (**22**).
6. Origin / parent company — expanded view; boycott via **07** constraint type.
7. `guardrails_unavailable` if Brain check fails — never imply personal checks passed.

---

## Scan entry paths

### Barcode path (primary)

- Expo Camera + barcode API; types: EAN-13, EAN-8, UPC-A, UPC-E, QR.
- 3s cooldown dedupe per UPC while result loads.
- Payload: `CreateScanInput` — `upc`, `rawScanType`, `geoHash`, `capturedAt`.
- Endpoint: `POST /api/scans/resolve`.

### Vision fallback path

- Triggers after 3s with no barcode (`useIsomorphicLayoutEffect` timeout).
- Client captures JPEG 80% quality → `POST /api/scans/vision-extract`.
- Server: contrast enhance (`enhance.image.helper.ts`) → GPT-4o mini structured extraction → Zod parse.
- Confidence < 0.4 → graceful fail with actionable message.
- Match by name/brand to known product OR synthetic product for one-off scoring.
- Vision confidence caveat always shown when `isVisionExtracted`.

### Universal visual intake boundary (**34**)

Agent-classified photos at home (prescription, fridge, meal) route to Brain visual intake — **not** the scan resolve handler. Product barcode/label in store uses **24**. Ground public Finds use spec 35 — separate path.

---

## Product resolution — Label Truth Graph

Three-layer stack:

| Layer | Target | Latency |
|---|---|---|
| 1 | Upstash Redis `product:{upc}` (7d TTL) | < 100ms |
| 2 | Supabase `products` | < 500ms |
| 3 | Open Food Facts + country gov DB | 1–2s |

Unresolved UPC → `scan_events.status = unresolved` + `pending_scans` queue (daily retry).

`ResolvedProductFactSnapshot` is the scanner hot-path boundary — raw provider responses must not bypass it.

Source priority for safety fields (`06-product-data-provenance-correction.md`):

1. User label photo (GPT-4o mini) for current scan
2. GS1 verified identity
3. Open Food Facts
4. USDA / gov DBs
5. Commercial API fallback
6. Community correction (pending review — not safety truth until accepted)

---

## Constraint check boundary (**07**)

- Runs **inside Brain DO** via `checkProductConstraints(product, db)`.
- Backend calls single RPC — `checkConstraints(productFactSnapshot, userId, env)`.
- Ingredient synonym resolution from Supabase `ingredient_synonyms` (Redis cache 24h).
- Six outcome levels: `block`, `boycott`, `warn`, `deprioritize`, `clear`, `guardrails_unavailable`.
- Proposed constraint surfacing **after** verdict — rate-limited card, routes to **07** tools.

**24 does not implement** constraint matching — only orchestrates the call and merges results into `VerdictSchema.constraint`.

---

## Condition check boundary (**23**)

- Separate from `constraint.matches`.
- `checkConditions` helper calls Brain/`evaluateConditionRules` with active profiles.
- Returns `conditionFlags: ConditionFlagResult[]` — extend `VerdictSchema` or parallel payload.
- Display order: hard allergy block → standard verdict → **condition rows** → expanded detail.
- Incomplete label data → uncertainty copy for hard conditions; never false green.
- Logs `condition_flag_events` in Brain (**23**) — not community tables.

---

## Community intelligence boundary (**22**)

- Eight anonymized Postgres tables owned by **22**; **24** reads **cached** `product_community_health_summary` and Redis materialized `ingredient_event_association_index:{conditionTag}`.
- **Never** live full-table joins in scan hot path.
- Community signals upgrade green → yellow when `eventAssociationScore ≥ 0.60` and `supportingHealthGroupCount ≥ 3`.
- Forbidden copy: clinical conclusions. Allowed: observed association wording.
- **Split:** clinical condition flags (**23** `medical_condition_profiles`) ≠ community `reported_condition_tags` for overlay lookup — do not conflate `user_memory.health.conditions` with cohort tags (`07-scanner/07` draft `getUserConditionTags` must be fixed at implementation).

---

## Recall hook boundary (**31**)

- **24** writes `scan_events` to Supabase immediately (before resolution completes).
- **31** polls recall feeds globally; batch-matches each recall against all `scan_events` — not per-user DO queries.
- Recall detail uses product photo from scan history when available.
- Product exposure ledger (receipt, Bela, pantry) extends recall beyond barcode scans — **31** owns unified exposure model; **24** owns scan_events as one source.

---

## Mobile scan UX

### Compact result (default)

One color, one headline reason, primary actions (Save, Avoid, Nearby, Details). Evidence-first — not score-first (`01-design-system/13-evidence-first-ui.md`).

### Hard allergy interrupt

Replaces compact until user taps "I understand" — inline, not modal.

### Expanded result

Ingredients, nutrients, additives, source confidence, origin, community association disclaimer, medication/condition sub-layers. Score is supporting context.

### Follow-up actions

| Action | Routes to |
|---|---|
| Save | Scan history |
| Avoid | **07** `propose_user_constraint` (dislike) |
| Map | **28** geo-filtered |
| Add Find | **27** Ground draft (public facts only) |
| Share | **51** share card |

Scanning verdict always free. Tier gates apply only to actions triggered from result (e.g. Ground Find authoring).

---

## Kids mode scan differences (**44**)

- Standard **24** pipeline runs first — kids mode never replaces or weakens safety.
- "Explain to my kid" / Kid Co-Scan: secondary LLM after adult verdict.
- Hard allergy block stays above kids copy; parent controls always visible.
- Kid Co-Scan reuses **24** scanner — no separate resolution pipeline.
- Medical condition data scrubbed from share cards (**44** / **23** privacy).

---

## In-store copilot scan context (**45**)

- **45** consumes scan verdicts mid-session via Mira DO push — does not duplicate resolution.
- Session start payload assembled by Brain includes constraints, conditions, medications; live scans add verdict + constraint matches + price delta.
- **24** owns scan handler; **45** owns session lifecycle and silence rules.

---

## SessionKind `product_scan` (**19** deferred)

`implementable-specs/brioela-tools/18-search-web.md` lists `search_web` permission in `product_scan` context for ingredient lookups not in stored data. Add `product_scan` to `sessionKindSchema` when live scan agent sessions ship — not required for MVP barcode resolve API.

---

## Data model summary

### Supabase (shared)

| Table | Role |
|---|---|
| `scan_events` | Cross-user scan log; recall match target |
| `products` | Canonical UPC products |
| `product_origin` | Versioned origin/parent company |
| `product_fact_evidence` | Field-level provenance |
| `product_correction_request` | User correction queue |
| `pending_scans` | Unresolved UPC retry |
| `product_community_health_summary` | Cached community overlay per product |

### Brain DO (private)

| Write | Role |
|---|---|
| `memory_event` kind `product_scanned` | Illness detective food window, behavior patterns |
| Constraint/medication/condition reads | Via internal RPC — no Supabase user constraint rows |

---

## Performance targets

| Path | Target |
|---|---|
| Barcode decode | Instant (on-device) |
| Redis cache hit total | < 1.5s scan-to-verdict |
| External resolution total | < 3s |
| Supabase products hit (no Redis) | < 500ms server |
| Community overlay | Redis/materialized read only |

---

## Feature boundaries

| Feature | Scope |
|---|---|
| **24** (this) | Scan orchestration, product resolution, verdict assembly, mobile scan UX, scan_events + memory_event logging, vision fallback |
| **07** | `constraints` table, propose/confirm tools, `checkProductConstraints` matching logic |
| **22** | `medications`, community 8 tables, HealthInsightAgent flywheel, medication-food interaction data |
| **23** | `medical_condition_profiles`, `condition_rule` config, `conditionFlags`, `checkConditions` helper body |
| **31** | Recall polling, scan_event matching, critical push |
| **26** | Menu scanning — reuses vision helpers, not product resolution |
| **18** | `search_web` — not scan; optional in future `product_scan` session |
| **44** | Kids explanation layer after **24** verdict |
| **45** | In-store voice session consuming **24** scan results |
| **42** | Bela live scan relay — calls **24** resolution + constraint check |

### Overlap resolution

| Situation | Owner |
|---|---|
| Peanut allergy block | **07** `hard_allergy` in `constraint.matches` |
| Celiac hard flag | **23** `conditionFlags` (may coexist with **07** gluten constraint) |
| Warfarin vitamin K note | **23** condition + **22** medication row + **23** `medication_food_interaction_rule` |
| MSG + hypertension community caution | **22** community overlay in `constraint.communityHealthAssociations` or verdict community block |
| Boycott Nestlé | **07** `boycott` constraint + **24** origin display |
| Recall for scanned UPC | **31** matches **24** `scan_events` |

---

## Conflicts and naming drift

| Conflict | Resolution |
|---|---|
| Build-guide folder `07-scanner` vs feature `24-scanner` | Build-guide is layer order; `_features/24` is feature index — same product scope |
| `_features/05` G6 cites "feature 26" for scan dual-write | **24-scanner** owns scan_events → memory_event wiring |
| `mobile/app/profile/scan.tsx` | Legacy Schnl QR payment — replace with product scanner under `mobile/features/scanner/` |
| `getUserConditionTags(db)` from `user_memory` in community draft | Split clinical profiles (**23**) from opt-in cohort tags (**22**) at implementation |
| Recall "product exposure ledger" vs `scan_events` only | **31** extends exposure sources; **24** keeps `scan_events` as barcode scan source |
| Bela scan card colors "orange" vs Brioela green/yellow/red | Bela UI may map levels — **24** canonical enum is green/yellow/red |
| `food_constraint` in brioela-spec 07 vs `constraints` table in Brain | Brain `constraints` table (**07**) is authoritative implementation |
| `SessionKind product_scan` | Deferred — barcode API path does not require it for MVP |

### Obsolete / absent ledgers

- `_records/session-log/007-scanner-complete.md` — build-guide written 2026-06-06; no production implementation followed.
- No `_records/implementation-ledger/` entries for scanner.
- `_records/build-order/05-layer-scanner.md` — layer index only; feature folder supersedes for tracking.

---

## Sources (read for this migration)

### Build guides — scanner (all files)
- `build-guide/07-scanner/00-overview.md`
- `build-guide/07-scanner/01-barcode-decode.md`
- `build-guide/07-scanner/02-product-resolution.md`
- `build-guide/07-scanner/03-constraint-check.md`
- `build-guide/07-scanner/04-scan-result-ui.md`
- `build-guide/07-scanner/05-gpt4o-mini-vision-fallback.md`
- `build-guide/07-scanner/06-product-data-provenance-correction.md`
- `build-guide/07-scanner/07-community-product-intelligence.md`

### Build guides — cross-refs
- `build-guide/22-medical-conditions/04-scan-verdict-integration.md`
- `build-guide/15-recall-alerts/00-overview.md`
- `build-guide/21-kids-mode/02-scan-explanation.md`
- `build-guide/21-kids-mode/07-kid-co-scan-mode.md`
- `build-guide/32-in-store-copilot/02-context-payload.md`
- `build-guide/11-bela/04-live-scan-session.md`
- `build-guide/01-design-system/13-evidence-first-ui.md`
- `build-guide/17-menu-scanning/02-menu-gpt4o-mini-vision-and-parsing.md` (vision reuse boundary)

### Brioela specs
- `brioela-specs/01-product-health-scanning.md`
- `brioela-specs/05-origin-supply-chain-and-boycott-filters.md`
- `brioela-specs/07-allergy-dislike-and-dietary-guardrails.md`
- `brioela-specs/19-pricing-and-tiers.md` (scan always free)
- `brioela-specs/26-personalized-recall-alerts.md`
- `brioela-specs/34-universal-visual-intake.md`
- `brioela-specs/45-in-store-copilot.md`
- `brioela-specs/31-kids-food-literacy-mode.md`

### Implementable specs
- `implementable-specs/01-memory-event.md` (`product_scanned` kind)
- `implementable-specs/bela/04-live-scan-session.md`
- `implementable-specs/brioela-tools/18-search-web.md` (`product_scan` SessionKind)

### Records
- `_records/connections/02-scanner-connections.md`
- `_records/build-order/05-layer-scanner.md`
- `_records/session-log/007-scanner-complete.md`

### Neighbor feature folders
- `_features/07-brain-constraint-tools/spec.md`
- `_features/22-health-intelligence/spec.md`
- `_features/23-medical-conditions/spec.md`
- `_features/31-recall-alerts/status.md`
