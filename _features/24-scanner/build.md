# Product Scanner — Build

Feature **24**. Production paths under `backend/src/api/scan/` (handlers, helpers, routes), `tools/product-scan/` (Brain DO constraint check + log scan), `shared/drizzle/schema/` (Supabase scan/product tables), `shared/validator/` (scan Zod schemas), `shared/routes/` (scan route constants), and `mobile/features/scanner/` (camera, verdict UI, network hooks).

**Scope:** Barcode resolve API, vision fallback API, product resolution stack, unified verdict assembly, Brain RPC orchestration for constraints + conditions, dual-write logging, mobile scan UX. **Not in 24 build:** constraint propose/confirm tools (**07**), medications table (**22**), condition rule evaluation (**23**), community table migrations (**22**), recall polling (**31**), menu scanning (**26**), kids explanation (**44**), Bela relay (**42**).

---

## Shipped today

| Area | Status |
|---|---|
| `constraints` Brain schema | ✓ (**07** — scan reads via DO; tools unwired) |
| `log_memory_event` tool | ✓ (**05** — ready for dual-write) |
| Legacy Schnl QR `mobile/app/profile/scan.tsx` | ✓ legacy — **not** product scanner |
| `backend/src/api/scan/` | ✗ |
| `tools/product-scan/` | ✗ |
| `shared/validator/scan.schema.ts` | ✗ |
| Supabase `scan_events`, `products`, community tables | ✗ |
| Mobile product scanner feature | ✗ |
| `SessionKind: product_scan` | ✗ deferred (**19**) |
| Tests | ✗ |

---

## File manifest

### Shared validator (24)

| File | Role |
|---|---|
| `shared/validator/scan.schema.ts` | `CreateScanInputSchema`, `VerdictSchema`, `ConstraintMatchSchema`, `VerdictTraceStepSchema`, `ConditionFlagResultSchema` extension (**23**) |
| `shared/validator/product.schema.ts` | `Product`, `ResolvedProductFactSnapshot`, `ProductFactEvidence` types |
| `shared/routes/scan.routes.ts` | `SCAN_ROUTES`, `SCAN_ROUTE_PATTERNS` |

### Supabase Drizzle (24 + shared product graph)

| File | Role |
|---|---|
| `shared/drizzle/schema/scan.schema.ts` | `scan_events` |
| `shared/drizzle/schema/products.schema.ts` | `products`, `product_origin` |
| `shared/drizzle/schema/product.fact.evidence.schema.ts` | `product_fact_evidence`, `product_correction_request` |
| `shared/drizzle/schema/pending.scans.schema.ts` | Unresolved UPC retry queue |
| `shared/drizzle/migrations/*` | Postgres migrations |

Community health 8 tables: **22** owns Drizzle files — **24** reads `product_community_health_summary` only.

### Backend API — scan module (24)

| File | Role |
|---|---|
| `backend/src/api/scan/scan.route.ts` | Hono route mount |
| `backend/src/api/scan/scan.controller.ts` | Controller wiring |
| `backend/src/api/scan/_handlers/resolve.scan.handler.ts` | `POST /api/scans/resolve` — barcode path |
| `backend/src/api/scan/_handlers/vision-extract.scan.handler.ts` | `POST /api/scans/vision-extract` |
| `backend/src/api/scan/_handlers/get.scan.handler.ts` | `GET /api/scans/:scanId` |
| `backend/src/api/scan/_handlers/list.scan.handler.ts` | `GET /api/scans/history` |
| `backend/src/api/scan/_handlers/index.ts` | Barrel |
| `backend/src/api/scan/_helpers/resolve.product.helper.ts` | Redis → Supabase → OFF/gov |
| `backend/src/api/scan/_helpers/product-fact-snapshot.helper.ts` | `buildResolvedProductFactSnapshot` |
| `backend/src/api/scan/_helpers/check.constraints.helper.ts` | Brain DO RPC |
| `backend/src/api/scan/_helpers/check.conditions.helper.ts` | **23** body — **24** calls |
| `backend/src/api/scan/_helpers/build.verdict.helper.ts` | Unified verdict assembly |
| `backend/src/api/scan/_helpers/community-health-summary.helper.ts` | Cached summary read |
| `backend/src/api/scan/_helpers/enhance.image.helper.ts` | Vision contrast pass (shared with **26**) |
| `backend/src/api/scan/_helpers/fetch.external.product.helper.ts` | Open Food Facts + gov adapters |
| `backend/src/api/scan/_helpers/index.ts` | Barrel |
| `backend/src/api/scan/index.ts` | Module export |

Register routes in backend app router (**01**).

### Brain DO — product scan tools (07 body in DO; 24 registers endpoints)

| File | Role | Owner |
|---|---|---|
| `tools/product-scan/check-constraint.ts` | `checkProductConstraints` — ingredient match | **07** logic; **24** internal route |
| `tools/product-scan/log-scan-event.ts` | Append `memory_event` `product_scanned` | **24** |
| `tools/product-scan/index.ts` | Barrel | **24** |
| Brain fetch handler `POST /internal/check-constraints` | Invokes check-constraint | **24** wires |
| Brain fetch handler `POST /internal/log-scan` | Invokes log-scan-event | **24** wires |

### Mobile (24)

