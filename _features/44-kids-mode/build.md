# Kids Mode — Build

Feature **44**. Production paths under `backend/src/agents/brain/_schemas/kids.mode.*.ts`, `backend/src/agents/brain/_handlers/kids.mode/`, `backend/src/agents/brain/_helpers/kids.mode/`, `backend/src/agents/brain/tools/kids.mode/`, `backend/src/api/kids.mode/`, `shared/validator/kids.mode/`, `shared/routes/kids.mode.routes.ts`, `mobile/features/kids.mode/`, and Mira scene builders under `backend/src/agents/mira/_scenes/` (owned with **29**/**30**).

**Scope:** Kids Mode profile + scan event Brain tables, Zod validators, secondary LLM explanation generator, entitlement wrapper (`kids_mode` → **43**), scan-result CTA + explanation UI, voice `kid_explanation` scene injection, co-scan shell + `kid_co_scan` scene, share payload handoff to **51**, analytics events (no child PII), prompt safety guards. **Not in 44 build:** product scan pipeline (**24**), `checkTierAccess` matrix (**43**), Discovery Card renderer (**51**), grammar renderer (**52**), Mesa member DDL (**41**), MiraSession DO class shell (**29**), constraint matching (**07**).

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/21-kids-mode/` (8 files) | ✓ docs only |
| `brioela-specs/31-kids-food-literacy-mode.md` | ✓ spec (co-scan + Luma tier in build guides, not spec body) |
| `_records/connections/17-kids-mode-connections.md` | ✓ ledger |
| `_records/build-order/19-layer-kids-mode.md` | ✓ ledger |
| `_records/session-log/023-kids-mode-complete.md`, `024-kids-mode-co-scan-addendum.md` | ✓ session logs |
| `build-guide/30-mira/01-scene-contract.md` — kid scene kinds | ✓ docs |
| `build-guide/24-viral-sharing/` — `kids_learning` card type | ✓ docs |
| `mobile/features/kids.mode/` | ✗ |
| `backend/src/api/kids.mode/` | ✗ |
| Brain `kids_mode_*` tables / handlers | ✗ |
| Kids Mode tests | ✗ |

**Zero Kids Mode production code.** `rg 'KidsMode|kids_mode|kid_co_scan|kid_explanation|kids\.mode' backend/src shared/ mobile/features` — zero matches (2026-06-12).

---

## File manifest

### Shared validator + routes (**44**)

| File | Role |
|---|---|
| `shared/validator/kids.mode/kids.scan.explanation.schema.ts` | `KidsScanExplanationSchema`, age range enum |
| `shared/validator/kids.mode/kids.share.card.schema.ts` | `KidsShareCardSchema` |
| `shared/validator/kids.mode/kid.co.scan.session.schema.ts` | `KidCoScanSessionSchema` |
| `shared/validator/kids.mode/kids.mode.profile.schema.ts` | Profile Zod (API boundary) |
| `shared/validator/kids.mode/voice.tone.mode.schema.ts` | `VoiceToneModeSchema` |
| `shared/validator/kids.mode/index.ts` | Barrel |
| `shared/routes/kids.mode.routes.ts` | `KIDS_MODE_ROUTES` |

### Brain SQLite schemas (**44** — owner DO)

| File | Role |
|---|---|
| `_schemas/kids.mode.profile.schema.ts` | `kids_mode_profile` |
| `_schemas/kids.mode.scan.event.schema.ts` | `kids_mode_scan_event` |
| `_schemas/index.ts` | Export + migration registration (**04**) |
| `_migrations/*` | Add Kids Mode tables to Brain chain |

### Brain helpers — `backend/src/agents/brain/_helpers/kids.mode/` (**44**)

| File | Role |
|---|---|
| `_helpers/kids.mode/check.kids.mode.entitlement.helper.ts` | Thin `checkTierAccess(userId, 'kids_mode')` |
| `_helpers/kids.mode/load.kids.mode.profile.helper.ts` | Read profile; default age `8-10` |
| `_helpers/kids.mode/build.kids.explanation.prompt.helper.ts` | System + user prompt from scan snapshot |
| `_helpers/kids.mode/generate.kids.scan.explanation.helper.ts` | Secondary LLM call → `KidsScanExplanation` |
| `_helpers/kids.mode/validate.kids.explanation.safety.helper.ts` | Blocked-phrase scan; safety context |
| `_helpers/kids.mode/append.kids.scan.event.helper.ts` | Persist explanation row |
| `_helpers/kids.mode/build.kids.share.card.payload.helper.ts` | `KidsShareCard` for **51** handoff |
| `_helpers/kids.mode/index.ts` | Barrel |

### Brain handlers — `backend/src/agents/brain/_handlers/kids.mode/` (**44**)

| File | Role |
|---|---|
| `_handlers/kids.mode/set.kids.mode.profile.handler.ts` | Enable + age range update |
| `_handlers/kids.mode/generate.kids.explanation.handler.ts` | Orchestrate explain for `scanEventId` |
| `_handlers/kids.mode/get.kids.mode.profile.handler.ts` | Profile read |
| `_handlers/kids.mode/index.ts` | Barrel |

### Brain tools — `tools/kids.mode/` (**44** — optional LLM surface)

| File | Role |
|---|---|
| `tools/kids.mode/explain.scan.to.child.tool.ts` | Agent-callable explain (cooking/scan followup) |
| `tools/kids.mode/index.ts` | Barrel → **19** registry |

### Backend API — `backend/src/api/kids.mode/` (**44**)

| File | Role |
|---|---|
| `kids.mode.route.ts` | Hono mount |
| `kids.mode.controller.ts` | Wiring |
| `_handlers/explain.scan.handler.ts` | `POST /api/kids-mode/explain` |
| `_handlers/get.profile.handler.ts` | `GET /api/kids-mode/profile` |
| `_handlers/set.profile.handler.ts` | `PATCH /api/kids-mode/profile` |
| `_handlers/index.ts` | Barrel |

Register routes in backend app router (**01**). Handlers call Brain RPC for profile + explanation persistence.

### Mira scene builders — `backend/src/agents/mira/_scenes/` (**44** + **29**/**30**)

