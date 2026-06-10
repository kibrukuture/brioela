# 46. Acoustic Cooking Intelligence

## Goal

Make Mira hear the kitchen, not just the cook. During any audio session, the model treats non-speech kitchen sound — the sizzle, the rolling boil, the pressure-cooker whistle, the silence where bubbling should be — as cooking state evidence, and intervenes on it exactly the way the vision coach (spec 11) intervenes on visual evidence.

## Why This Exists

Spec 11 does all cooking-state detection through video frames, which makes it ~11× more expensive than audio (spec 24 cost model: $0.051/min vs $0.0045/min) and gates it to premium tiers. But the architecture backbone already states that Gemini Live "natively interprets tone, emotion, and pace from raw audio" (spec 24) — the model receives the full kitchen soundscape in every audio session today. Nothing in any spec instructs it to treat that soundscape as cooking evidence.

Kitchen sound is information-dense and physically meaningful:

- Oil crackle pitch and density tracks pan temperature.
- A simmer, a boil, and a boil-over have distinct acoustic signatures.
- Searing that goes quiet means the pan lost heat or the food is sticking.
- A pressure cooker's whistle count is literally how billions of people time dishes.
- The change from "wet" to "dry" frying sounds marks moisture cook-off — a real technique checkpoint.

This upgrades the audio-only tier — the volume tier — with a capability that feels like vision at 1/11th the cost. No consumer product has shipped sound-based cooking intervention. It demos unforgettably: the app heard the onions starting to burn.

## User Outcome

- User cooks with a normal Mira voice session (spec 10). Phone on the counter. No camera propped up.
- They cook normally. Mira stays silent, as always.
- The pan gets too hot before the garlic goes in. Mira, unprompted: "That pan sounds too hot — give it a moment before the garlic."
- The pot behind them starts climbing toward a boil-over while they chop. Mira: "Your pot's about to boil over."
- The user asks sound-grounded questions naturally: "Does this sound right to you?" — and Mira answers from what it hears.
- Pressure-cooker recipes can be tracked by whistle count without the user counting.

## In Scope

- Acoustic state awareness inside existing Mira audio sessions (spec 10) and audio+vision sessions (spec 11) — one session, one model, no second connection.
- Intervention on acoustically evident risk: too-hot oil, boil-over, burning onset, abnormal silence during an active-heat step.
- Acoustic step confirmation where the recipe step has a sound signature (whistles counted, simmer reached, sizzle subsided).
- Acoustic checkpoints in recipes: steps may carry sound cues the same way spec 32 translates "until it smells right" into observable checkpoints — "fry until the popping stops" is an instruction the model can verify by ear.
- User-initiated sound questions ("listen — is this simmering or boiling?").

## Out of Scope

- Any new audio pipeline, classifier model, or DSP layer. The capability is prompt- and recipe-level instruction to the same Gemini Live session that already receives the audio.
- Storing raw audio. Nothing changes about audio handling — derived events only, same as spec 11 stores vision events and never frames.
- Smoke/fire/gas detection or any safety-device claim. Brioela is not an alarm. If the model hears what may be a smoke alarm, it says so and tells the user to check — it never claims detection reliability.
- Acoustic monitoring outside an active session. The microphone is never open passively (spec 20 platform rule). No session, no listening. Ever.

## How It Works

### Session Prompt Extension

The Mira session system instructions (assembled at connect time, spec 10) gain an acoustic awareness block:

- You hear the kitchen, not only the user. Treat cooking sounds as state evidence.
- Silence remains the default. Speak on sound only when the evidence is strong and the consequence is real — same bar as visual intervention (spec 11): a missed intervention is better than a false positive.
- Never narrate sounds. Never say what you hear unless it changes what the user should do, or the user asked.
- Calibrate against the recipe step. A hard sizzle is correct during searing and wrong during a gentle sweat. The current step index is your reference for what the kitchen should sound like.
- Never repeat an acoustic observation already made in the last 60 seconds (same anti-nag rule as spec 11).

### Recipe Sound Cues

