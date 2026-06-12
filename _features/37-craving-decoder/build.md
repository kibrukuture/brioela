# Craving Decoder — Build

Feature **37**. Production paths under `backend/src/agents/brain/_skills/craving-decoder/` (seed content), `backend/src/agents/brain/_handlers/craving-decoder/`, `backend/src/agents/brain/_helpers/craving-decoder/`, `shared/validator/craving-decoder/`, and scan-hook integration in **24** / Mira **30** `scan_followup`. No new SQLite tables — uses `skills`, `memory_event`, `user_memory`, and reads **35**/**36**/**34** consumer data.

**Scope:** system skill seed + index, evidence helpers (eating gap, history, offer matching), `craving_decoded` event writer, disordered-eating sacred block wiring, tier gate, metrics hooks, scan craving-context hook. **Not in 37 build:** wearables pipeline (**36**), ambient tables/pass (**35**), pantry DDL/generators (**34**), Tonight card (**54**), Kin Supabase (**50**), negative-space gap tables (**38**), new routing layer.

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/39-craving-decoder/` (4 files) | ✓ docs only |
| `brioela-specs/52-craving-decoder.md` | ✓ spec |
| `_records/connections/35-craving-decoder-connections.md` | ✓ ledger |
| `_records/build-order/36-layer-craving-decoder.md` | ✓ ledger |
| `skills` table + skill CRUD tools (**06**) | ✓ — no `craving-decoder` row seeded |
| `memory_event` + `log_memory_event` (**05**) | ✓ — no `craving_decoded` kind |
| `buildMemoryContext()` | ✗ — spec **09** only |
| Craving decoder handlers/helpers | ✗ |
| `memory_event` FTS auxiliary search | ✗ |
| Sacred block disordered-eating section | ✗ |
| Scan craving-context hook | ✗ |
| Craving decoder tests | ✗ |

**Zero craving-decoder production code.** `rg 'craving_decoded|craving-decoder|personality\.cravings' backend/src shared/ mobile/` — no matches.

---

## File manifest

### System skill seed (**37** + **06**)

| File | Role |
|---|---|
| `backend/src/agents/brain/_skills/craving-decoder/craving.decoder.skill.content.md` | Full skill markdown: evidence order, language, offers, guard |
| `backend/src/agents/brain/_skills/craving-decoder/craving.decoder.skill.meta.ts` | `name`, `description`, `tags`, `version` constants |
| `backend/src/agents/brain/_skills/seed.system.skills.helper.ts` | **04**/**06** — add `craving-decoder` to init seed list |
| `backend/src/agents/brain/_skills/index.ts` | Barrel export |

**Cross-ref:** Extend existing system skill seed path documented in **06** (`cooking-coach`, `illness-detective`, …) — do not create skills at runtime.

### Shared validator (**37**)

| File | Role |
|---|---|
| `shared/validator/craving-decoder/craving.decoded.event.schema.ts` | Zod payload for `craving_decoded` |
| `shared/validator/craving-decoder/craving.category.schema.ts` | Category + cause enums (product strings) |
| `shared/validator/craving-decoder/craving.decode.outcome.schema.ts` | User action next enum |
| `shared/validator/craving-decoder/index.ts` | Barrel |

### Brain helpers — evidence (**37**)

| File | Role |
|---|---|
| `_helpers/craving-decoder/estimate.eating.gap.helper.ts` | Last observed eating event → hours gap + honesty copy |
| `_helpers/craving-decoder/read.physiological.context.helper.ts` | `user_memory.health.*` sleep/readiness snapshot |
| `_helpers/craving-decoder/search.craving.history.helper.ts` | Recent `craving_decoded` + pattern rows |
| `_helpers/craving-decoder/read.craving.context.signals.helper.ts` | Wellbeing week, travel, cycle memory |
| `_helpers/craving-decoder/read.glucose.craving.context.helper.ts` | CGM drop + spike trigger read (**36**) |
| `_helpers/craving-decoder/assemble.craving.evidence.helper.ts` | Orchestrates 6-step bundle for agent context |
| `_helpers/craving-decoder/match.craving.offer.helper.ts` | Maps ranked cause → offer DTO |
| `_helpers/craving-decoder/build.kin.flattest.note.helper.ts` | **50** consumer — no-cause sweet path |
| `_helpers/craving-decoder/check.disordered.eating.guard.helper.ts` | Thread-level guard predicate |
| `_helpers/craving-decoder/check.craving.tier.gate.helper.ts` | Core+ vs Free degradation |

### Brain handlers (**37**)

| File | Role |
|---|---|
| `_handlers/craving-decoder/write.craving.decoded.event.handler.ts` | Validated append via `writeMemoryEvent` |
| `_handlers/craving-decoder/record.craving.outcome.handler.ts` | Update outcome when user acts (bridge/cook/buy/ignore) |
| `_handlers/craving-decoder/promote.personality.craving.memory.handler.ts` | User-confirmed → `personality.cravings` |

### Brain — memory context (**09** / **15** cross-cut)

| File | Role |
|---|---|
| `_handlers/build.memory.context.handler.ts` | **Gap today** — implement `buildMemoryContext()` per spec **09** |
| `_handlers/build.system.prompt.handler.ts` | **15** — ensure health + personality.cravings namespaces inject |

### Session safety — sacred block (**13** / **37**)

| File | Role |
|---|---|
| `_handlers/compress.session.handler.ts` | **13** — include disordered-eating guard in sacred assembly |
| `_helpers/session/build.sacred.context.helper.ts` | Add `disordered_eating_guard` block from active session flags |
| `_schemas/session.sacred.context.schema.ts` | Zod shape for sacred fields |

### Scanner integration (**37** hook; **24** calls)

| File | Role |
|---|---|
| `_handlers/craving-decoder/on.scan.craving.context.helper.ts` | Detect craving-context scan signature |
| `mobile/features/scanner/hooks/use-scan-craving-context.ts` | UI engaged flag + repeat comfort category |
| `tools/product-scan/attach.scan.craving.context.helper.ts` | Pass context into scan_followup / chat handoff |

### Pantry / Tonight consumers (**37** calls; owners build bodies)

| File | Role |
|---|---|
| `_helpers/craving-decoder/build.pantry.bridge.offer.helper.ts` | Calls **34** `loadPantryModel` + quick recipe rank |
| `_helpers/craving-decoder/build.tonight.adjust.offer.helper.ts` | Schedules/adjusts **54** preference — phrase only until **54** ships |

### Ambient weekly pass consumer (**35** / **12** — not **37** owner)

| File | Role |
|---|---|
| `_handlers/ambient/harden.craving.correlation.patterns.helper.ts` | **35** — `craving_decoded` → `craving_correlation` rows |

Document in **35** build.md — **37** only writes events.

### Observability (**37**)

| File | Role |
|---|---|
| `_helpers/craving-decoder/emit.craving.decode.metrics.helper.ts` | Engagement, no-pattern, guard counters |

### Tests (**37**)

| File | Role |
|---|---|
| `backend/src/agents/brain/_helpers/craving-decoder/estimate.eating.gap.helper.test.ts` | Gap hours + honesty when no events |
| `backend/src/agents/brain/_helpers/craving-decoder/check.disordered.eating.guard.helper.test.ts` | Guard triggers |
| `backend/src/agents/brain/_handlers/craving-decoder/write.craving.decoded.event.handler.test.ts` | Payload validation |
| `backend/src/agents/brain/_skills/seed.system.skills.helper.test.ts` | `craving-decoder` present after init |

---

## Acceptance criteria

### Skill and routing

- [ ] `craving-decoder` seeded at DO init with `source = 'system'`; not mutable via skill tools.
- [ ] Index description visible in system prompt; agent loads via `skill_view` on craving-shaped requests.
- [ ] No keyword router or dedicated HTTP endpoint for decode.
- [ ] No proactive craving prompts from this feature.

### Evidence and response

- [ ] Six-step assembly order matches skill content.
- [ ] First response sentence does not await auxiliary history query.
- [ ] At most two causes named; below threshold returns honest "no pattern" copy.
- [ ] Every claim includes plain-language source attribution.
- [ ] One optional offer max; then silence — no moralizing or willpower framing.

### Eating gap honesty

- [ ] Gap computed only from observed eating kinds (`product_scanned`, `receipt_ingested`, `meal_logged`, `recipe_cooked`, …).
- [ ] Copy uses "nothing logged since …" — never implies total fasting or nutrient deficiency.
- [ ] Does not surface **38** standing concerns or nutrient-gap copy in decode answer.

### Learning loop

- [ ] Successful decode writes `memory_event` `kind = craving_decoded` with validated payload.
- [ ] User action next recorded when bridge taken, cooked, bought anyway, or ignored.
- [ ] User-confirmed patterns write `personality.cravings` via `write_user_memory`.
- [ ] Weekly pass can read events and create `craving_correlation` patterns (**35**).

### Safety and privacy

- [ ] Disordered-eating guard in skill + sacred block; compression cannot drop guard.
- [ ] Guard thread: no further `craving_decoded` logs or pattern matching.
- [ ] Cycle context only from volunteered memory; never purchase-inferred.
- [ ] Craving events excluded from Harvest export list.

### Tier and degradation

- [ ] Core+ users get full evidence-based decode.
- [ ] Free users get brief generic answer + upgrade surface.
- [ ] Without wearables: decode works from behavioral evidence only.

### Integrations (smoke — after neighbors ship)

- [ ] **36** sleep/readiness appears in physiological step when memory exists.
- [ ] **34** bridge offer lists real inventory-backed recipe when gap cause.
- [ ] **54** sleep cause offer phrases Tonight adjustment without contradicting active plan.
- [ ] **50** flattest note only when Kin/personal glucose data exists; personal outranks Kin.
- [ ] **24** craving-context scan sets hook context for scan_followup.

### Tests

- [ ] Eating gap helper unit tests (no events, single scan, receipt newer than scan).
- [ ] Guard helper unit tests (compensatory language positive/negative cases).
- [ ] `craving_decoded` schema rejects invalid payloads.
- [ ] System skill seed includes `craving-decoder`.

---

## Build order dependencies

| Depends on | Why |
|---|---|
| **04** Brain foundation | Skill seed at DO init |
| **05** memory tools | `log_memory_event`, `write_user_memory` |
| **06** skill tools | System skill seed pattern + `skill_view` |
| **15** system prompt | Skill index injection |
| **20** chat runtime | Conversational delivery shell |
| **13** session compression | Sacred block for guard |
| **35** ambient (partial) | Wellbeing signals + `craving_correlation` pass — decode can ship with behavioral-only v1 |
| **36** wearables (partial) | Physiological teeth — optional v1 |
| **34** pantry (partial) | Bridge offer — degrade to generic "eat something real" until pantry ships |
| **24** scanner (partial) | Craving-context scan hook |

| Blocks | Why |
|---|---|
| Rich physiological decode | Needs **36** memory facts |
| Pantry-specific bridge copy | Needs **34** inventory model |
| Tonight factor-in execution | Needs **54** card pipeline |
| Kin flattest line | Needs **50** + **36** CGM |

---

## Sources

- `build-guide/39-craving-decoder/` (all files)
- `brioela-specs/52-craving-decoder.md`
- `_features/06-brain-skill-tools/build.md`
- `_features/05-brain-memory-tools/build.md`
- `_features/35-ambient-intelligence/build.md`
- `_features/36-wearables/build.md`
- `_features/34-pantry-meal-plan/build.md`
