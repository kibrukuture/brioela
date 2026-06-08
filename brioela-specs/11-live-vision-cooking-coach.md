# 11. Live Vision Cooking Coach

## Goal

Use live camera input during cooking so the AI agent can see what the user is doing and intervene only when visual context meaningfully improves the outcome — heat warnings, technique corrections, step confirmations.

## User Outcome

- Prop the phone up in the kitchen, camera facing the cooking area.
- Cook normally.
- Hear the AI speak only when it sees something worth mentioning.
- Never feel watched or managed — the camera is a tool, not surveillance.

## In Scope

- Sparse frame sampling sent to the AI model.
- Joint reasoning over visual state plus current recipe step plus voice transcript.
- Critical intervention logic (heat, timing, technique).
- Step completion confirmation from visual evidence.

## Out of Scope

- Continuous video recording or archive.
- Frame-by-frame narration.
- Generic kitchen surveillance.
- Nutrition analysis from the cooked plate (separate feature area, not here).

## AI Model: Gemini Live (Same Live Model as Voice)

This feature uses the same `gemini-3.1-flash-live-preview` session as spec 10. There is no separate vision model. Gemini Live processes audio and video frames in the same model session simultaneously — it hears the user speak and sees the camera frames at the same time, in one model.

This is not "duct-taped" vision. It is native multimodal: the model's response integrates both what it hears and what it sees in the same reasoning pass.

## Video Frame Specs (Gemini Live)

- Format: JPEG or PNG.
- Max resolution: 768 × 768 pixels (client downsizes before sending).
- Max rate: 1 frame per second. Brioela sends 1 frame every 2–4 seconds by default (lower than the maximum to reduce cost).
- The model does not need high FPS to detect meaningful cooking state changes.

## Cost Model

- Audio + video session: ~$0.051/min (258 video tokens/sec + 25 audio tokens/sec at $3/M tokens).
- This is approximately 11× more expensive than audio-only.
- Vision-on sessions are strictly premium-tier.
- The client may offer a "vision on/off" toggle within the session so users can manage cost.

## When the Model Should Speak (Intervention Logic)

The system prompt injected at session start instructs the model:

- Do not narrate every frame. Silence is correct most of the time.
- Speak only when visual evidence is strong enough to be actionable.
- Prioritize: heat warnings, about to burn, oil not hot enough yet, wrong texture for this step, incorrect chopping size for the recipe, step clearly completed (confirm and advance).
- Never repeat an observation already stated in the last 60 seconds.
- Trust the user's skill unless the evidence is unambiguous.
- A missed intervention is better than a false positive.

## Frame Sampling Strategy

- Frames are sampled client-side on a timer.
- Rate adjusts with recipe phase: low rate during preparation steps, slightly higher during active heat steps.
- Frames are not stored on the server. Only the derived events from the model's response are stored.
- The client can pause frame sending if the camera view is obstructed or clearly off-target.

## Integration with Voice Session

Vision mode is an extension of the voice session, not a separate session. The same Gemini Live WebSocket carries both audio and video input. The same Mira session runtime manages session state. There is no second connection to open. The user can have a conversation via voice while the camera watches at the same time — one MiraSession with one scene handling both inputs simultaneously.

## Data Model

- `vision_session`: session_id (same as voice session_id), user_id, recipe_id, started_at, ended_at, frames_sent_count.
- `vision_event`: session_id, event_type (heat_warning, step_confirmed, technique_note, generic_intervention), confidence, created_at.
- No raw frame data is stored. Events only.

## Technical Constraints

- Raw media is never persisted. Frames go from client → Gemini Live → derived events only.
- Session cost must be visible to the user before enabling vision mode (show estimated cost for session length).
- Vision is disabled for free and basic tiers.

## Success Metrics

- Useful intervention rate (interventions the user did not dismiss immediately).
- False positive rate (interventions dismissed within 2 seconds — proxy for wrong/annoying).
- Vision session completion rate vs. voice-only completion rate.
- Premium conversion rate among users who try a vision session.
