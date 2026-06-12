# Acoustic Cooking — Spec

Feature **39**. Kitchen-sound intelligence inside existing Mira Gemini Live audio sessions: acoustic awareness system-instruction block, optional per-step `sound_cue` on recipe steps, intervention event taxonomy with `evidence_source` labeling on `vision_event`, acoustic–visual fusion in multimodal sessions, post-session learned-cue writeback, and metrics that gate prompt assertiveness.

**Not in this feature:** a separate Agent DO or Brain sub-agent (**12** catalog has no acoustic agent); any new audio pipeline, DSP layer, or on-device sound classifier; raw audio storage; passive/always-on microphone; smoke/fire/gas safety-device claims; chop/knife-work detection (vision + **40** growth mirror); MiraSession DO transport, RealtimeKit, SFU adapters, Gemini WebSocket bridge (**29**); `MiraSpeechDecisionEngine` suppression/frequency module (**30**); recipe ingestion normalization bodies (**25** — may author `sound_cue` at import); generational style extraction (**32**/**49** — acoustic half of instinct→checkpoint); vision frame pipeline and visual-change detector (**29**/**30** module 2); guard/lexicon/reading-gate tooling.

**Living catalog note:** Acoustic intervention uses the spec **11** event vocabulary extended with `evidence_source`. Event types are product strings on `vision_event.event_type` — not a closed SQL enum beyond `evidence_source` check constraint.

---

## Purpose

Spec **11** detects cooking state through sparse video frames (~11× more expensive than audio-only per spec **24** cost model). Gemini Live already receives the full kitchen soundscape on every voice session (spec **10**, spec **24** native affective dialogue) — but no spec instructed the model to treat non-speech kitchen sound as cooking evidence.

**39** closes that gap on the **same** Gemini Live connection:

1. **Prompt** — acoustic awareness block in session system instructions (calibrated to current recipe step; silence-first; anti-nag).
2. **Recipe** — optional `sound_cue` per step for acoustic checkpoints (whistle counts, simmer reached, sizzle subsided).
3. **Events** — derived intervention rows on `vision_event` with `evidence_source: visual | acoustic | fused`.
4. **Honesty** — mic-distance proxy; no pretending to hear a distant pan.

Without **39**, audio-only Chef sessions are conversationally blind to boil-overs, scorch onset, and sound-marked technique checkpoints — the strongest honest answer to "do I need the vision tier?" stays weaker.

---

## Product definition

| Term | Meaning |
|---|---|
| **Acoustic cooking intelligence** | Treating non-speech kitchen sound as cooking-state evidence inside an active Mira session |
| **Acoustic awareness block** | System-instruction section assembled at Gemini connect time |
| **Sound cue** | Optional natural-language per-step field describing expected/completion sounds |
| **Acoustic intervention** | Mira speaks unprompted because sound evidence crosses the spec **11** bar |
| **Evidence source** | Which sense produced the intervention: `visual`, `acoustic`, or `fused` |
| **Risk intervention** | heat_warning, boil_over_warning, burning_onset, abnormal_silence — works without `sound_cue` |
| **Acoustic step confirmation** | `step_confirmed` when a step's `sound_cue` signature is reached |
| **Fusion** | Same Gemini reasoning pass combines audio + JPEG frames in audio+vision sessions |
| **Mic honesty** | Lower acoustic confidence / explicit "can't hear the pan" when signal is weak |
| **False-positive gate** | Dismiss-within-2s rate controls how assertive the acoustic prompt may become |

**Design principle (non-negotiable):** Zero new transport, zero new model calls. The audio already flows to Gemini Live. This feature is system-instruction content, recipe schema extension, and event labeling.

**Not acoustic (explicit):** Knife chop detection is **vision** (spec **11**, growth mirror knife-work dimension). Timer beeps are **MiraSession timer inject** (**29**), not acoustic taxonomy. There is no `chop_detected` acoustic event in spec **46**.

---

## Complete component inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/33-acoustic-cooking/`, `brioela-specs/46-acoustic-cooking-intelligence.md`, `backend/src/`, `shared/`, `mobile/`, neighbor `_features/29`, `30`, `12`, `25`, `40`, `43`.

