# Kids Mode — Spec

Feature **44**. Child-facing food literacy layer: parent-controlled age calibration, scan-result kid explanations (secondary LLM after adult verdict), contextual voice tone switch in Mira sessions, supervised kid co-scan phone handoff, parenting-moment share cards, and safety/tier boundaries. Kids Mode augments **24** scanner output — it never replaces or weakens adult verdicts, hard allergy blocks, or constraint checks.

**Not in this feature:** Product scan resolution and verdict assembly (**24**); personal `constraints` tools and matching logic (**07**); medical condition rule bodies (**23**); Mesa member tables, Food Audience, or compatibility engine (**41** — may supply child-member constraints if owner created them); tier catalog and `checkTierAccess` implementation (**43** — **44** calls `kids_mode` action only); Discovery Card renderer and viral sharing transport (**51** — owns `kids_learning` card type and privacy scrub); generative grammar `kids-explainer-gentle` composition (**52**); Passport child-name scrub rules (**47**); child accounts, household auth, or per-child allergy profiles (Mesa phase 3+); guard/lexicon/reading-gate tooling.

**Living catalog note:** Age bands (`5-7`, `8-10`, `11-12`) and three-part explanation shape are stable product contracts. Co-scan learning prompts and grammar compositions may grow; safety ordering (adult verdict → hard allergy → kids copy) is non-negotiable.

---

## Purpose

Parents want to teach children about food but lack tools to translate ingredient lists into language a child understands. **44** turns the same scan that produces an adult technical verdict into a calibrated, educational moment — on-screen, via TTS, or in a supervised co-scan session — without creating child identity records.

1. **Calibrate** — parent sets age range once (one tap); default `8-10` if unset.
2. **Explain** — secondary LLM call after **24** verdict produces verdict sentence + two why sentences + one cool fact.
3. **Protect** — hard allergy/safety blocks stay above kids copy; low-confidence product data gets explicit uncertainty; no diagnosis, no moral shame, no medical advice.
4. **Gate** — Luma+ entitlement via **43** `kids_mode`; Sapor sees teaser only after adult verdict.
5. **Share** — optional parenting-moment card via **51** (`kids_learning`); no child name, no private allergy dump.
6. **Co-scan** — parent starts supervised handoff; child scans and hears Mira; parent controls always visible.

Without **44**, scan results stay adult-only; family grocery teaching and organic parent-to-parent sharing moments have no dedicated surface.

---

## Product definition

| Term | Meaning |
|---|---|
| **Kids Mode** | Parent-controlled food literacy layer — not a child account |
| **Kids Mode profile** | Parent preference: `enabled`, `ageRange` — no child identity |
| **Age range** | `5-7` \| `8-10` \| `11-12` — language calibration only |
| **Kids scan explanation** | Three-part structured output tied to `scanEventId` |
| **Kid explanation (voice)** | One-response Mira tone switch inside an existing session (`kid_explanation` scene) |
| **Kid co-scan** | Supervised scanner shell; child holds phone; Mira speaks to child (`kid_co_scan` scene) |
| **Parent controls** | End mode, mute, show adult details, share, change age — always visible in co-scan |
| **Safety context** | `none` \| `allergy_warning` \| `low_confidence` \| `both` — shapes kids copy |
| **Teaser** | Sapor: one example line + Luma upgrade prompt after adult verdict |
| **Kids learning card** | **51** `DiscoveryCardType: kids_learning` — privacy-scrubbed share artifact |

**Design principles (non-negotiable):**

- Kids Mode augments; **24** adult verdict always renders first.
- Hard allergy blocks appear **before** kids explanation — safety never deprioritized for tone.
- No child name, birthdate, school, photo, or health profile collection.
- One active age range per parent (v1) — change before each explanation if needed.
- Kid co-scan is supervised learning, not a child login or Mesa member auto-creation.
- Copy teaches; it does not scare, shame, or diagnose.

---

## Complete component inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/21-kids-mode/`, `brioela-specs/31-kids-food-literacy-mode.md`, `backend/src/`, `shared/`, `mobile/`, neighbor `_features/24`, `29`, `30`, `41`, `43`, `51`, `52`.

