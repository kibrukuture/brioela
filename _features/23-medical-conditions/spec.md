# Medical Conditions — Spec

Feature **23**. User medical condition profiles in Brain DO SQLite, versioned clinical food rules in Supabase (`condition_rule`, `medication_food_interaction_rule`), condition-specific flags across scan/recipe/map/menu/cooking surfaces, and practitioner annotation privacy boundary. One voice declaration ("I'm pregnant", "I have celiac") permanently adapts food guidance — never diagnoses, treats, or prescribes.

**Not in this feature:** Constraint propose/confirm tools and `constraints` table (**07** — allergies, intolerances, dislikes, dietary identity, boycotts); private medication rows and HealthInsightAgent (**22**); scanner orchestration and verdict UI assembly (**24**); onboarding cinematic UX (**03** — capture happens ambiently in voice/chat, not forms); verified practitioner relationship plumbing (**46** — implements consent; **23** defines annotation boundary); wearables CGM overlay (**36** — enriches T2 diabetes/pre-diabetes when connected); community health Postgres tables and k-anonymity writes (**22** — population caution only).

**Living catalog note:** Supported `MedicalConditionType` values, rule triggers, and surface integrations will grow. New conditions require reviewed Supabase rule config before activation — never LLM-authored active rules.

---

## Purpose

Hundreds of millions of people manage food-related medical conditions. Brioela narrows food decisions from a single confirmed declaration:

1. **Detect** condition signals in voice/chat/cooking/scan comments — write **candidates only**, never activate silently.
2. **Confirm** once at the next natural pause — explicit yes/no; strict/moderate when rules differ.
3. **Store** active profiles privately in Brain DO SQLite — never Supabase identifiable rows, Ground, map tables, or community notes.
4. **Evaluate** products/recipes/menus against versioned Supabase `condition_rule` config — cached by backend.
5. **Surface** separate **condition flag rows** in scan UI — distinct from allergy/constraint rows and from community caution overlays.
6. **Filter** recipes, meal plans, map rankings, menu dishes, and cooking-session context against active profiles.
7. **Annotate** (future) via verified practitioners only after explicit user consent (**46** implements; **23** defines data shape and privacy).

Without **23**, clinical food profiles, condition scan rows, and reviewed condition rules do not exist.

---

## Complete component inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/22-medical-conditions/`, `brioela-specs/28-medical-condition-food-profile.md`, `backend/src/agents/brain/`, `shared/`, `mobile/`, neighbor `_features/07`, `22`, `24`.