| File | Role |
|---|---|
| `mobile/features/scanner/components/scanner.feature.tsx` | Camera + barcode callback |
| `mobile/features/scanner/components/scan-result-compact.tsx` | Primary verdict surface |
| `mobile/features/scanner/components/scan-result-expanded.tsx` | Details on demand |
| `mobile/features/scanner/components/hard-allergy-interrupt.tsx` | Inline safety gate |
| `mobile/features/scanner/components/condition-flag-rows.tsx` | **23** UI — separate rows |
| `mobile/features/scanner/hooks/use.scanner.hook.ts` | Barcode timeout → vision fallback |
| `mobile/network/scan/create-scan.api.ts` | `POST /api/scans/resolve` |
| `mobile/network/scan/vision-extract.api.ts` | `POST /api/scans/vision-extract` |
| `mobile/network/scan/use-create-scan.ts` | React Query mutation + offline queue |
| `mobile/app/(tabs)/scan.tsx` or equivalent | Tab entry — replace legacy profile QR |

### Background jobs (24 + 22)

| Job | Role | Owner |
|---|---|---|
| QStash pending_scans retry | Daily unresolved UPC retry | **24** |
| QStash refresh ingredient association Redis | Materialize community index | **22** body; **24** consumer |
| QStash refresh product_community_health_summary | Per-product overlay | **22** |

---

## Dependency order

```text
01-platform-foundation (Hono, Supabase client, Redis)
  → 04-brain-foundation (Brain DO, internal routes)
  → 05-brain-memory-tools (memory_event, log_memory_event)
  → 07-brain-constraint-tools (constraints table + check-constraint logic)
  → 22-health-intelligence (medications table + community summary tables — parallel)
  → 23-medical-conditions (conditionFlags helper — can stub empty array until shipped)
  → 24-scanner (this feature)
      → 31-recall-alerts (scan_events match target)
      → 32-illness-detective (memory_event food window)
      → 45-in-store-copilot (mid-session scan push)
      → 44-kids-mode (post-verdict explanation)
      → 42-bela (live scan relay)
```

**05 G6:** Wire `resolveScan` dual-write to `BrioelaBrain.appendMemoryEvent` — tracked in **24** status.

---

## Acceptance criteria

### Barcode path
- [ ] On-device decode fires `POST /api/scans/resolve` with Zod-valid payload
- [ ] `scan_events` row written before product resolution (status `pending`)
- [ ] 3s UPC cooldown prevents duplicate in-flight resolves
- [ ] Offline: mutation queues; cached prior verdict shown when available

### Product resolution
- [ ] Redis hit → return product < 500ms server time
- [ ] Cache miss → OFF → gov DB → persist Supabase + Redis
- [ ] Unresolved UPC → `status: unresolved` + `pending_scans` insert + user message
- [ ] `buildResolvedProductFactSnapshot` used for all safety decisions — no raw OFF bypass

### Constraint check (**07** via Brain)
- [ ] Single Brain RPC returns `ConstraintCheckResult`
- [ ] DO failure → `guardrails_unavailable` — never `clear` for personal checks
- [ ] Hard allergy → red verdict + mobile interrupt
- [ ] Boycott matches brand or parent company from `product_origin`
- [ ] Synonym resolution from cached Supabase config

### Condition check (**23** via Brain)
- [ ] `conditionFlags[]` returned separate from `constraint.matches`
- [ ] Display order: allergy block → verdict → condition rows → expanded
- [ ] Incomplete ingredients → uncertainty for hard conditions
- [ ] `condition_flag_events` logged (**23**)

### Community overlay (**22**)
- [ ] Hot path reads cached summary + Redis index only — no live 8-table join
- [ ] Strong association upgrades green → yellow; never hard-blocks alone
- [ ] Copy avoids clinical conclusions

### Verdict assembly
- [ ] One `VerdictSchema` object — not separate mini-verdicts
- [ ] Base score rule-based — no LLM in scoring path
- [ ] `trace` populated for expanded evidence story
- [ ] Origin/boycott in expanded view

### Vision fallback
- [ ] 3s no-barcode → capture frame → vision-extract endpoint
- [ ] Contrast enhancement before model call
- [ ] Confidence < 0.4 → graceful failure message
- [ ] Vision caveat shown when `isVisionExtracted`

### Logging
- [ ] Resolved scan updates `scan_events` with `product_id`, verdict level
- [ ] Brain `memory_event` kind `product_scanned` written on resolve
- [ ] **31** can query `scan_events` by UPC/product_id

### Mobile UX
- [ ] Compact result readable at a glance in store
- [ ] Hard allergy interrupt requires "I understand"
- [ ] Expanded details on demand — evidence-first layout
- [ ] Follow-up actions: Save, Avoid (**07** propose), Map, Ground Find, Share
- [ ] Scanning free for all tiers

### Performance
- [ ] Cache-hit path < 1.5s end-to-end
- [ ] External resolution path < 3s target

### Tests
- [ ] `buildVerdict` unit tests: base score, constraint override, community upgrade, guardrails_unavailable
- [ ] `resolveProduct` cache hit/miss mocks
- [ ] Integration: resolve handler writes scan_events + calls Brain RPC
- [ ] Vision extract confidence threshold behavior

---

## Cross-feature drafts (do not duplicate)

| Feature | Owns |
|---|---|
| **07** | `constraint.schema.ts`, propose/confirm tools, `checkProductConstraints` matching |
| **22** | `medications.schema.ts`, community 8 tables, HealthInsightAgent |
| **23** | `check.conditions.helper.ts` body, `conditionFlags` schema extension |
| **31** | Recall polling, `recall_scan_match` |
| **26** | Menu vision prompt + dish verdicts — reuses `enhance.image.helper.ts` |
