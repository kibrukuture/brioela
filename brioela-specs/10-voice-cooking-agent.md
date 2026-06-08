# 10. Voice Cooking Agent

## Goal

Provide a hands-free, conversational cooking assistant that guides a user through a recipe in real time using voice only, without any typed interaction.

## User Outcome

- Start cooking a recipe.
- Ask natural questions: "what's next", "how long does this simmer", "can I use butter instead of oil".
- Receive short, context-aware spoken responses.
- Agent stays silent unless addressed or a critical issue requires it.

## In Scope

- Real-time full-duplex voice session.
- Recipe-step tracking.
- Ingredient substitution reasoning.
- User allergy and preference enforcement.
- Step resumption after interruption.

## Out of Scope

- Camera-based visual cooking detection (that is spec 11).
- Multi-person room coordination (that is spec 12).

## AI Model: Gemini Live

This feature uses `gemini-3.1-flash-live-preview` exclusively. Reasons:

- Full-duplex: Gemini Live hears the user and produces audio simultaneously in a single model. There is no separate STT → LLM → TTS pipeline to assemble or maintain.
- Barge-in: the user can interrupt mid-response and the model recognizes it as a correction or question, not noise.
- `thinkingLevel`: set to `minimal` for ambient step-by-step questions (lowest latency, fastest response). Raise to `low` or `medium` if the user asks a complex technique or substitution question.
- Knows when to shut up: the model does not monologue. It answers what was asked and stops.
- Affective dialogue: model interprets tone, emotion, and pace from raw audio. If a user gets frustrated mid-cook, it de-escalates and adjusts its tone. This is native to the model, not a feature you build.

## Session Initialization

At session start, the CookingAgent DO builds a context payload from the Brain DO and injects it as the Gemini Live system instructions:

- User name.
- Hard allergies (full ingredient list — model must never suggest anything matching these).
- Active dislikes and dietary identity.
- Full recipe with steps, quantities, and timing.
- Any previously noted preferences about this recipe or cuisine.

This means the model already knows the user and the recipe before the first word is spoken. No onboarding conversation inside the session.

## Mid-Session Context Push

If something changes during the session — product scan result arrives, a step is manually advanced, the timer fires, an allergy match is detected in a suggested substitution — the CookingAgent DO pushes a text update into the live Gemini WebSocket via `send_realtime_input`. The model integrates this without interrupting the conversation unless an action is required.

## Session Transport

- For single-user sessions: the client connects directly to Gemini Live via WebSocket. Audio input and output are handled client-side. Session lifecycle (start, end, resume) is managed via the Cloudflare Worker + CookingAgent DO.
- Multi-user sessions go through Cloudflare Realtime / RealtimeKit (see spec 12).

## Audio Specs (Gemini Live)

- Input: 16-bit PCM, 16kHz, little-endian.
- Output: 16-bit PCM, 24kHz, little-endian.
- The mobile SDK handles format conversion automatically.

## Session State (Held in CookingAgent DO)

- Current recipe reference and resolved step list.
- Current step index.
- Active timers and their remaining durations.
- Approved substitutions already discussed this session.
- User food constraints (copied from Brain DO at session start).
- Transcript accumulation for post-session memory write.

## Session Persistence and Resume

If a session is interrupted (phone lock, app background, connection drop), the CookingAgent DO holds state. On reconnect, the session resumes at the last confirmed step. The model is re-initialized with the current state injected as system context so the conversation can continue naturally.

## Cost Model

- Audio-only voice session: ~$0.0045/min (Gemini Live pricing at 25 input tokens/sec).
- Sessions must have an inactivity timeout (e.g., 10 minutes of silence) to avoid runaway charges on abandoned sessions.
- Idle session detection: if no audio detected for N minutes, pause billing and hold state in DO.

## Tier Restriction

Voice cooking agent is available on paid tiers only. The specific tier cutoff is defined in spec 19. Free tier may access recipe content but not the live voice session.

## Post-Session Memory Write

When the session ends, the CookingAgent DO fires a summarization job to Upstash Workflow. The workflow: compiles the full transcript, extracts any new preference signals, identifies steps that caused confusion, logs recipe completion or abandonment, and writes durable facts to the Brain DO's SQLite. These facts improve the next session automatically.

## API Surface

- `POST /api/cooking/voice/session` — start a new voice session, returns session_id and Gemini WebSocket connection parameters.
- `POST /api/cooking/voice/events` — push a mid-session update from the CookingAgent DO into the live session.
- `POST /api/cooking/voice/end` — close the session and trigger the post-session summarization workflow.

## UX Constraints

- The agent does not speak first after session start. It waits.
- Responses are short — one or two sentences maximum unless the user explicitly asks for a full explanation.
- If the user says nothing for the duration of a step, the agent does not narrate. It waits to be asked.
- Critical safety or allergy warnings override the silence rule — these interrupt immediately.

## Success Metrics

- Session completion rate (recipe cooked to last step).
- Average session length.
- Steps completed with agent assistance per session.
- Inactivity timeout rate (proxy for abandoned sessions burning cost).
- Post-session memory facts written per session.
