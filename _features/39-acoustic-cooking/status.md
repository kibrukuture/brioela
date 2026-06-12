# Status

open

**Acoustic cooking build-guide complete; production is entirely unshipped.** Four `build-guide/33-acoustic-cooking/` files and spec **46** are done. Zero acoustic awareness prompt, zero `sound_cue` on recipe steps, zero `vision_event` / `evidence_source`, zero intervention write path, zero learned-cue writeback, zero tests. Host session (**29**) and speech engine (**30**) also unshipped.

# Shipped (partial / docs only)

## Docs & ledgers
- [x] `build-guide/33-acoustic-cooking/00-overview.md` through `03-intervention-events.md`
- [x] `brioela-specs/46-acoustic-cooking-intelligence.md`
- [x] `brioela-specs/10-mira-cooking-voice.md` § Acoustic Awareness
- [x] `brioela-specs/11-live-vision-cooking-coach.md` § Acoustic Evidence Fusion
- [x] `_records/connections/29-acoustic-cooking-connections.md`
- [x] `_records/build-order/30-layer-acoustic-cooking.md`
- [x] `_records/session-log/038-breakthrough-wave-ten-new-features.md`
- [x] `_features/39-acoustic-cooking/spec.md`, `build.md`, `status.md`, `draft/` (this migration)

## Infrastructure partial (not acoustic-specific)
- [x] `NormalizedRecipeContent` + `importedStepSchema` (**08**) — no `soundCue` field yet
- [x] `sessions` / `session_turns` schemas (**04**) — cooking session type ready; no Mira host
- [ ] MiraSession DO + Gemini audio (**29**) — prerequisite host
- [ ] MiraSpeechDecisionEngine (**30**) — suppression for user-speaking