| Component | Type | In **23**? | Shipped? | Owner / trigger | Primary sources |
|---|---|:---:|:---:|---|---|
| **`medical_condition_profiles` table** | Brain SQLite | **Yes** | No | Active confirmed profiles | `02-condition-profile-data.md` |
| **`medical_condition_candidates` table** | Brain SQLite | **Yes** | No | Detection pipeline before confirm | `01-condition-detection-confirmation.md` |
| **`condition_flag_events` table** | Brain SQLite | **Yes** | No | Audit on scan/recipe/menu flag | `04-scan-verdict-integration.md` |
| **`user_memory.health.conditions` mirror** | Brain SQLite | Partial | Partial | Prompt summary only — not operational | `02-condition-profile-data.md`, `03-read-user-memory.md` |
| **`condition_rule` Supabase table** | Postgres config | **Yes** | No | Versioned clinical food rules | `03-condition-rule-config.md` |
| **`medication_food_interaction_rule` Supabase** | Postgres config | **Yes** | No | Reviewed med–food rules at scan | `03-condition-rule-config.md`, `34-universal-visual-intake.md` |
| **`ingredient_synonyms` Supabase** | Postgres config | Shared | No | Rule evaluation synonym expansion | `07-scanner/03-constraint-check.md` |
| **Condition detection pipeline** | Brain agent inference | **Yes** | No | Same behavioral pattern as allergy (**07**) | `01-condition-detection-confirmation.md` |
| **`propose_medical_condition` tool** | Brain tool | **Yes** | No | Insert candidate row | Pattern: **07** propose tool |
| **`confirm_medical_condition` tool** | Brain tool | **Yes** | No | Activate/deactivate profile | Pattern: **07** confirm tool |
| **`deactivate_medical_condition` handler** | Brain handler | **Yes** | No | Voice/settings deactivation | `01-condition-detection-confirmation.md` |
| **`readActiveMedicalConditions` RPC** | Brain repository | **Yes** | No | Scan/recipe/cooking context load | `02-condition-profile-data.md` |
| **`evaluateConditionRules` helper** | Brain/backend | **Yes** | No | Match product/recipe against rules | `03-condition-rule-config.md` |
| **`ConditionFlagResult` / verdict extension** | Shared Zod | **Yes** | No | Parallel condition rows in scan | `04-scan-verdict-integration.md` |
| **Scan condition evaluation** | Called from **24** | **23** logic, **24** orchestration | No | After constraint check, before verdict | `04-scan-verdict-integration.md` |
| **Recipe/meal-plan condition filter** | Downstream consumers | **23** rules | No | Hide/rank/flag recipes | `05-recipe-meal-map-cooking.md` |
| **Menu scanning condition pass** | **26** consumer | **23** rules | No | Dish-level flags | `05-recipe-meal-map-cooking.md` |
| **Map private ranking bias** | **28** consumer | **23** context | No | No public "diabetes-safe" labels | `05-recipe-meal-map-cooking.md` |
| **Cooking session condition context** | **29** consumer | **23** compact context | No | Mira prompt injection | `05-recipe-meal-map-cooking.md` |
| **`PractitionerConditionAnnotation` shape** | Brain SQLite | **Yes** boundary | No | **46** implements consent UI | `06-practitioner-privacy-boundary.md` |
| **System prompt active-conditions block** | **15** builder | **23** data | No | Future suffix block | `15-brain-system-prompt/spec.md` |
| **Mobile condition settings / "what Brioela knows"** | React Native | **Yes** | No | View/delete profiles | `34-universal-visual-intake.md` |
| **Community `reported_condition_tags`** | Postgres (**22**) | **No** — cross-ref only | No | Population caution; not clinical | `07-scanner/07-community-product-intelligence.md` |
| **`constraints` table** | Brain SQLite (**07**) | **No** | Partial schema | Allergies/dislikes — separate path | `06-constraints.md` |
| **`medications` table** | Brain SQLite (**22**) | **No** | No | Private med rows; Warfarin overlap | `29-health-intelligence/01` |
| **`diagnosis.schema.ts`** | AI extract stub | Out of scope | Stub comment only | Document extraction — not profiles | `backend/src/core/ai/schemas/medical/diagnosis.schema.ts` |

### Shipped in backend today (condition-related)

- `user_memory` table schema — can hold `health.conditions` mirror entries (**05**).
- `constraints` table schema — **07** only; no medical condition types.
- `diagnosis.schema.ts` — empty stub (`// # Diagnosis/condition`).
- No `medical_condition_*` Brain tables, tools, handlers, or Supabase rule schemas.

---

## Architecture

```text
User voice/chat ("I have celiac" / "I'm pregnant")
        │
        ▼
Brain DO — detection writes candidate only
  medical_condition_candidates (pending_confirmation)
        │
        ▼ confirm once (propose + confirm tools or paired handler)
  medical_condition_profiles (active, rule_version pinned)
  optional user_memory.health.conditions mirror (prompt only)
        │
        ├── scan time [24 orchestrates]
        │     ├── 07 constraints check (allergies — separate rows)
        │     ├── 22 medications + medication_food_interaction_rule [23 config]
        │     ├── 23 evaluateConditionRules → conditionFlags[]
        │     └── 22 community associations (caution only — separate from clinical flags)
        │
        ├── recipe / meal-plan / menu / map / cooking [downstream features]
        │     └── readActiveMedicalConditions + evaluateConditionRules
        │
        └── practitioner annotation [46] — consent-gated reads/writes
```

**Rule config rule:** Condition logic is **never** hardcoded in Brain DO. Active rules live in Supabase `condition_rule` (+ `medication_food_interaction_rule` for med-class interactions). Backend caches by `(conditionType, ruleVersion)` with fail-safe caution on fetch failure for hard conditions.

---

## Clinical vs community vs constraints (critical boundary)

