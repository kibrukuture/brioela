# Status

open

**Craving-decoder build-guide complete; production is entirely unshipped.** Four `build-guide/39-craving-decoder/` files and spec **52** are done. Zero `craving-decoder` system skill, zero evidence helpers, zero `craving_decoded` writers, zero sacred-block guard, zero scan hook, zero tests.

# Shipped (partial / docs only)

## Docs & ledgers
- [x] `build-guide/39-craving-decoder/00-overview.md` through `03-safety-guard.md`
- [x] `brioela-specs/52-craving-decoder.md`
- [x] `_records/connections/35-craving-decoder-connections.md`
- [x] `_records/build-order/36-layer-craving-decoder.md`
- [x] `_records/session-log/038-breakthrough-wave-ten-new-features.md`
- [x] `_features/37-craving-decoder/spec.md`, `build.md`, `status.md`, `draft/` (this migration)

## Infrastructure partial (not craving-specific)
- [x] `skills` table + skill CRUD tools (**06**) — system seed list lacks `craving-decoder`
- [x] `memory_event` + `log_memory_event` (**05**) — no `craving_decoded` constant
- [x] Brain chat session shell (**20**) — no craving skill path

## Not shipped
- [ ] `craving-decoder` system skill seed + markdown content
- [ ] `buildMemoryContext()` implementation (**09** gap — blocks spec-as-written context injection)
- [ ] Eating gap estimator helper
- [ ] Craving history search (FTS or kind-index query)
- [ ] Evidence assembly + offer matching helpers
- [ ] `craving_decoded` event writer + Zod schema
- [ ] `personality.cravings` promotion path
- [ ] Disordered-eating guard in sacred block
- [ ] Tier gate (Core+ vs Free)
- [ ] Scan craving-context hook
- [ ] `craving_correlation` hardening in ambient weekly pass (**35**)
- [ ] Craving decode metrics
- [ ] Craving decoder tests

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | **No `craving-decoder` system skill** | **06** seed list: `cooking-coach`, `illness-detective`, … — no craving |
| G2 | **`buildMemoryContext()` not implemented** | `rg buildMemoryContext backend/src` — zero; spec **09** + **52** assume it |
| G3 | **No `craving_decoded` kind constant or schema** | `implementable-specs/01-memory-event.md` event list omits it |
| G4 | **No eating gap helper** | No `estimate.eating.gap` in repo |
| G5 | **No craving history assembly** | Spec allows FTS over `memory_event` — no `memory_event_fts` table |
| G6 | **No evidence assembly handler** | `_handlers/craving-decoder/` absent |
| G7 | **No offer bridge to pantry** | **34** pantry model unshipped — offer path blocked |
| G8 | **No Tonight adjustment handoff** | **54** unshipped — sleep-cause offer phrase only in spec |
| G9 | **No Kin flattest note helper** | **50** unshipped |
| G10 | **Physiological reads unwired** | **36** `health.biometrics` memory unshipped |
| G11 | **Wellbeing/stress context unwired** | **35** `wellbeing_signal` table absent |
| G12 | **`craving_correlation` pass absent** | **35** ambient pattern pass unshipped |
| G13 | **Disordered-eating sacred block missing** | `rg disordered\|sacred_context backend/src` — no craving guard |
| G14 | **No scan craving-context hook** | **24** scan path has no comfort-repeat detector |
| G15 | **No tier gate for Core+** | **43** pricing integration not wired to decode |
| G16 | **No metrics instrumentation** | Success metrics in spec **52** — no emitters |
| G17 | **Wrong path in prior stub `status.md`** | Referenced `build-guide/37-craving-decoder/` — actual folder is `39-craving-decoder/` |
| G18 | **No implementation ledger entries** | `_records/implementation-ledger/` grep craving — zero |
| G19 | **Mira `scan_followup` unwired for craving** | **30** scene exists in contract — no craving context payload |
| G20 | **Free tier degradation undefined in code** | Spec **52** — brief answer + upgrade surface |
| G21 | **Harvest sensitive-class exclusion unwired** | Spec **49** exclusion list — verify at export implementation |
| G22 | **No craving decoder tests** | Zero test files |

# 37 vs neighbor boundaries

