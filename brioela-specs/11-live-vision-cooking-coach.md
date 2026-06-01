# 11. Live Vision Cooking Coach

## Goal
Use camera input during cooking to detect what the user is doing and provide timely correction or confirmation when visual context materially improves cooking guidance.

## User Outcome
- Prop phone in kitchen.
- Let Brioela watch the cooking flow.
- Receive help such as heat warnings, step confirmation, or chop-size feedback.

## In Scope
- Low-frame-rate vision inference for cooking context.
- Joint reasoning over recipe step plus live visual state.
- Critical intervention logic.

## Out of Scope
- Full continuous video recording archive.
- Generic kitchen surveillance.

## Input Channels
- Live camera frames.
- Current recipe and step.
- Voice transcript context.
- User constraints and preferences.

## Processing Model
- Use sparse frame sampling instead of continuous high-FPS analysis.
- Detect state changes, not every frame detail.
- Escalate only when confidence is high or risk is meaningful.

## Data Model
- `vision_session`: session_id, user_id, recipe_id, started_at, ended_at.
- `vision_event`: session_id, event_type, confidence, frame_ref, created_at.

## Technical Constraints
- Vision sessions are compute-expensive and likely premium-only.
- Raw media retention should be minimized.
- Derived events are preferred over media storage.

## Success Metrics
- Number of useful interventions per session.
- False positive rate.
- Premium conversion among users who start vision sessions.