| Layer | What it is | Storage | Scan UI | Can hard-block? |
|---|---|---|---|:---:|
| **Constraints (07)** | User-declared allergen/intolerance/dislike/identity/boycott | Brain `constraints` | Allergy/constraint row in `constraint` verdict field | Yes — `hard_allergy`, `dietary_identity`, `boycott` |
| **Medical conditions (23)** | User-confirmed clinical food profiles (celiac, pregnancy, PKU, …) | Brain `medical_condition_profiles` + Supabase `condition_rule` | **Separate condition flag rows** | Yes — for `hard` rules (celiac, PKU, pregnancy high-risk) |
| **Medications (22)** | Private prescription rows | Brain `medications` | Medication-food interaction in constraint payload | Yes — via **23** `medication_food_interaction_rule` |
| **Community health (22)** | Anonymous aggregate `reported_condition_tags` | Supabase 8 tables | Community association caution copy | **Never alone** — max yellow deprioritize |

**Celiac overlap:** Celiac is a **medical condition** with `hard` condition rules (gluten + cross-contamination). A user may **also** have a `hard_allergy` constraint for gluten if they declared it that way (**07**). Both rows may appear — UI keeps them separate. Do not merge into one row.

**Warfarin overlap:** `warfarin_blood_thinner` is a **condition type** (vitamin K consistency notes). Actual Warfarin prescription may also exist in **22** `medications`. Scan evaluates both: condition rules (info/soft) + medication-food interaction rules (reviewed config).

**Community tags ≠ clinical profiles:** `getUserConditionTags` in scanner draft code references `user_memory.health.conditions` for community overlay lookup — this must **not** conflate anonymous `reported_condition_tags` with user-confirmed clinical profiles. Community overlay uses opt-in cohort tags; clinical flags use `medical_condition_profiles` + `condition_rule`. Document and implement separately (**24** G-gap).

---

## Supported conditions (v1)

```typescript
type MedicalConditionType =
  | 'pregnancy'
  | 'type_2_diabetes'
  | 'pre_diabetes'
  | 'gout'
  | 'hypertension'
  | 'high_cholesterol'
  | 'warfarin_blood_thinner'
  | 'ibs_low_fodmap'
  | 'celiac'
  | 'chronic_kidney_disease'
  | 'pku'
```

Additional types require rule config + data-quality review before activation (`01-condition-detection-confirmation.md`).

| Condition | Rule character | Scan behavior summary |
|---|---|---|
| Pregnancy | Hard for listeria/high-mercury/unpasteurized | Red condition row on explicit triggers |
| T2 diabetes / pre-diabetes | Soft — GI, added sugar, refined carbs | Yellow row; CGM overlay when **36** connected |
| Gout | Soft — high purine | Yellow + substitution suggestions |
| Hypertension | Soft — high sodium | Yellow; sodium surfaced prominently |
| High cholesterol | Soft — trans/sat fat thresholds | Yellow |
| Warfarin / blood thinners | Info/soft — vitamin K consistency | Note row — consistency, not avoid-all-greens |
| IBS / low-FODMAP | Soft — high-FODMAP ingredients | Recipe filter + yellow flags |
| Celiac | **Hard** — gluten + cross-contamination | Red condition row; stricter than gluten-free preference |
| Chronic kidney disease | Soft — K, P, Na | Yellow; nutrients surfaced |
| PKU | **Hard** — phenylalanine, aspartame | Red; allergy-equivalent |

---

## Detection and confirmation

### Core rule

Medical conditions are **never assumed**. Detection writes a **candidate**; activation requires explicit user confirmation (`01-condition-detection-confirmation.md`).

### Detection sources

Voice sessions, cooking sessions, chat, scan comments, recipe conversations. Practitioner notes later only if user grants access (**46**).

### Candidate shape

`MedicalConditionCandidate`: `candidateId`, `userId`, `conditionType`, `detectedFrom`, `sourceSessionId`, `evidenceText` (minimal quote — no full transcripts), `confidence`, `status` (`pending_confirmation` | `confirmed` | `dismissed` | `expired`), `detectedAt`.

### Confirmation prompt

Ask once at next natural pause. Include: condition name, what changes in the app, food-guidance-not-medical-advice disclaimer, explicit yes/no or strict/moderate choice when applicable.

Example copy (user-facing):

```text
You mentioned you're pregnant. Do you want me to apply pregnancy-safe food guidelines across scans, recipes, and meal ideas?
```

### Deactivation

Voice or settings: "I'm no longer pregnant", "Stop applying low-FODMAP rules". Mark inactive immediately; stop rule application; retain private audit unless user requests full deletion. Never infer reactivation without confirmation.

### Medical boundary (copy)

**Allowed:** "Apply pregnancy-safe food guidelines." / "Flag high-sodium products for hypertension." / "This does not replace clinician guidance."