The recipe schema gains an optional per-step `sound_cue` field: a short natural-language description of what this step should sound like and what marks its completion ("medium sizzle, steady; done when the popping fades"). Sources:

- Authored at recipe reconstruction time (specs 02, 13, 44) when the source material implies it.
- Extracted from generational capture sessions (spec 13) — grandma's "you'll hear when it's ready" is exactly this, and the style extraction (spec 32) already translates spoken instincts into observable checkpoints. Sound cues are the acoustic half of that mechanism.
- Accumulated from the user's own sessions: when Mira acoustically confirms a step, the confirmation can be written back as a learned cue for that recipe.

Sound cues are injected with the recipe at session start. Steps without cues simply have no acoustic checkpoint — the feature degrades to risk-intervention only.

### Intervention Taxonomy

Acoustic interventions reuse the spec 11 event vocabulary with an `acoustic` evidence source:

| Event | Acoustic evidence | Mira behavior |
|---|---|---|
| heat_warning | Crackle pitch/density beyond what the step calls for | Immediate, short: "sounds too hot" |
| boil_over_warning | Boil intensity climbing toward overflow signature | Immediate |
| burning_onset | Sizzle character shifting toward scorch | Immediate |
| step_confirmed | Step's sound_cue signature reached (whistle count, simmer point, popping faded) | Confirm and advance, same flow as visual step confirmation |
| abnormal_silence | Active-heat step gone quiet unexpectedly | One gentle check: "did the pan lose heat?" |

### With Vision On (spec 11 sessions)

In audio+vision sessions, acoustic and visual evidence fuse in the same reasoning pass — that is the entire point of one multimodal model (spec 24). Sound often leads vision: the boil-over is audible seconds before it is visible at 1 frame every 2–4 seconds. The intervention rules do not change; the evidence gets stronger.

## Data Model

No new tables. Acoustic events are `vision_event` rows (spec 11) with an added `evidence_source` column: `visual | acoustic | fused`. Recipe sound cues live in the existing recipe steps JSON as the optional `sound_cue` field.

- `vision_event` (extended): session_id, event_type, confidence, **evidence_source**, created_at.

This keeps one intervention event stream per session regardless of which sense produced it.

## Technical Constraints

- Zero new transport, zero new model calls. The audio already flows to Gemini Live in every voice session (specs 10, 24). This feature is system-instruction content, recipe schema extension, and event labeling.
- Microphone hardware reality: phone mics + AGC are tuned for speech and may compress or gate kitchen background sound. The intervention confidence bar must account for this — the model is instructed to weight acoustic evidence lower when the phone is clearly far from the cooking (speech echo/level as proxy). False-positive rate is the metric that decides how aggressive this gets.
- Earbuds: if the user wears earbuds with the mic on the earbud, pan sounds may be nearly inaudible. Mira must not pretend otherwise — if asked to listen and the signal is not there, the honest answer is "I can't hear the pan well from here — move the phone closer."
- Barge-in unchanged: user speech always takes priority over ambient sound processing (native model behavior, spec 24).

## Tier Placement

Acoustic intelligence ships wherever Mira audio sessions exist — Chef tier and above (spec 19). It is a capability upgrade of the existing audio session, not a separately gated feature, and it adds no per-minute cost. It is also the strongest honest answer to "do I need the vision tier?" — vision remains better; audio is no longer blind.

## Privacy

- No change to the audio data path: audio streams to the live model and is never stored (spec 10/cooking-session rules). Acoustic events store the derived event only.
- No passive listening, no always-on microphone, no session means no audio. This must also be stated plainly in the feature's user-facing description, because "the app listens to your kitchen" invites the question.

## Success Metrics

- Useful acoustic intervention rate (not dismissed immediately) — same definition as spec 11.
- Acoustic false positive rate (dismissed within 2 seconds). This metric gates how assertive the prompt is allowed to be.
- Acoustic step-confirmation accuracy on recipes with sound cues (confirmed step actually complete, per user response).
- Boil-over / burn saves per 100 sessions (interventions where the user audibly acted — "oh!" + action — proxy from transcript).
- Audio-only session completion rate vs. pre-feature baseline (does hearing the kitchen close part of the vision gap?).
