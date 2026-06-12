# Status

open

**Kids Mode not shipped.** Build-guide **21-kids-mode** is complete (8 files, docs only). Spec **31**, session logs **023**/**024**, and Mira scene contract document kid explanation, co-scan, share cards, and Luma tier gate — but zero production code in `backend/`, `shared/validator/kids.mode/`, or `mobile/features/kids.mode/`. Entitlement `kids_mode` documented in **43** — unwired (**43** G22).

# Shipped in backend (partial / docs only)

- [x] `build-guide/21-kids-mode/` (00–07) — docs complete per session 023 + 024
- [x] `brioela-specs/31-kids-food-literacy-mode.md` — primary spec (no co-scan; tier prose says "Core")
- [x] `_records/connections/17-kids-mode-connections.md`, `_records/build-order/19-layer-kids-mode.md`
- [x] `_records/session-log/023-kids-mode-complete.md`, `024-kids-mode-co-scan-addendum.md`
- [x] `build-guide/30-mira/01-scene-contract.md` — `kid_explanation`, `kid_co_scan` in `MiraSceneKind`
- [x] `build-guide/24-viral-sharing/` — `kids_learning` Discovery Card type
- [x] `build-guide/27-generative-grammar/19` — `kids-explainer-gentle` composition planned
- [x] `build-guide/02-coding-standards/01` — `mobile/features/kids.mode/` folder planned
- [ ] `kids_mode_profile` / `kids_mode_scan_event` Brain tables
- [ ] `shared/validator/kids.mode/` schemas
- [ ] `POST /api/kids-mode/explain` handler + secondary LLM
- [ ] `checkKidsModeEntitlement` wrapper → **43**
- [ ] Mobile scan result "Explain to my kid" CTA
- [ ] Kid co-scan shell + parent control bar
- [ ] Voice `kid_explanation` scene builder
- [ ] `kid_co_scan` Mira scene builder
- [ ] Kids share payload → **51** handoff
- [ ] Kids Mode analytics events
- [ ] Kids Mode tests

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | **No Brain `kids_mode_profile` table** | `06-data-model-and-metrics.md` — type only |
| G2 | **No Brain `kids_mode_scan_event` table** | Same |
| G3 | **No `shared/validator/kids.mode/`** | `rg kids.mode shared/` — zero |
| G4 | **No explain API handler** | `backend/src/api/kids.mode/` missing |
| G5 | **No secondary LLM explanation generator** | `02-scan-explanation.md` — planned helper |
| G6 | **No safety phrase validator** | `02-scan-explanation.md` blocked phrases — no code |
| G7 | **No entitlement wrapper** | **43** G22 — `check.kids.mode.entitlement` missing |
| G8 | **No mobile `features/kids.mode/`** | Coding standards plan only |
| G9 | **No scan result CTA integration** | **24** mobile scanner not built; **44** CTA unwired |
| G10 | **No Sapor teaser UI** | `05-safety-and-tier-boundary.md` — copy only |
| G11 | **No age range one-tap picker** | `01-kids-profile.md` — UI not built |
| G12 | **No TTS playback for explanation** | Spec **31** — depends **29**/**30** |
| G13 | **No `kid_explanation` scene builder** | `30-mira/01` — enum only |
| G14 | **No `kid_co_scan` scene builder** | `07-kid-co-scan-mode.md` — no `buildKidCoScanMiraScene` |
| G15 | **No co-scan mobile shell** | `07-kid-co-scan-mode.md` — UI not built |
| G16 | **No parent control bar** | Co-scan parent controls documented only |
| G17 | **No co-scan state machine / store** | `KidCoScanSession` type only |
| G18 | **No share payload builder** | `04-share-card.md` — **51** owns render |
| G19 | **No `kids_learning` card integration** | **51** not migrated — stub status only |
| G20 | **No `kids-explainer-gentle` grammar wire** | **52** not migrated |
| G21 | **MiraSession DO not shipped** | **29** G* — kid scenes blocked on DO shell |
| G22 | **Scanner pipeline not shipped** | **24** — **44** blocked on verdict source |
| G23 | **No kids mode analytics events** | `06-data-model-and-metrics.md` — event list only |
| G24 | **No kids mode tests** | No `kids*.test.ts` |
| G25 | **System prompt kids modifier unwired** | **15** spec — listed as **44** future |
| G26 | **Mesa child constraint consumer unwired** | **41** G20 — optional future prompt input |
| G27 | **Spec 31 tier says "Core" not Luma** | **C1** — **43** canonical |

# Cross-feature conflicts (track in **44**)

| ID | Issue | Resolution owner |
|---|---|---|
| **C1** | Spec **31** "Core tier and above" vs Luma naming | **43** — `kids_mode` → Luma |
| **C2** | Spec **31** omits co-scan | **44** — session **024** + `07` authoritative |
| **C3** | `KidsModeEntitlement` legacy tier strings in build guide | **43** **C6** — use `BrioelaTier` |
| **C4** | Kids profile vs Mesa `mesa_member` child role | **44** profile ≠ **41** member; separate tables |
| **C5** | `child_view` Mesa permission vs co-scan | **41** policy; **44** owns supervised UX |
| **C6** | Sacred/disordered-eating guard (**37**) vs kids shame boundaries | **44** prompt rules + **37** sacred block overlap — test together |

# 44 vs neighbor boundaries

| In **44** | In separate feature |
|---|---|
| Kids profile + scan event DDL | Scan pipeline — **24** |
| Secondary LLM kid explanation | Adult verdict — **24** |
| Hard allergy display order policy | Constraint match body — **07** |
| `kids_mode` teaser UX | `checkTierAccess` — **43** |
| `kid_explanation` / `kid_co_scan` scene builders | MiraSession DO — **29** |
| `MiraSceneKind` enum | Scene contract — **30** |
| `KidsShareCard` payload | Discovery Card render — **51** |
| On-screen layout optional | `kids-explainer-gentle` — **52** |
| Mesa child constraints in prompt (future) | Mesa member DDL — **41** |
| Medical scrub on share | Condition flags — **23** |

# Blocked by

- 24-scanner (verdict + scanEventId)
- 43-pricing-tiers (`kids_mode` gate)
- 04-brain-foundation (Brain SQLite + RPC)
- 29-cooking-session (voice path; co-scan voice)
- 30-mira-speech-engine (scene contract implementation)
- 07-brain-constraint-tools (allergy data via scan)

# Blocks

- 51-viral-sharing (`kids_learning` card — can parallel once payload stable)

# Draft count

**15** files in `draft/` — 14 gap/intended snapshots + `gap-index.md`.

# Sources

- `build-guide/21-kids-mode/` (00–07)
- `brioela-specs/31-kids-food-literacy-mode.md`
- `build-guide/30-mira/00-overview.md`, `01-scene-contract.md`
- `build-guide/24-viral-sharing/01`, `02`, `04`
- `build-guide/25-pricing-tiers/02`, `03`, `04`, `05`
- `build-guide/26-mesa/06-feature-integration.md`, `09-privacy-permissions.md`
- `build-guide/27-generative-grammar/19-code-package-structure.md`
- `_records/connections/17-kids-mode-connections.md`
- `_records/build-order/19-layer-kids-mode.md`
- `_records/session-log/023-kids-mode-complete.md`, `024-kids-mode-co-scan-addendum.md`
- Neighbor `_features/24-scanner/`, `29-cooking-session/`, `30-mira-speech-engine/`, `41-mesa/`, `43-pricing-tiers/`