| File | Role |
|---|---|
| `_scenes/build.kid.explanation.mira.scene.helper.ts` | `kid_explanation` one-shot |
| `_scenes/build.kid.co.scan.mira.scene.helper.ts` | `kid_co_scan` supervised shell |
| `_scenes/kid.co.scan.situation.schema.ts` | `KidCoScanSituation` |
| `_scenes/index.ts` | Export scene builders |

MiraSession DO class: **29** ships shell; **44** owns kid scene builders.

### Mobile — `mobile/features/kids.mode/` (**44**)

| File | Role |
|---|---|
| `kids.mode.feature.tsx` | Feature entry / settings surface |
| `_components/explain.to.kid.button.tsx` | Scan result CTA |
| `_components/kids.explanation.panel.tsx` | Three-part explanation display |
| `_components/age.range.picker.tsx` | One-tap `5-7` / `8-10` / `11-12` |
| `_components/kids.mode.teaser.tsx` | Sapor teaser + upgrade inline |
| `_components/kid.co.scan.shell.tsx` | Co-scan UI + parent control bar |
| `_components/parent.control.bar.tsx` | End / mute / adult / share / age |
| `_components/kids.share.prompt.tsx` | "Share this learning moment?" |
| `_hooks/use.kids.mode.profile.hook.ts` | Profile fetch/update |
| `_hooks/use.kids.explanation.hook.ts` | Explain API + TTS trigger |
| `_hooks/use.kid.co.scan.session.hook.ts` | Co-scan lifecycle |
| `_helpers/format.kids.explanation.helper.ts` | Display formatting |
| `index.ts` | Barrel |

Integrate CTA into `mobile/features/scanner/` scan result screen (**24** mobile) — import from **44**, do not duplicate logic.

### Mobile store (optional)

| File | Role |
|---|---|
| `mobile/stores/kids.mode/use.kid.co.scan.store.ts` | Active co-scan session state |

### Tests (**44**)

| File | Role |
|---|---|
| `backend/src/agents/brain/_helpers/kids.mode/validate.kids.explanation.safety.helper.test.ts` | Blocked phrases, safety context |
| `backend/src/agents/brain/_helpers/kids.mode/generate.kids.scan.explanation.helper.test.ts` | Prompt inputs, JSON shape |
| `backend/src/agents/brain/_helpers/kids.mode/check.kids.mode.entitlement.helper.test.ts` | Teaser vs allowed |
| `shared/validator/kids.mode/kids.scan.explanation.schema.test.ts` | Zod contract |

---

## Integration points