| In **37** (this feature) | In separate feature |
|---|---|
| User-initiated decode flow + skill | Wearables ingest (**36**) |
| Eating **gap** (hours since observed eat) | Nutrient **absence** over weeks (**38**) |
| `craving_decoded` event writes | `nutrition_gap` / `diet.gaps` (**38**) |
| Immediate answer + one offer | Proactive pattern/gap insight budget (**35**/**38**/**40**) |
| `personality.cravings` confirmed patterns | `diet.gaps` standing concerns (**38**) |
| Disordered-eating guard on decode thread | Clinical nutrition rules (**23**/**28**) |
| Read physiological memory | Write sleep/CGM (**36**) |
| Pantry bridge **offer** copy | Pantry model + rescue rank (**34**) |
| Tonight adjust **phrase** | Tonight card pipeline (**54**) |
| Kin flattest **note** in no-cause path | Kin aggregates (**50**) |
| Scan craving-context **hook** | Scanner verdict body (**24**) |

### 37 vs 38 overlap (authoritative split)

- **37** answers a **momentary craving** with **recency** and **context** evidence; may say "nothing logged since 9am."
- **38** detects **chronic nutrient-category absence** with **coverage gate** over **6+ weeks**; says "omega-3 hasn't come through your kitchen."
- Both use observation honesty; neither diagnoses deficiency. **37 must not run negative-space detection or cite standing `diet.gaps` concerns unless user explicitly asks about them.**

# Blocked by

- **06-brain-skill-tools** — system skill seed pattern (partial: table exists, seed incomplete)
- **05-brain-memory-tools** — `craving_decoded` writes (partial: table exists)
- **15-brain-system-prompt** — skill index + memory context injection
- **20-brain-chat-runtime** — conversational delivery
- **13-brain-session-compression** — sacred block for guard
- **35-ambient-intelligence** — wellbeing signals + `craving_correlation` hardening (soft blocker for v1 behavioral-only)
- **36-wearables** — physiological evidence tier (soft blocker)
- **34-pantry-meal-plan** — specific pantry bridge copy (soft blocker)
- **54-tonight** — sleep-cause adjustment execution (soft blocker)

# Blocks

- None hard — **35** pattern loop is richer with `craving_decoded` events but ambient can ship without **37**

# Obsolete ledger entries

| Ledger | Issue |
|---|---|
| `_features/37-craving-decoder/status.md` (pre-migration) | Cited `build-guide/37-craving-decoder/` — **wrong**; folder is `build-guide/39-craving-decoder/` per `_records/build-order/36-layer-craving-decoder.md` |
| `_features/__tmp_39-craving-decoder/status.md` | Temp stub from earlier migration attempt — ignore; canonical folder is **37** |
| `build-guide/39-craving-decoder/00-overview.md` Depends On `18-ambient-intelligence` | Layer renumbering — maps to **35** in `_features/` index |
| `build-guide/39-craving-decoder/00-overview.md` Depends On `20-wearables` | Maps to **36** in `_features/` index |
| `build-guide/39-craving-decoder/00-overview.md` What Depends `38-tonight` | Maps to **54-tonight** in `_features/` index |

# Ambiguous / conflicting sources

1. **`buildMemoryContext()`:** Spec **52** + build-guide assume namespaces in session context via `buildMemoryContext()` (spec **09**). Not implemented in `backend/src/`. **Resolution: implement as part of **15**/**05** cross-cut (G2); until then inject `health.*` + `personality.cravings` via `load_session_context` or explicit helper at decode time.**
2. **FTS over `memory_event`:** Spec **52** allows one auxiliary FTS call; no FTS virtual table in migrations. **Resolution: v1 use `(kind, captured_at)` index query for `craving_decoded`; add FTS later if payload search needed (G5).**
3. **Behavior pattern pass owner:** Spec **17** weekly pass; **12** `BehaviorPatternAgent` vs **35** ambient product pass. **Resolution: `craving_correlation` rows written in **35** ambient pass consuming events; **12** may still write `pattern.*` memory — reconcile at **35** implementation (G12).**
4. **Proactive stress-eating vs decode:** Spec **52** exception: spec **17** may mention confirmed stress-eating under one-per-week budget. **37 never proactive.** **Resolution: stress-eating mention is **35** only; decode only when user asks (spec **52**).**
5. **Eating gap vs negative space honesty:** Spec **52** says eating gap inherits spec **50** coverage honesty **phrasing** — not that **37** runs coverage gate. **Resolution: gap = observed recency only; do not conflate with **38** absence detection (see 37 vs 38 table).**
6. **System skill list in **06** spec:** Lists five seeds, not `craving-decoder`. **Resolution: add sixth system skill at implementation (G1).**
7. **`memory_event` NEVER bulk-loaded (implementable-specs/01):** Spec **52** wants namespaces in context, not full event log — consistent if `buildMemoryContext` injects summaries only. **Auxiliary query for craving history is on-demand, not prompt bulk load.**

# Draft count

**13** files in `draft/` (12 production snapshots + `gap-index.md`).

# Sources

- `build-guide/39-craving-decoder/` (all 4 files)
- `brioela-specs/52-craving-decoder.md`
- `brioela-specs/17-behavioral-food-pattern-detection.md`
- `brioela-specs/50-negative-space-nutrition.md`
- `brioela-specs/40-wearables-integration.md`
- `brioela-specs/14-fridge-and-pantry-ingredient-rescue.md`
- `brioela-specs/51-tonight-dinner-answer.md`
- `brioela-specs/47-kin.md`
- `brioela-specs/09-per-user-brain.md`
- `brioela-specs/24-technical-architecture-backbone.md`
- `_records/connections/35-craving-decoder-connections.md`
- `_records/build-order/36-layer-craving-decoder.md`
- `_records/session-log/038-breakthrough-wave-ten-new-features.md`
- `_features/05-brain-memory-tools/spec.md`, `status.md`
- `_features/06-brain-skill-tools/spec.md`
- `_features/35-ambient-intelligence/spec.md`, `status.md`
- `_features/36-wearables/spec.md`, `status.md`
- `_features/34-pantry-meal-plan/spec.md`
- `_features/38-negative-space-nutrition/status.md`
- `implementable-specs/01-memory-event.md`
