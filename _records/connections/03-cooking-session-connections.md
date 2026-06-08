# Connections — Cooking Session

spec: implementable-specs/cooking-session/00-overview.md
  → build-guide/08-cooking-session/00-overview.md           [x] done (architecture, CF Realtime decision, component responsibilities)
  → build-guide/08-cooking-session/01-room-lifecycle.md      [x] done

spec: implementable-specs/cooking-session/01-room-lifecycle.md
  → build-guide/08-cooking-session/01-room-lifecycle.md      [x] done (full RealtimeKit API, adapter config, mobile join, teardown)

spec: implementable-specs/cooking-session/02-mira-session.md
  → build-guide/08-cooking-session/02-mira-session-do.md    [x] done

spec: implementable-specs/cooking-session/03-gemini-session.md
  → build-guide/08-cooking-session/03-gemini-live-session.md [x] done (setup, audio, JPEG client_content, reconnect, BLOCKING tools)

spec: implementable-specs/cooking-session/04-tool-protocol.md
  → build-guide/08-cooking-session/03-gemini-live-session.md [x] done (BLOCKING tool call handling, executePendingToolCall)
  → build-guide/08-cooking-session/02-mira-session-do.md    [x] done (forwardToolToBrain)

spec: implementable-specs/cooking-session/05-video-processing.md
  → build-guide/08-cooking-session/03-gemini-live-session.md [x] done (sendVideoFrame, client_content approach)

spec: implementable-specs/cooking-session/06-timers.md
  → build-guide/08-cooking-session/05-timers.md              [x] done

spec: implementable-specs/cooking-session/07-transcript-storage.md
  → build-guide/08-cooking-session/02-mira-session-do.md    [x] done (turn counter from agent_state)
  → build-guide/08-cooking-session/06-session-end-and-recipe.md [x] done (writeTranscriptTurn in end sequence)

spec: implementable-specs/cooking-session/08-session-end.md
  → build-guide/08-cooking-session/06-session-end-and-recipe.md [x] done (end sequence, recipe decision tree, outcome summary)

spec: implementable-specs/cooking-session/09-reconnection.md
  → build-guide/08-cooking-session/03-gemini-live-session.md [x] done (proactiveGeminiReconnect, context continuity)
  → build-guide/08-cooking-session/06-session-end-and-recipe.md [x] done (mobile disconnect wait)

spec: implementable-specs/cooking-session/10-human-behaviors.md
  → build-guide/08-cooking-session/04-proactive-speech-engine.md [x] done (non-response, adaptive verbosity, phase awareness)

spec: implementable-specs/cooking-session/proactive-speech-engine/ (all 6 files)
  → build-guide/08-cooking-session/04-proactive-speech-engine.md [x] done (all 6 sub-components)

spec: brioela-specs/13-generational-recipe-capture.md
  → build-guide/08-cooking-session/06-session-end-and-recipe.md [x] done (recipe reconstruction, grandma technique capture)

spec: brioela-specs/32-grandma-style-flavor-profile.md
  → build-guide/08-cooking-session/06-session-end-and-recipe.md [x] done (cultural notes, technique preservation in recipe content)

spec: brioela-specs/10-mira-cooking-voice.md
  → build-guide/08-cooking-session/00-overview.md           [x] done (voice cooking scope)
  → build-guide/08-cooking-session/03-gemini-live-session.md [x] done (Gemini Live audio session)

spec: brioela-specs/11-live-vision-cooking-coach.md
  → build-guide/08-cooking-session/03-gemini-live-session.md [x] done (JPEG frame forwarding to Gemini)
  → build-guide/08-cooking-session/04-proactive-speech-engine.md [x] done (visual observation behavior)

spec: brioela-specs/12-multi-person-cooking-rooms.md
  → build-guide/08-cooking-session/00-overview.md           [x] done (multi-person room scope; Cloudflare Realtime/RealtimeKit)
  → build-guide/08-cooking-session/01-room-lifecycle.md      [x] done (RealtimeKit room lifecycle)

spec: brioela-specs/24-technical-architecture-backbone.md
  → build-guide/08-cooking-session/00-overview.md           [x] done (stateful MiraSession DO, context, alarms)
  → build-guide/08-cooking-session/03-gemini-live-session.md [x] done (Gemini Live, reconnect, context)
  → build-guide/08-cooking-session/05-timers.md              [x] done (DO alarms)