| Neighbor | Integration |
|---|---|
| **24** | Scan result passes `scanEventId`, verdict, confidence, allergy flags to explain handler |
| **43** | `checkTierAccess('kids_mode')` on CTA tap and co-scan start |
| **29** | Voice kid explanation uses cooking MiraSession; TTS pipeline |
| **30** | `MiraSceneKind: kid_explanation` \| `kid_co_scan` |
| **51** | `buildKidsShareCardPayload` → Discovery Card `kids_learning` |
| **52** | Optional `kids-explainer-gentle` composition for on-screen panel |
| **41** | Future: pass active Mesa child constraints into prompt inputs (read-only) |
| **07** | Hard allergy status from scan verdict — display order only |
| **15** | Future: kids mode system-prompt modifier block (listed as **44** future in **15**) |

---

## Acceptance criteria

### Profile and age calibration

- [ ] Parent sets age range with one tap — no form fields for child identity.
- [ ] Default age range `8-10` when unset.
- [ ] Profile stored in Brain `kids_mode_profile`; no child PII columns.
- [ ] Settings toggle and first CTA tap both reach same age picker.

### Scan explanation

- [ ] "Explain to my kid" appears only after **24** adult verdict is available.
- [ ] Hard allergy block from **24** renders above kids explanation — kids CTA never above safety.
- [ ] Secondary LLM receives scan snapshot only — not full user memory profile.
- [ ] Output matches `KidsScanExplanation` three-part JSON contract.
- [ ] Kid copy does not contradict adult verdict level.
- [ ] Low-confidence scan includes uncertainty caveat in explanation.
- [ ] Blocked medical/moral phrases rejected or rewritten by safety helper.

### Tier gate

- [ ] Sapor: teaser + one example line + Luma upgrade — never before adult verdict.
- [ ] Luma+: full explanation on tap.
- [ ] Entitlement check at interaction time — not during standard scan.
- [ ] Upgrade prompt copy matches `25-pricing-tiers/03`.

### Voice mode

- [ ] Parent phrase triggers one-shot `kid_explanation` scene inside **29** session.
- [ ] `expiresAfterResponse: true` — returns to adult mode after one response.
- [ ] Hard allergy: parent-facing line first, then child simplification.
- [ ] TTS: warm, not cartoon; parent can barge-in.

### Kid co-scan

- [ ] Parent starts via "Let my kid scan"; age picker if missing.
- [ ] Reuses **24** scanner — no separate resolution pipeline.
- [ ] Parent control bar always visible (end, mute, adult details, share, age).
- [ ] Child cannot reach settings, constraints, sharing, purchases, Ground.
- [ ] Hard allergy switches to parent-first safety framing.
- [ ] Optional learning prompts are short and non-aggressive.

### Share card

- [ ] Share only after parent action — no auto-open share sheet.
- [ ] Payload matches `KidsShareCard`; no child name or private allergy text.
- [ ] Handoff to **51** `kids_learning` card type.

### Data and privacy

- [ ] `kids_mode_scan_event` tied to `scanEventId`; deleted with scan history.
- [ ] Analytics: no child name, private allergy text, raw voice, exact location.
- [ ] Co-scan does not persist child voice responses as profile facts.

### Safety overlap

- [ ] No diagnosis or condition-treatment claims in kids copy.
- [ ] Copy aligns with **37** no-shame / no-moral-judgment principles for food.

---

## Blocked by

- **24-scanner** — adult verdict + `scanEventId` source
- **43-pricing-tiers** — `kids_mode` entitlement
- **04-brain-foundation** — Brain SQLite migrations + RPC
- **29-cooking-session** / **30-mira-speech-engine** — voice kid explanation + co-scan Mira scenes (co-scan UI can ship with text-first before voice)
- **07-brain-constraint-tools** — hard allergy data on scan (via **24**)

## Blocks

- None directly — **51** can ship `kids_learning` card renderer independently once payload contract is stable.

---

## Draft count

See `draft/gap-index.md` — **15** gap snapshots + index.

## Sources

- `build-guide/21-kids-mode/` (00–07)
- `build-guide/30-mira/01-scene-contract.md`
- `build-guide/24-viral-sharing/04-feature-specific-card-types.md`
- `build-guide/25-pricing-tiers/03-upgrade-triggers.md`, `04-access-checks-and-tools.md`
- `build-guide/02-coding-standards/01-monorepo-and-folder-structure.md` (`kids.mode/`)