| Component | Type | In **39**? | Shipped? | Owner / trigger | Primary sources |
|---|---|:---:|:---:|---|---|
| **Phone mic → RealtimeKit WebRTC** | Mobile transport | **Cross — 29** | No | User starts cooking session | `build-guide/08-cooking-session/01-room-lifecycle.md` |
| **SFU PCM adapter → MiraSession** | Audio ingress | **Cross — 29** | No | Published mic track | same |
| **Gemini `realtime_input.audio`** | Model ingestion | **Cross — 29** | No | PCM 48kHz base64 | `03-gemini-live-session.md` |
| **Acoustic awareness prompt block** | System instruction | **Yes** | No | `buildSystemInstruction` at connect | `build-guide/33-acoustic-cooking/01-prompt-extension.md` |
| **Recipe `sound_cue` field** | Steps JSON / Zod | **Yes** | No | Optional per `importedStepSchema` | `02-sound-cues-schema.md` |
| **Session payload sound cues** | Context injection | **Yes** | No | Active recipe at session start | spec **46** |
| **Intervention taxonomy** | Product constants | **Yes** | No | 5 acoustic event types + shared spec **11** types | `03-intervention-events.md` |
| **`vision_event` + `evidence_source`** | Brain SQLite | **Yes** | No | Derived events only; no raw audio | spec **11**, **46** |
| **Event write path (live)** | Mira → Brain RPC | **Yes** | No | On intervention / tool hook TBD | gap G6 |
| **Acoustic–visual fusion** | Model behavior | **Yes** | No | Same Gemini session; `fused` label | spec **46** § With Vision On |
| **User sound questions** | Reactive turn | **Yes** | No | "Does this sound right?" — native barge-in | spec **46** |
| **Barge-in / user speech priority** | Native Gemini | **Cross — 29/24** | No | User speech wins over ambient | spec **46** Technical Constraints |
| **Silence / anti-nag (60s)** | System instruction | **Yes** | No | Same bar as spec **11** | spec **46** |
| **Speech suppression when user talking** | **30** engine | **Cross** | No | Hard block in `SuppressionRules` | `06-suppression-rules.md` |
| **25s post-Gemini cooldown** | **30** engine | **Cross** | No | Applies to acoustic-triggered speech too | **30** spec conflicts table |
| **Visual change detector** | **30** module 2 | **No — 30** | No | JPEG diff; parallel to acoustic | `02-visual-change-detector.md` |
| **Learned cue writeback** | Post-session | **Yes** | No | After acoustic `step_confirmed` | `02-sound-cues-schema.md` § Learned |
| **Ingestion-authored cues** | **25** consumer | **Cross** | No | Import/reconstruction when source implies sound | **25** status blocks **39** |
| **Generational capture cues** | **32**/**49** consumer | **Cross** | No | "You'll hear when it's ready" extraction | spec **32** spoken instincts |
| **Growth mirror heat-control evidence** | **40** consumer | **Cross** | No | `heat_warning` + `burning_onset` per active-heat minute | `build-guide/40-growth-mirror/01-skill-evidence-extraction.md` |
| **Chef+ tier (with audio session)** | Entitlement | **Cross — 43/19** | Partial schema | Not separately gated; ships with Mira audio | spec **46** Tier Placement |
| **Acoustic metrics** | Observability | **Yes** | No | FP rate gates prompt assertiveness | `03-intervention-events.md` |
| **Passive listening** | — | **No — forbidden** | — | No session = no mic | spec **20** platform rule |
| **Acoustic Agent DO** | — | **No — forbidden** | — | Not in **12** catalog | user boundary |

### Shipped in repo today (acoustic-related)

- `build-guide/33-acoustic-cooking/` — **4 files complete** (docs only).
- `brioela-specs/46-acoustic-cooking-intelligence.md` — primary spec.
- `brioela-specs/10-mira-cooking-voice.md` § Acoustic Awareness; `11-live-vision-cooking-coach.md` § Acoustic Evidence Fusion.
- `_records/connections/29-acoustic-cooking-connections.md`, `_records/build-order/30-layer-acoustic-cooking.md`.
- `_records/session-log/038-breakthrough-wave-ten-new-features.md` — feature listed; acoustic events = `vision_event` + `evidence_source`.
- `normalized.recipe.content.schema.ts` — steps without `sound_cue` field.
- **`rg 'acoustic|sound_cue|soundCue|evidence_source|vision_event' backend/src shared/ mobile/`** — zero product matches.

---

## Architecture

```text
Mobile mic
    │
    ▼
RealtimeKit WebRTC ──► Realtime SFU PCM adapter ──► MiraSession DO (**29**)
                                                        │
                                                        ├── realtime_input.audio ──► Gemini Live (unchanged path)
                                                        │
                                                        ├── system_instruction += acoustic awareness block (**39**)
                                                        │     └── recipe steps include sound_cue when present (**39**)
                                                        │
                                                        ├── [optional vision] client_content JPEG (**29**/**11**)
                                                        │     └── fusion in one Gemini reasoning pass (**39**)
                                                        │
                                                        ├── MiraSpeechDecisionEngine (**30**)
                                                        │     ├── hard block: user speaking
                                                        │     └── 25s / 60s suppression reinforces acoustic anti-nag
                                                        │
                                                        └── intervention derived ──► Brain RPC write vision_event (**39**)
                                                                  evidence_source: visual | acoustic | fused