**Blocked:** "You have diabetes." / "This will treat your condition." / "Ignore your doctor." / "Change your medication."

---

## Profile data model (Brain DO SQLite)

### `medical_condition_profiles`

```typescript
type MedicalConditionProfile = {
  profileId: string
  userId: string
  conditionType: MedicalConditionType
  strictness: 'strict' | 'moderate' | 'standard'
  status: 'active' | 'inactive' | 'deleted'
  confirmedBy: 'self_voice' | 'self_chat' | 'settings' | 'practitioner_suggested_user_confirmed'
  confirmedAt: number
  deactivatedAt: number | null
  ruleVersion: string          // pinned; new scans use current active version from config service
  notes: string | null
  updatedAt: number
}
```

**Storage rule:** Brain DO SQLite only. Not Supabase, Ground, shared map, analytics, or public profiles (`02-condition-profile-data.md`).

**Table vs memory:** May be explicit table **or** structured `user_memory` under `health.conditions`. **Prefer explicit table** for operational scan safety (same rationale as constraints vs `user_memory`). Mirror summaries to `user_memory` for prompt injection only.

### Active context (compact — every scan/recipe/cooking call)

```typescript
type ActiveMedicalConditionContext = {
  conditionType: MedicalConditionType
  strictness: 'strict' | 'moderate' | 'standard'
  ruleVersion: string
  displayName: string
}
```

Do not inject long medical explanations into every prompt.

### Multiple active conditions

Apply all active hard rules. On conflict, choose safer/more restrictive output and explain. Keep flags **separate in UI** — never silently suppress one condition.

### Deletion

Settings: delete all condition data. Removes profiles, flag event history where required, practitioner annotations tied only to that condition. Does not delete generic scan history unless user deletes separately.

### Audit events (private)

Candidate detected, user confirmed, strictness changed, deactivated, deleted, practitioner note added/removed. No full transcripts or unnecessary medical detail.

---

## Rule configuration (Supabase)

### `condition_rule`

```typescript
type ConditionRule = {
  ruleId: string
  conditionType: MedicalConditionType
  ruleVersion: string
  triggerKind: 'ingredient' | 'nutrient' | 'additive' | 'category' | 'preparation' | 'drug_interaction'
  triggerValue: string
  flagLevel: 'hard' | 'soft' | 'info'
  strictness: 'strict' | 'moderate' | 'standard' | 'all'
  reasonTemplate: string
  evidenceSource: string | null
  active: boolean
  updatedAt: number
}
```

### `medication_food_interaction_rule`

Owned by **23** (config); **22** owns private `medications` rows; **24** orchestrates check at scan.

```typescript
type MedicationFoodInteractionRule = {
  ruleId: string
  medicationClass: string
  triggerKind: 'ingredient' | 'category' | 'nutrient'
  triggerValue: string
  flagLevel: 'hard' | 'soft' | 'info'
  reasonTemplate: string
  active: boolean
  updatedAt: number
}
```

### Severity model

| Level | Meaning | UI |
|---|---|---|
| `hard` | Avoid / strong incompatibility | Red condition row; may hide recipe |
| `soft` | Caution / limit / rank lower | Yellow condition row |
| `info` | Educational context | Neutral info row or expanded detail |

### Review boundary

Active rules require human-reviewed config — evidence source, reviewer marker, severity rationale. LLM may **draft** candidates; never silently promote to production rules.

### Versioning

Each active profile stores `ruleVersion`. New scans use current active version; scan history not retroactively rewritten by default. Material rule changes → in-app notice, not fear-based push.

### Cache strategy

Backend cache key: `(conditionType, ruleVersion)`. Short TTL for updates. On fetch failure: fail-safe caution for active hard conditions — never false green.

---

## Scan verdict integration

### UI rule

Display order (`04-scan-verdict-integration.md`):

1. Hard allergy/safety block (**07**)
2. Standard scan verdict (base score)
3. **Condition flag rows (23)** — separate from allergy rows
4. Expanded product details (medication-food, community caution as sub-layers)

### Condition flag result

```typescript
type ConditionFlagResult = {
  conditionType: MedicalConditionType
  flagLevel: 'hard' | 'soft' | 'info'
  matchedRuleIds: string[]
  trigger: string
  reason: string
  confidence: number
}
```