## Not shipped
- [ ] `ACOUSTIC_AWARENESS_BLOCK` prompt constant
- [ ] `appendAcousticInstructionBlock` in system instruction assembly
- [ ] `soundCue` on recipe step schema
- [ ] `vision_event` table with `evidence_source`
- [ ] `writeInterventionEvent` Brain handler + Mira RPC
- [ ] Live intervention event recording from cooking session
- [ ] Post-session transcript intervention extraction (fallback for **40**)
- [ ] Learned `sound_cue` writeback after acoustic `step_confirmed`
- [ ] `formatRecipeStepsForSession` with sound cues
- [ ] Acoustic metrics + false-positive assertiveness gate
- [ ] **25** ingestion `sound_cue` authoring helper
- [ ] Acoustic cooking tests

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | **No acoustic prompt block** | `rg ACOUSTIC_AWARENESS backend` — zero |
| G2 | **No `soundCue` on recipe steps** | `normalized.recipe.content.schema.ts` — no field |
| G3 | **No `vision_event` table** | `rg vision_event backend/src` — zero |
| G4 | **No `evidence_source` column** | Same as G3 |
| G5 | **No intervention event types constants** | `rg heat_warning backend` — zero |
| G6 | **No live event write path** | No Mira → Brain intervention RPC; spec **11** table docs-only |
| G7 | **No `appendAcousticInstructionBlock`** | `rg buildSystemInstruction backend` — zero (**29** G12) |
| G8 | **MiraSession host missing** | **29** G1 — cannot inject prompt or receive audio |
| G9 | **Gemini audio path missing** | **29** G6 — no `realtime_input.audio` |
| G10 | **Speech engine unwired** | **30** G1 — user-speaking suppression not in runtime |
| G11 | **No learned cue writeback** | No post-session sound cue handler |
| G12 | **No acoustic metrics** | Spec **46** FP gate — no instrumentation |
| G13 | **No shared acoustic validators** | `shared/validator/acoustic-cooking/` absent |
| G14 | **No acoustic tests** | Zero `acoustic*.test.ts` |
| G15 | **Ingestion does not author cues** | **25** lists **39** as blocker for `sound_cue` |
| G16 | **Growth mirror heat dimension blocked** | **40** blocked-by **39**; needs `vision_event` acoustic rows |
| G17 | **No Acoustic Agent** — correct by design | **12** catalog has no acoustic sub-agent — not a gap to fix |
| G18 | **Ledger layer vs feature number** | `_records/build-order/30-layer-*` ≠ folder **39** |
| G19 | **build-guide folder 33 vs feature 39** | `build-guide/33-acoustic-cooking/` — document only |
| G20 | **Spec 11 `vision_session` table** | Spec mentions separate table; not in backend — reconcile at **11**/**39** implementation |
| G21 | **Chop detection scope** | Not in spec **46** — vision/growth-mirror only; do not implement as acoustic |
| G22 | **29 acceptance excludes acoustic** | **29** build.md: no acoustic taxonomy until **39** wired |

# 39 vs neighbor boundaries

| In **39** (this feature) | In separate feature |
|---|---|
| Acoustic awareness system-instruction block | MiraSession DO + PCM transport (**29**) |
| `sound_cue` schema + session injection | `buildCookingMiraScene` (**29**) |
| `evidence_source` + acoustic event labeling | JPEG frame pipeline (**29**/**11**) |
| Intervention taxonomy (5 acoustic types) | Visual-change detector (**30** module 2) |
| Learned cue writeback contract | Session end fiber (**29**), recipe tools (**08**) |
| Mic honesty prompt rules | RealtimeKit mobile join (**29**) |
| Fusion semantics (`fused` label) | Vision tier toggle (**11**/**43**) |
| Chef+ ships-with-audio placement | Pricing enforcement (**43**) |
| — | **Acoustic Agent DO** — does not exist |
| — | Brain sub-agents (**12**) |
| — | `soundClassify` / DSP — out of scope |

### 39 vs 29 (authoritative)

- **29** = host runtime, audio bytes to Gemini, instruction assembly **hook**.
- **39** = acoustic **content** on same stream — prompt, cues, events. Not a separate DO or connection.

### 39 vs 30 (authoritative)

- **30** = proactive `[KITCHEN OBSERVATION]` loop, suppression, visual JPEG diff.
- **39** = tells Gemini how to use kitchen **audio** already on the wire. No new engine module.

### 39 vs 12 (authoritative)

- **12** = three Brain child agents only. Acoustic is **not** cataloged as a sub-agent. Prompt augmentation on MiraSession.

# Blocked by

- **29-cooking-session** — MiraSession, Gemini audio, `buildSystemInstruction` hook (G7, G8, G9)
- **30-mira-speech-engine** — user-speaking suppression in live runtime (G10)
- **04-brain-foundation** — migrations for `vision_event` (G3)
- **08-brain-recipe-tools** — recipe step schema + update path for learned cues (G2, G11)
- **11-brain-sessions-lifecycle** — `session_id` FK contract (soft)

# Blocks

- **40-growth-mirror** — acoustic heat-control evidence dimension (G16)
- **29-cooking-session** — G34 acoustic integration acceptance
- **25-recipe-ingestion** — `sound_cue` authoring at import (soft — risk-only acoustic works without cues)

# Obsolete ledger entries

| Ledger | Issue |
|---|---|
| `_records/build-order/30-layer-acoustic-cooking.md` | "Layer 30" ≠ feature **39** |
| `build-guide/33-acoustic-cooking/00-overview.md` Depends On `08-cooking-session` | Maps to **29** cooking-session |
| `build-guide/33-acoustic-cooking/00-overview.md` What Depends On `32-in-store-copilot` | Folder **32** = in-store **45** in `_features/` — clarity only, no acoustic in stores |

# Ambiguous / conflicting sources

1. **`vision_event` write trigger:** Spec **46** stores derived events; build-guide does not specify tool vs transcript extraction. **Resolution: ship Brain RPC `writeInterventionEvent` from Mira on model intervention; post-session extraction as fallback for **40** (G6).**
2. **Acoustic vs observation loop:** Model may speak on heard sizzle without `[KITCHEN OBSERVATION]` tick. **Resolution: **39** system instruction governs; **30** governs 1 Hz observation prompts only (spec § Interaction with **30**).**
3. **Client-direct Gemini (spec 10):** Conflicts with DO architecture. **Resolution: acoustic block assembled in MiraSession DO per **29** choice.**
4. **Separate `vision_session` table (spec 11):** May be redundant with `sessions`. **Resolution: implement `vision_event` FK to `sessions.session_id`; defer `vision_session` unless **11** migration requires it (G20).**
5. **Chef tier vs separate gate:** Spec **46** — capability of audio session, not new SKU flag. **Resolution: no **43** feature flag beyond existing Mira audio entitlement.**

# Draft count

**12** files in `draft/` (11 production snapshots + `gap-index.md`).

# Sources

- `build-guide/33-acoustic-cooking/` (all 4 files)
- `brioela-specs/46-acoustic-cooking-intelligence.md`
- `brioela-specs/10-mira-cooking-voice.md`, `11-live-vision-cooking-coach.md`, `32-grandma-style-flavor-profile.md`, `53-growth-mirror.md`, `19-pricing-and-tiers.md`
- `build-guide/08-cooking-session/03-gemini-live-session.md`, `build-guide/40-growth-mirror/01-skill-evidence-extraction.md`
- `implementable-specs/cooking-session/03-gemini-session.md`, `10-human-behaviors.md`, `mira-speech-decision-engine/06-suppression-rules.md`
- `_records/connections/29-acoustic-cooking-connections.md`, `_records/build-order/30-layer-acoustic-cooking.md`, `_records/session-log/038-breakthrough-wave-ten-new-features.md`, `_records/connections/36-growth-mirror-connections.md`
- `_features/29-cooking-session/`, `_features/30-mira-speech-engine/`, `_features/12-brain-sub-agents/`, `_features/25-recipe-ingestion/`, `_features/40-growth-mirror/`
- `backend/src/agents/brain/_schemas/normalized.recipe.content.schema.ts`
