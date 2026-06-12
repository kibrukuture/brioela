# Status

open

**Mira speech engine not shipped.** Implementable specs and build guides are complete (docs only). Zero production code for `MiraSpeechDecisionEngine`, six sub-modules, or `MiraScene` contract types. Engine integration blocked on **29** MiraSession host.

# Shipped in backend (partial — none for **30**)

- [ ] `MiraScene` / `MiraSpeechPolicy` types
- [ ] `MiraSpeechDecisionEngine` facade
- [ ] `SilenceTracker`
- [ ] `VisualChangeDetector`
- [ ] `AdaptiveFrequency` controller
- [ ] `PromptBuilder` (speech observation prompts)
- [ ] `ResponseFilter` + no-repeat memory
- [ ] `SuppressionRules`
- [ ] JPEG downsample helper
- [ ] PCM VAD helper
- [ ] Engine unit tests
- [ ] MiraSession `speechEngine` integration (**29** G13)

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `mira-speech-decision/` module | `rg mira-speech-decision backend/src` — zero |
| G2 | No `MiraSpeechDecisionEngine` class | `rg MiraSpeechDecisionEngine backend` — zero |
| G3 | No `MiraScene` types in TypeScript | `rg MiraScene backend/src` — zero |
| G4 | No `SilenceTracker` | `rg SilenceTracker backend` — zero |
| G5 | No `VisualChangeDetector` | `rg VisualChangeDetector backend` — zero |
| G6 | No speech engine tests | No `mira-speech*.test.ts` |
| G7 | No `mira.scene.contract.ts` | Glob `backend/src/agents/mira` — folder missing |
| G8 | MiraSession host missing | **29** G1 — cannot integrate tick/hooks |
| G9 | No JPEG downsample helper | `rg downsampleJpeg backend` — zero |
| G10 | No PCM VAD helper | Local VAD required per `01-silence-tracker.md` |
| G11 | build-guide vs implementable drift | `04-mira-speech-decision-engine.md` thresholds differ from `mira-speech-decision-engine/` — **30** follows implementable |
| G12 | Cooking phase mapping undocumented in code | `CookingSituation` vs `CookingPhase` — spec only |
| G13 | Bela shopper architecture conflict | `implementable-specs/bela/14` vs `30-mira` MiraSession scene — **42** must reconcile |
| G14 | brioela-spec 10 client-direct transport | Conflicts with DO-proxied engine host — **29** choice authoritative |
| G15 | `buildCookingMiraScene` in **29** not **30** | Types in **30**, builder in **29** G12 |
| G16 | Human behaviors not in engine | `10-human-behaviors.md` — **29** system instruction, **30** enforces cooldowns |
| G17 | Acoustic speech rules unwired | **39** blocked on **29**; **30** suppression applies when integrated |
| G18 | In-store co-pilot scene kind missing | **45** reuses Mira runtime but no `MiraSceneKind` enum entry |
| G19 | Session log 007 stale filename | `03-mira-speech-decision-engine.md` referenced — actual `04-` |
| G20 | 29 draft defers sub-components to **30** | `_features/29-cooking-session/draft/mira.speech.decision.engine.gap.md` — partial only |

# 30 vs neighbor boundaries

| In **30** (this feature) | In separate feature |
|---|---|
| `MiraScene` contract types + `MiraSpeechPolicy` | `buildCookingMiraScene` (**29**) |
| `MiraSpeechDecisionEngine` + 6 modules | MiraSession DO + Gemini bridge (**29**) |
| Observation prompts (`[KITCHEN OBSERVATION]`) | `BrioelaIdentity` + human behavior blocks (**10**, **29**) |
| `CookingPhase` for speech frequency | `CookingSituation` Zod + DO phase transitions (**29**) |
| Response filter + suppression | Transcript turn writes (**29** + **11**) |
| Scene-agnostic speech policy types | `buildBelaShopperMiraScene` (**42**) |
| Visual change for cooking JPEG | Acoustic cue taxonomy (**39**) |

# Blocked by

- **29-cooking-session** — MiraSession host for integration (engine module can ship standalone first, but acceptance needs host)

# Blocks

- **29-cooking-session** — speech integration acceptance (G13 in **29**)
- **42-bela** — `bela_shopper` scene on shared contract
- **28-map**, **25-recipe-ingestion**, **44-kids-mode**, **45-in-store-copilot** — scene builders consuming `MiraScene`

# Sources

- `implementable-specs/cooking-session/mira-speech-decision-engine/` (7 files)
- `implementable-specs/cooking-session/03-gemini-session.md`, `10-human-behaviors.md`
- `build-guide/30-mira/` (2 files)
- `build-guide/08-cooking-session/04-mira-speech-decision-engine.md`
- `brioela-specs/10-mira-cooking-voice.md`, `11-live-vision-cooking-coach.md`
- `_features/29-cooking-session/spec.md`, `build.md`, `status.md`
- `_records/connections/03-cooking-session-connections.md`