Extend `VerdictSchema` with `conditionFlags: ConditionFlagResult[]` **or** parallel payload — must be visually distinct from `constraint` field.

### Low-confidence product data

Incomplete label/vision data → show uncertainty for hard conditions:

```text
Condition check incomplete: label data may be missing ingredients relevant to celiac.
```

Never show clean condition pass when ingredient data incomplete for active hard condition.

### Event logging — `condition_flag_events`

Private Brain rows: `entityKind` (`scan` | `recipe` | `menu_dish`), `entityId`, `conditionType`, `flagLevel`, `flagReason`, `ruleVersion`, `createdAt`. **Never** write to community tables.

---

## Downstream surface behavior

### Recipes (**25**), meal plans (**34**), menu scanning (**26**)

- Hard conflict → hidden by default or blocked until reviewed
- Soft conflict → ranked lower + flagged
- Substitutions: lowest-intervention first (`05-recipe-meal-map-cooking.md`)
- Never generate plan conflicting with celiac/PKU hard rules

### Map (**28**)

Private ranking bias only — never publicly label "safe for diabetes" or "pregnancy-safe".

### Cooking session (**29**)

Compact condition context in Mira prompt — speak guidance only when relevant.

### Wearables (**36**)

T2 diabetes/pre-diabetes + CGM: personal glucose response overlay on scan/recipe/meal-plan. Observational only — medical boundary preserved.

### Notifications (**21**)

In-app first. Push only for high-value, user-requested moments. No fear-based condition pushes.

### Kids mode (**44**)

Share cards scrub medical data (`21-kids-mode/04-share-card.md`). Kids co-scan does not expose parent condition profiles to child UI without future permission design.

### Passport (**47**), viral sharing (**51**), Mesa (**41**)

Medical conditions excluded from default export/share/enrichment (`28-passport/04-privacy-and-consent.md`, `24-viral-sharing/03-privacy-scrub-and-consent.md`, `26-mesa/07-shared-enrichment-and-invites.md`).

---

## Practitioner and privacy boundary

Practitioner integration depends on **46-verified-profiles**. **23** defines boundary; **46** implements relationship + consent UI.

- User owns and confirms conditions — practitioner **cannot** silently set condition
- Consent scopes: `active_conditions`, `condition_annotations`, scan flags, recipe guidance — wearable/CGM separate
- `PractitionerConditionAnnotation`: `annotationId`, `userId`, `practitionerId`, `conditionProfileId`, `note`, `status`, timestamps
- Annotations appear in scan/condition detail only if user allowed scope

### Privacy non-negotiables

- Brain DO private storage only
- Never Ground/community notes, shared map/product tables, ads, or Mesa members without explicit future permission
- Export excludes conditions by default; explicit opt-in for medical data export
- Full deletion revokes practitioner access to deleted condition

### Safety escalation

Medical questions beyond food filtering → decline and redirect to clinician. May still help with ingredient questions and food facts.

---

## Feature boundaries

| Feature | Scope |
|---|---|
| **23** (this) | Condition profiles, candidates, flag events, detection/confirm tools, `condition_rule` + `medication_food_interaction_rule` Supabase config, rule evaluation, condition verdict rows, practitioner annotation **shape** + privacy rules |
| **07** | `constraints` table — allergies, intolerances, dislikes, dietary identity, boycotts; propose/confirm tools; ingredient entity matching |
| **22** | `medications`, `health_events`, `health_captures`; reminders; HealthInsightAgent; community 8 tables; population caution overlays |
| **24** | Scanner orchestration: calls Brain RPC for constraints + meds + **condition evaluation**; assembles unified verdict |
| **03** | Auth/onboarding — no condition forms; ambient capture via agent |
| **15** | System prompt — future active-conditions suffix block |
| **46** | Verified practitioner consent UI + annotation write path |
| **36** | CGM/biometric enrichment for diabetes conditions |

### Overlap resolution table

| Situation | **07** | **23** | **22** |
|---|---|---|---|
| "I'm allergic to peanuts" | `hard_allergy` constraint | — | — |
| "I have celiac" | Optional separate gluten allergy constraint if user also declares | `celiac` condition profile + hard rules | — |
| "I'm on Warfarin" | — | `warfarin_blood_thinner` condition (consistency notes) | `medications` row + `medication_food_interaction_rule` |
| "I'm pre-diabetic" | — | `pre_diabetes` condition profile | CGM data in `health_captures` when **36** connected |
| Population "people like you reported events" | — | — | Community associations (**22**) — caution only |