Post-session (**29** end fiber + **39**):
  acoustic step_confirmed ──► optional learned sound_cue writeback on recipe (**08** update path)
  vision_event + transcript ──► **40** skill_evidence extraction (heat control dimension)
```

**Critical boundary:** Acoustic intelligence is **not** a parallel audio classifier. Gemini Live natively interprets the soundscape; **39** instructs the model how to use it for cooking. No `soundClassify()` DSP, no second WebSocket, no Brain child agent.

---

## User outcomes (what the cook experiences)

- User cooks with a normal Mira voice session. Phone on the counter. No camera required.
- Mira stays silent by default — same as spec **10**.
- Pan too hot before garlic: unprompted — *"That pan sounds too hot — give it a moment before the garlic."*
- Pot climbing toward boil-over while user chops: *"Your pot's about to boil over."*
- User asks: *"Does this sound right to you?"* — Mira answers from what it hears.
- Pressure-cooker recipe: whistle count tracked when step carries a `sound_cue`.
- With camera on: sound may trigger intervention seconds before sparse frames show it — same intervention tone, stronger fused evidence.

---

## Acoustic awareness block (system instruction)

Assembled at connect time via the same context-payload path as identity, constraints, memory, and human behaviors (**29** `buildSystemInstruction`). Present in **voice-only** (spec **10**) and **audio+vision** (spec **11**) sessions.

**Content requirements** (from `01-prompt-extension.md` / spec **46**):

- You hear the kitchen, not only the user. Cooking sounds are state evidence.
- Silence remains the default. Speak on sound only when evidence is strong and consequence is real — spec **11** bar.
- Never narrate sounds. Say what you hear only if it changes what the user should do, or they asked.
- Calibrate against the **current recipe step index** — hard sizzle correct for sear, wrong for sweat.
- Never repeat an acoustic observation within **60 seconds**.
- Weight acoustic evidence lower when phone is clearly far from cooking (speech echo/level as proxy).
- If asked to listen and signal isn't there: honest answer — *"I can't hear the pan well from here — move the phone closer."*
- Earbuds: pan sounds may be inaudible — do not pretend otherwise.
- Possible smoke alarm: relay as *"that might be a smoke alarm — check"* — never claim detection reliability.
- Barge-in unchanged: user speech always wins (**24** native behavior).

**Assertiveness gate:** If acoustic false-positive rate (dismissed within 2s) climbs, prompt gets **quieter**, not smarter-sounding (`01-prompt-extension.md` Rule).

---

## Recipe sound cues

### Schema

Recipe steps JSON gains one optional field on each step:

```text
sound_cue: string | null
-- natural language only; no enum
-- e.g. "medium sizzle, steady; done when the popping fades"
-- e.g. "count three whistles, then off the heat"
```

**Rule:** A cue describes **sound**, never temperature or time. "Until it sounds dry" is a cue; "8 minutes at medium" stays in `instruction` / `durationMinutes`.

### Sources (order of arrival)

1. **Authoring at ingestion/reconstruction** (**25**, spec **02**, generational capture spec **13**, Encore spec **44**) when source material implies sound.
2. **Generational capture extraction** (**32**) — spoken instincts → observable checkpoints; sound cues are the acoustic half.
3. **Learned from sessions** — when Mira acoustically confirms a step (`step_confirmed`), post-session workflow may write back a learned cue on that recipe.

### Injection

Cues ride with the recipe in the session payload at start. Steps without cues: **risk interventions only** (no acoustic checkpoint).

---

## Intervention taxonomy

Reuses spec **11** event vocabulary. Acoustic-specific mapping:

| `event_type` | Acoustic evidence | Mira behavior |
|---|---|---|
| `heat_warning` | Crackle pitch/density beyond step's call | Immediate, short: "sounds too hot" |
| `boil_over_warning` | Boil intensity climbing toward overflow | Immediate |
| `burning_onset` | Sizzle character shifting toward scorch | Immediate |
| `step_confirmed` | Step's `sound_cue` signature reached | Confirm and advance (same flow as visual) |
| `abnormal_silence` | Active-heat step gone quiet unexpectedly | One gentle check: "did the pan lose heat?" |

Shared spec **11** types (`technique_note`, `generic_intervention`) may also carry `evidence_source: acoustic` when sound-driven.

**Not in taxonomy:** `chop_*` events (vision); timer-fired speech (**29** timer inject); standalone narration of ambient sound.

### Fusion (audio + vision sessions)

Evidence fuses in the **same** Gemini Live reasoning pass. Sound often leads vision (boil-over audible before visible at 1 frame / 2–4s). Store `evidence_source = 'fused'` when both senses contributed. Intervention **rules unchanged** — evidence stronger.

---

## Data model

**No new tables.**

### `vision_event` (extended)

| Column | Type | Notes |
|---|---|---|
| `session_id` | text | Same as cooking session |
| `event_type` | text | Taxonomy above |
| `confidence` | real | Model-estimated; mic-honesty affects threshold |
| `evidence_source` | text | `check(evidence_source in ('visual','acoustic','fused'))` |
| `created_at` | integer | Unix ms |

No raw audio. Derived events only — identical to no-raw-frames rule (spec **11**).

### Recipe steps JSON

Optional `sound_cue` on each step inside `NormalizedRecipeContent.steps[]` (**08** schema extension).

---

## Interaction with Mira speech engine (**30**)

Acoustic interventions produce **Gemini speech**. The speech engine governs **when proactive observation prompts fire** — not the model's direct acoustic reactions to kitchen sound.

| Concern | Owner |
|---|---|
| User speaking → no proactive observation tick | **30** `SuppressionRules` hard block |
| Gemini currently speaking | **30** hard block |
| 25s after Gemini spoke | **30** soft block (urgency bypass for visual; acoustic risk may still speak via **model-initiated** turn — reconcile at integration) |
| 60s no-repeat acoustic observation | **39** system instruction (+ **30** `NoRepeatMemory` for observation prompts) |
| Visual urgency bypass | **30** module 2 — parallel path; acoustic boil-over may be heard before JPEG urgency |

**Authoritative split:** **39** owns *what* Gemini is allowed to infer from kitchen audio (system instruction + cues). **30** owns *proactive observation loop* timing/suppression for `[KITCHEN OBSERVATION]` ticks. Native acoustic interventions (model speaks because it heard sizzle) follow spec **10** silence rules and **39** acoustic block — not the 1 Hz observation tick.

---

## Tier, privacy, cost

| Topic | Rule |
|---|---|
| **Tier** | Ships wherever Mira **audio** sessions exist — Chef tier and above (spec **19**). Capability upgrade of existing session; **not** separately gated; **no** added per-minute cost (spec **46**). |
| **Vision tier** | Acoustic works audio-only; vision remains better for technique/chop. |
| **Privacy** | Audio streams to live model, never stored (spec **10** / cooking-session). Only derived `vision_event` rows persist. |
| **Passive listening** | Forbidden. No session → no microphone. User-facing copy must state this plainly. |
| **Safety claims** | Not a smoke/fire/gas detector. Relay only; no reliability claims. |

---

## Cross-feature consumers

| Consumer | Uses from **39** |
|---|---|
| **40-growth-mirror** | `heat_warning`, `burning_onset` with `evidence_source` acoustic/fused for heat-control dimension |
| **25-recipe-ingestion** | May author `sound_cue` at normalization |
| **32** / **49** | Instinct→checkpoint extraction may populate `sound_cue` |
| **29-cooking-session** | Instruction assembly hook; must not ship acoustic taxonomy without **39** wiring |

---

## Success metrics

- Useful acoustic intervention rate (not dismissed immediately) — same definition as spec **11**.
- Acoustic false-positive rate (dismissed within 2s) — **gates prompt assertiveness**.
- Acoustic step-confirmation accuracy on recipes with `sound_cue`.
- Boil-over / burn saves per 100 sessions (transcript proxy: "oh!" + action).
- Audio-only session completion rate vs. pre-feature baseline.

---

## Feature boundaries

| In **39** | In separate feature |
|---|---|
| Acoustic awareness system-instruction block | MiraSession DO + audio transport (**29**) |
| `sound_cue` schema + session injection | `buildCookingMiraScene` + situation context (**29**) |
| `evidence_source` on `vision_event` | Vision frame pipeline + sparse JPEG (**29**/**11**) |
| Intervention taxonomy + event labeling | Visual-change detector (**30** module 2) |
| Learned cue writeback contract | Recipe update tool (**08**), session end fiber (**29**) |
| Acoustic metrics + FP gate | Product analytics infra (**01**) |
| Mic honesty instructions | RealtimeKit AGC reality (**29** mobile) |
| Fusion semantics | Camera toggle + tier gate for vision (**11**/**43**) |
| Chef+ placement (with audio) | Pricing enforcement helpers (**43**) |
| — | **Acoustic Agent DO** — **does not exist** |
| — | Brain sub-agents (**12**) — catalog only |
| — | `soundClassify` / DSP classifier — **out of scope** |

### vs **29** (Cooking session)

**29** owns MiraSession, PCM → Gemini, system-instruction **assembly hook**, session lifecycle. **39** owns acoustic **content** inserted into that instruction, `sound_cue` on recipe payload, and `vision_event` labeling. Same audio stream — no second connection.

### vs **30** (Mira speech engine)

**30** owns proactive observation loop, suppression, visual-change gating. **39** does not add engine modules. Acoustic model behavior is prompt-level on the existing audio path. **30** hard-blocks speaking while user talks — applies to all Gemini output including acoustic interventions.

### vs **12** (Brain sub-agents)

**12** ships BrainMaintenanceAgent, BehaviorPatternAgent, SessionContextCompressor only. Acoustic cooking is **not** a fourth sub-agent. No `subAgent()` spawn for sound classification.

### vs **11** (Live vision coach)

**11** owns visual intervention bar and base `vision_event` table. **39** extends with `evidence_source` and acoustic event types on the **same** table and session.

---

## Conflicts and authoritative choices

| Topic | Stale / conflicting sources | **39** choice |
|---|---|---|
| Client-direct Gemini | `brioela-specs/10` § Session Transport single-user client WS | **DO-proxied Gemini** per **29** `00-overview` — acoustic block lands in DO-assembled instruction |
| `vision_event` write path | Not in implementable-specs | **Mira → Brain RPC** on intervention; post-session transcript extraction fallback for **40** (gap G6) |
| build-guide depends on `19-recipe-ingestion` | Folder `19-recipe-ingestion` = feature **25** in `_features/` | **`sound_cue` lands in NormalizedRecipeContent** — **25** authors, **39** consumes |
| build-guide depends on `30-mira` | Folder `30-mira` = speech engine **30** | **30** suppression applies; **39** does not duplicate |
| Chop / knife sounds | User colloquial "chop detection" | **Vision only** (spec **11**, growth mirror knife work) — not acoustic taxonomy |
| Session log 038 folder numbering | `33-acoustic-cooking` build-guide vs feature **39** | **Feature folder 39**; build-guide stays `33-acoustic-cooking/` |
| **29** build acceptance | "No acoustic taxonomy in **29**" | **39** ships acoustic block after **29** host exists |

---

## Sources (read for this migration)

### Primary

- `brioela-specs/46-acoustic-cooking-intelligence.md`
- `build-guide/33-acoustic-cooking/00-overview.md`
- `build-guide/33-acoustic-cooking/01-prompt-extension.md`
- `build-guide/33-acoustic-cooking/02-sound-cues-schema.md`
- `build-guide/33-acoustic-cooking/03-intervention-events.md`

### Cross-spec

- `brioela-specs/10-mira-cooking-voice.md` (§ Acoustic Awareness)
- `brioela-specs/11-live-vision-cooking-coach.md` (§ Acoustic Evidence Fusion, intervention bar)
- `brioela-specs/32-grandma-style-flavor-profile.md` (spoken instincts)
- `brioela-specs/53-growth-mirror.md` (acoustic evidence stream)
- `brioela-specs/19-pricing-and-tiers.md` (Chef+ audio sessions)

### implementable-specs / build-guide (host + speech)

- `implementable-specs/cooking-session/03-gemini-session.md`, `10-human-behaviors.md`
- `implementable-specs/cooking-session/mira-speech-decision-engine/06-suppression-rules.md`
- `build-guide/08-cooking-session/03-gemini-live-session.md`, `00-overview.md`
- `build-guide/40-growth-mirror/01-skill-evidence-extraction.md`

### _features/ (boundaries)

- `29-cooking-session/spec.md`, `build.md`, `status.md`
- `30-mira-speech-engine/spec.md`, `status.md`
- `12-brain-sub-agents/spec.md` (agent catalog — no acoustic agent)
- `25-recipe-ingestion/status.md`, `40-growth-mirror/status.md`

### _records/

- `_records/connections/29-acoustic-cooking-connections.md`
- `_records/build-order/30-layer-acoustic-cooking.md`
- `_records/session-log/038-breakthrough-wave-ten-new-features.md`
- `_records/connections/36-growth-mirror-connections.md`

### Production (grep audit)

- `backend/src/agents/brain/_schemas/normalized.recipe.content.schema.ts` — no `sound_cue`
- `backend/src/`, `shared/`, `mobile/` — zero acoustic/vision_event matches
