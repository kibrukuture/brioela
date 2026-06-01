# 10. Voice Cooking Agent

## Goal
Provide a hands-free, conversational cooking assistant that guides a user through a recipe in real time without forcing typed interaction.

## User Outcome
- Start a recipe.
- Ask natural questions such as "what's next" or "can I substitute this".
- Receive short, context-aware responses.

## In Scope
- Realtime voice session.
- Recipe-step tracking.
- Ingredient substitution logic.
- User preference and allergy awareness.

## Out of Scope
- Camera-based action detection.
- Multi-person room coordination.

## Session State
- Current recipe.
- Current step index.
- Timer references.
- Allowed substitutions.
- User food constraints.

## Technical Design
- Voice transport via realtime provider.
- Session context seeded from personal memory and current recipe.
- Transcript events emitted back to the per-user orchestrator.
- Session state persisted so the user can resume after interruption.

## API Surface
- `POST /api/cooking/voice/session`
- `POST /api/cooking/voice/events`
- `POST /api/cooking/voice/end`

## Cost Constraints
- Voice runtime cost must support tiered or metered pricing.
- Sessions need maximum idle windows and explicit end conditions.

## UX Constraints
- The agent should stay silent unless asked or a critical warning is necessary.
- Responses should be short by default.

## Success Metrics
- Session completion rate.
- Average voice session length.
- Number of recipe steps completed with agent assistance.