---

## Conflicts and naming drift

| Conflict | Resolution |
|---|---|
| `medical_conditions` domain in `09-per-user-brain.md` vs explicit table in `02-condition-profile-data.md` | **Prefer explicit `medical_condition_profiles` table** for operational safety; `user_memory.health.conditions` mirror for prompts only |
| `getUserConditionTags(db)` in scanner community overlay draft uses `user_memory` | **Split:** clinical flags from `medical_condition_profiles`; community overlay from opt-in cohort tags — do not reuse clinical profile IDs for community lookup |
| `medication_food_interaction_rule` cited in **22**, **34**, **23** | **23** owns Supabase schema + review process; **22** owns private med rows; **24** calls both at scan |
| `diagnosis.schema.ts` stub | Document extraction only — not condition profile activation |
| Build-guide folder `22-medical-conditions` vs feature `23-medical-conditions` | Build-guide numbering is layer order; `_features/23` is feature index — same product scope |
| `15-brain-system-prompt` lists conditions under **22** / **36** | **23** owns condition prompt block data; **15** owns builder placement — update **15** when block ships |
| Legacy Schnl `not-medical-advice` mobile copy | Unrelated legacy UI — ignore unless blocking **23** mobile work |

### Obsolete / absent ledgers

- No `_records/implementation-ledger/` entries for medical conditions — build-guide `22-medical-conditions/` is authoritative.
- `_records/build-order/21-layer-medical-conditions.md` — layer index only; feature folder supersedes for implementation tracking.

---

## Sources (read for this migration)

### Build guides — medical conditions (all files)
- `build-guide/22-medical-conditions/00-overview.md`
- `build-guide/22-medical-conditions/01-condition-detection-confirmation.md`
- `build-guide/22-medical-conditions/02-condition-profile-data.md`
- `build-guide/22-medical-conditions/03-condition-rule-config.md`
- `build-guide/22-medical-conditions/04-scan-verdict-integration.md`
- `build-guide/22-medical-conditions/05-recipe-meal-map-cooking.md`
- `build-guide/22-medical-conditions/06-practitioner-privacy-boundary.md`

### Build guides — cross-refs
- `build-guide/06-brain-memory/01-sqlite-schema.md`
- `build-guide/07-scanner/03-constraint-check.md`
- `build-guide/07-scanner/04-scan-result-ui.md`
- `build-guide/07-scanner/07-community-product-intelligence.md`
- `build-guide/19-recipe-ingestion/05-confidence-and-constraints.md`
- `build-guide/23-verified-profiles/00-overview.md`
- `build-guide/23-verified-profiles/05-client-and-practitioner-boundary.md`
- `build-guide/29-health-intelligence/00-overview.md`
- `build-guide/29-health-intelligence/01-medication-tracking.md`
- `build-guide/21-kids-mode/04-share-card.md`
- `build-guide/21-kids-mode/05-safety-and-tier-boundary.md`
- `build-guide/26-mesa/07-shared-enrichment-and-invites.md`
- `build-guide/28-passport/04-privacy-and-consent.md`
- `build-guide/24-viral-sharing/03-privacy-scrub-and-consent.md`
- `build-guide/32-in-store-copilot/02-context-payload.md`

### Brioela specs
- `brioela-specs/28-medical-condition-food-profile.md`
- `brioela-specs/09-per-user-brain.md`
- `brioela-specs/34-universal-visual-intake.md`
- `brioela-specs/01-product-health-scanning.md`
- `brioela-specs/29-food-cost-inflation-tracker.md`
- `brioela-specs/51-tonight-dinner-answer.md`

### Implementable specs
- `implementable-specs/06-constraints.md`
- `implementable-specs/brioela-tools/03-read-user-memory.md`
- `implementable-specs/brioela-tools/09-propose-user-constraint.md`

### Records
- `_records/connections/19-medical-conditions-connections.md`
- `_records/build-order/21-layer-medical-conditions.md`
- `_records/session-log/026-medical-conditions-complete.md`
- `_records/inventory/inventory.md`

### Neighbor feature folders
- `_features/07-brain-constraint-tools/spec.md`
- `_features/22-health-intelligence/spec.md`
- `_features/24-scanner/status.md`
- `_features/15-brain-system-prompt/spec.md`