| # | Component | Type | In **44**? | Shipped? | Owner / trigger | Primary sources |
|---|---|---|:---:|:---:|---|---|
| 1 | **Kids Mode profile** | Brain SQLite + mobile settings | **Yes** | No | One-tap age range | `01-kids-profile.md` |
| 2 | **"Explain to my kid" CTA** | Mobile scan result UI | **Yes** | No | After **24** verdict | `02-scan-explanation.md` |
| 3 | **`generateKidsScanExplanation` helper** | Backend LLM | **Yes** | No | Secondary call post-verdict | `02-scan-explanation.md` |
| 4 | **`KidsScanExplanation` schema** | Shared Zod | **Yes** | No | API + prompt JSON contract | `02-scan-explanation.md` |
| 5 | **Kids explanation TTS playback** | Mobile + Mira pipeline | **Yes** | No | Reuses **29**/**30** TTS | spec **31**, `03-voice-mode.md` |
| 6 | **Voice kid explanation** | Mira scene `kid_explanation` | **Yes** | No | Parent phrase in cooking session | `03-voice-mode.md`, `30-mira/01` |
| 7 | **`VoiceToneMode` one-shot** | Mira session state | **Yes** | No | `expiresAfterResponse: true` | `03-voice-mode.md` |
| 8 | **Kid co-scan session** | Mobile + Mira scene | **Yes** | No | Parent starts "Let my kid scan" | `07-kid-co-scan-mode.md` |
| 9 | **`buildKidCoScanMiraScene`** | Scene builder | **Yes** | No | `kid_co_scan` kind | `30-mira/01` |
| 10 | **Co-scan learning prompts** | Mira speech policy | **Yes** | No | Optional label-literacy nudge | `07-kid-co-scan-mode.md` |
| 11 | **Parent control bar** | Mobile co-scan UI | **Yes** | No | End / mute / adult / share / age | `07-kid-co-scan-mode.md` |
| 12 | **Kids share card payload** | `KidsShareCard` type | **Yes** | No | Parent opts in post-explanation | `04-share-card.md` |
| 13 | **`kids_learning` Discovery Card** | **51** consumer | **Cross** | No | Renders scrubbed card | `24-viral-sharing/04` |
| 14 | **`kids-explainer-gentle` grammar** | **52** consumer | **Cross** | No | On-screen explanation layout | `27-generative-grammar/19` |
| 15 | **Luma tier gate (`kids_mode`)** | **43** consumer | **Cross** | No | On CTA tap, not during scan | `05-safety-and-tier-boundary.md` |
| 16 | **`checkKidsModeEntitlement` wrapper** | Brain helper | **Yes** | No | Thin call to **43** | `05-safety-and-tier-boundary.md` |
| 17 | **Sapor teaser + upgrade copy** | Mobile inline | **Yes** | No | After verdict, before full explanation | `25-pricing-tiers/03` |
| 18 | **`kids_mode_profile` table** | Brain SQLite | **Yes** | No | Parent preference row | `06-data-model-and-metrics.md` |
| 19 | **`kids_mode_scan_event` table** | Brain SQLite | **Yes** | No | Explanation audit per scan | `06-data-model-and-metrics.md` |
| 20 | **Kids Mode analytics events** | PostHog (no PII) | **Yes** | No | Activation, explain, share rates | `06-data-model-and-metrics.md` |
| 21 | **Hard allergy ordering** | Display policy | **Yes** | No | Scanner block → kids below | `05-safety-and-tier-boundary.md` |
| 22 | **Low-confidence caveat** | Prompt + UI rule | **Yes** | No | No confident kid copy from weak data | `05-safety-and-tier-boundary.md` |
| 23 | **Medical boundary copy rules** | Prompt guard | **Yes** | No | No ADHD/cure/sickness claims | `05-safety-and-tier-boundary.md` |
| 24 | **Mesa child member constraints** | **41** consumer | **Cross** | No | Optional future input to explanation | `26-mesa/06`, spec **41** |
| 25 | **Sacred / disordered-eating tone guard** | Prompt + **37** overlap | **Partial** | No | No moral shame; align craving guard | `02-scan-explanation.md`, **37** |
| 26 | **Settings Kids Mode toggle** | Mobile profile | **Yes** | No | Age range entry | `01-kids-profile.md` |
| 27 | **`POST /api/kids-mode/explain`** | Hono handler | **Yes** | No | Generate explanation for scan | planned |
| 28 | **`GET/PATCH /api/kids-mode/profile`** | Hono handler | **Yes** | No | Profile read/update | planned |
| 29 | **Co-scan state machine** | Mobile store | **Yes** | No | `active` \| `ended` session | `07-kid-co-scan-mode.md` |
| 30 | **Brain internal log kids event** | Optional RPC | **Yes** | No | Metrics without child PII | `06-data-model-and-metrics.md` |

### Shipped in repo today (kids-mode-related)

- `build-guide/21-kids-mode/` — **8 files complete** (docs only).
- `brioela-specs/31-kids-food-literacy-mode.md` — primary spec (no co-scan; tier says "Core").
- `_records/connections/17-kids-mode-connections.md`, `_records/build-order/19-layer-kids-mode.md`.
- `_records/session-log/023-kids-mode-complete.md`, `024-kids-mode-co-scan-addendum.md`.
- `build-guide/30-mira/01-scene-contract.md` — `kid_explanation`, `kid_co_scan` in `MiraSceneKind`.
- `build-guide/24-viral-sharing/` — `kids_learning` card type documented.
- `build-guide/02-coding-standards/01-monorepo-and-folder-structure.md` — `mobile/features/kids.mode/` planned.
- **`rg 'KidsMode|kids_mode|kid_co_scan|kid_explanation|kids\.mode' backend/src shared/ mobile/features'`** — zero product matches (2026-06-12).

---

## Architecture — scan explanation spine

```text
[24] scan pipeline completes
        │
        ▼
mobile scan result — adult verdict + hard allergy block (if any)
        │
        ├── Sapor: show "Explain to my kid" + teaser (optional one line)
        │         └── tap → **43** checkTierAccess('kids_mode')
        │                   ├── denied → upgrade prompt (never before verdict)
        │                   └── allowed → continue
        │
        ├── Luma+: full flow
        │         ├── load KidsModeProfile (age range; default 8-10)
        │         ├── if missing age → one-tap picker
        │         └── POST /api/kids-mode/explain { scanEventId, ageRange }
        │                   │
        │                   ▼
        │             gather prompt inputs from [24] verdict snapshot ONLY
        │             (product, verdict level, key ingredients, confidence,
        │              hard allergy status — NOT full user memory)
        │                   │
        │                   ▼
        │             secondary LLM → KidsScanExplanation JSON
        │                   │
        │                   ├── persist kids_mode_scan_event (Brain)
        │                   ├── render on-screen ([52] kids-explainer-gentle optional)
        │                   ├── TTS via Mira pipeline
        │                   └── optional → **51** kids_learning card
        │
        └── Kid co-scan branch (parent starts)
                  │
                  ▼
            buildKidCoScanMiraScene → MiraSession (no full cooking room required)
                  │
                  ▼
            reuse [24] scanner — same resolve → verdict → explain order
                  │
                  ▼
            Mira speaks to child + optional learning prompt
            parent control bar always visible
```

**Critical rule:** Steps 1–4 of **24** (resolve → constraints → adult verdict → safety display) always complete before any **44** LLM call. Co-scan does not use a separate product-resolution pipeline.

---

## Age calibration

| Range | Language style | Example tone |
|---|---|---|
| `5-7` | Very simple; concrete analogies; no jargon | "sugar cubes", "sometimes treat" |
| `8-10` | Simple concepts; few food-science words explained | ingredient order, added sugar |
| `11-12` | Near-adult; numbers and ingredient names allowed | grams, preservative names |

Default: `8-10` when unset. Parent changes range before generating — v1 does not support multi-child profiles.

---

## Three-part explanation format

Every kids scan explanation has exactly three parts:

1. **Verdict sentence** — one sentence, child-appropriate, aligned with adult verdict (no contradiction).
2. **Why sentences** — exactly two plain-language sentences.
3. **Cool fact** — true food-science fact connected to product context (ingredient, color, sugar, fiber, origin).

```typescript
type KidsScanExplanation = {
  scanEventId: string
  ageRange: '5-7' | '8-10' | '11-12'
  verdictSentence: string
  whySentences: [string, string]
  coolFact: string
  sourceConfidence: number
  safetyContext: 'none' | 'allergy_warning' | 'low_confidence' | 'both'
}
```

**Copy boundaries (blocked phrases):** "This will make you sick.", "This food is poison.", "Good kids do not eat this.", "This causes ADHD.", "This treats your condition."

**Preferred framing:** "sometimes treat", "everyday choice", "your body usually likes…", "ask a grown-up if you have an allergy."

---

## Voice mode (`kid_explanation`)

- Triggered contextually when parent says e.g. "Explain this to my kid" in a **29** cooking/voice session.
- Not a persistent session mode — one response, then reset to adult (`VoiceToneMode.expiresAfterResponse: true`).
- Uses existing Mira TTS — slower, warmer; no baby voice; under ~20s when possible.
- Safety: parent-facing clarity first if hard allergy in context, then simplified child line.

```typescript
type VoiceToneMode = {
  mode: 'adult' | 'kid_explanation'
  ageRange: '5-7' | '8-10' | '11-12' | null
  expiresAfterResponse: boolean
}
```

---

## Kid co-scan mode (`kid_co_scan`)

```typescript
type KidCoScanSession = {
  sessionId: string
  userId: string
  ageRange: '5-7' | '8-10' | '11-12'
  startedAt: number
  endedAt: number | null
  status: 'active' | 'ended'
  scanCount: number
}
```

**Child can:** scan, listen, optional short learning prompts (label literacy).

**Child cannot:** change constraints/memory/settings, share externally, purchase, post to Ground, delete history.

**Parent controls (always visible):** End Kid Mode, Mute voice, Show adult details, Share learning card, Change age range.

**Safety override:** hard allergy → parent-first framing ("Grown-up check: …") then calm child explanation.

**Mira scene:** `speechPolicy.defaultMode: teaching_prompt`, `maxUtteranceSeconds` low, `canInterrupt: true` for parent barge-in.

---

## Share card boundary (**51**)

```typescript
type KidsShareCard = {
  scanEventId: string
  productName: string
  productImageUrl: string | null
  verdictSentence: string
  coolFact: string
  ageRange: '5-7' | '8-10' | '11-12'
  attribution: 'we scanned this together with Brioela'
}
```

**44** produces payload; **51** renders `kids_learning` Discovery Card, scrubs private allergy text.

**Blocked on card:** child name, parent name, exact location, private allergy profile, full ingredient list, medical data, referral prompts, child photos.

**Safe allergy wording:** "We learned this food is not for our family because it contains an ingredient we avoid for safety." — not "My child is allergic to peanuts."

---

## Tier and safety boundaries

| Surface | Sapor (free) | Luma+ |
|---|---|---|
| Product scan + adult verdict | ✓ always | ✓ |
| Hard allergy block | ✓ always | ✓ |
| Kids Mode full explanation | teaser + upgrade | ✓ |
| Kid co-scan | blocked (upgrade on start) | ✓ |
| Voice kid explanation in cooking | blocked unless metered path TBD | ✓ with **29** voice entitlement |

Entitlement check runs when parent taps Kids Mode — **not** during standard scan (`05-safety-and-tier-boundary.md`, **43**).

Upgrade copy example: "Explain this in a way a child can understand with Luma." (**25-pricing-tiers/03**).

---

## Data model

### Brain SQLite (owner DO)

| Table | Fields | Notes |
|---|---|---|
| `kids_mode_profile` | `userId`, `enabled`, `ageRange`, `createdAt`, `updatedAt` | Parent preference only |
| `kids_mode_scan_event` | `scanEventId`, `userId`, `ageRange`, `explanationText`, `explanationSpoken`, `shared`, `createdAt` | Tied to **24** scan event |

No child identity columns. Delete with scan history deletion. Analytics events must not include child name, private allergy text, or raw voice audio.

---

## Success metrics

- Kids Mode activation rate (profile enabled).
- Scan-to-explanation rate (CTA tap → generated explanation).
- Voice explanation play rate.
- Share card generation and actual share rate.
- Co-scan session count and scans per session.
- Upgrade conversion from Kids Mode teaser.
- Retention delta: Kids Mode active vs not.
- Quality: regeneration rate, parent dismissal, safety conflict rate, low-confidence suppression rate.

---

## Feature boundaries

| Feature | Scope |
|---|---|
| **44** (this) | Profile, scan explanation LLM, voice tone switch, co-scan shell, share payload, safety copy rules, metrics |
| **24** | Adult verdict first; provides `scanEventId`, verdict, confidence, allergy status to **44** |
| **07** | Hard allergy / constraint data **24** reads — **44** displays order only |
| **23** | Medical condition flags on scan — scrub from share; no diagnosis in kids copy |
| **29** | Cooking session host; MiraSession DO; TTS pipeline |
| **30** | `MiraSceneKind`, `kid_explanation` / `kid_co_scan` scene contract |
| **41** | Mesa child members + constraints — optional future input; does not replace Kids profile |
| **43** | `kids_mode` FeatureAction; Luma minimum tier |
| **51** | `kids_learning` card render, image export, privacy scrub |
| **52** | `kids-explainer-gentle` on-screen composition |
| **37** | Disordered-eating sacred guard — kids copy must not moralize/shame (overlap, not duplicate) |

### vs **41** (Mesa)

- **44** Kids Mode profile ≠ Mesa `mesa_member` with `role: child`.
- Co-scan does not create Mesa members.
- Future: Mesa owner-created child member constraints may inform explanation context — **41** owns data; **44** consumes read-only slice.
- Mesa `child_view` permission model (scan in supervised Kids Mode) is **41** policy; **44** owns UX.

### vs **24** (Scanner)

- **24** owns pipeline and adult UI.
- **44** adds CTA below verdict; never above safety block.
- Kid co-scan reuses **24** scanner — no forked resolution.

### vs **43** (Pricing)

- **43** owns `kids_mode` in entitlement matrix (`minimumTier: LUMA`).
- **44** owns teaser UX and calls `checkTierAccess` at interaction time.

### vs **51** (Viral sharing)

- **44** builds `KidsShareCard` payload after parent opt-in.
- **51** owns Discovery Card system, static image render, growth suppression rules.

---

## Cross-spec conflicts (track in **44**)

| ID | Issue | Resolution |
|---|---|---|
| **C1** | Spec **31** says "Core tier and above"; build guide + **43** say Luma | **43** canonical: `kids_mode` → Luma; "Core" = legacy alias |
| **C2** | Spec **31** omits co-scan | Session **024** addendum + `07-kid-co-scan-mode.md` authoritative for co-scan |
| **C3** | `05-safety-and-tier-boundary.md` uses legacy `"free" \| "core"` in `KidsModeEntitlement` type | Wrappers use `BrioelaTier`; **43** **C6** |
| **C4** | Mesa spec **41** `child_view` vs Kids profile | Separate systems; Mesa members optional; Kids profile is parent preference |
| **C5** | Cooking kid scenes in **29** spec body | Scene builders in **44** + **30**; **29** integrates when MiraSession ships |
| **C6** | Generative grammar `child_warm` emotion vs kids explainer | **52** owns render; **44** owns copy contract |

---

## Obsolete ledgers (do not implement from body alone)

| Ledger | Why |
|---|---|
| `brioela-specs/31` tier "Core" without Luma alias | Superseded by **43** + `21-kids-mode/05` |
| Any "family account" under Kids Mode | Explicitly out of scope — session **024**, `07-kid-co-scan-mode.md` |
| `_records/build-order/19-layer-kids-mode.md` tier trigger line | Accurate; entitlement code lives in **43** not **44** |

---

## Sources

- `brioela-specs/31-kids-food-literacy-mode.md`
- `build-guide/21-kids-mode/` (00–07)
- `build-guide/30-mira/00-overview.md`, `01-scene-contract.md`
- `build-guide/24-viral-sharing/01`, `02`, `04`
- `build-guide/25-pricing-tiers/02`, `03`, `04`
- `build-guide/26-mesa/06-feature-integration.md`
- `build-guide/27-generative-grammar/19-code-package-structure.md`
- `_records/connections/17-kids-mode-connections.md`
- `_records/build-order/19-layer-kids-mode.md`
- `_records/session-log/023-kids-mode-complete.md`, `024-kids-mode-co-scan-addendum.md`
- Neighbor `_features/24-scanner/`, `29-cooking-session/`, `30-mira-speech-engine/`, `41-mesa/`, `43-pricing-tiers/`
