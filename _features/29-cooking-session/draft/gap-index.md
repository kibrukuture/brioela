# Draft index — 29-cooking-session

## Gap / intended snapshots

| File | Target path | Blocked by |
|---|---|---|
| `mira.session.agent.gap.md` | `backend/src/agents/mira/mira-session.agent.ts` | wrangler binding, local schemas |
| `init.handler.gap.md` | `backend/src/agents/mira/_handlers/init.handler.ts` | Gemini helper, scene builder |
| `realtime-stream.handler.gap.md` | `backend/src/agents/mira/_handlers/realtime-stream.handler.ts` | packet decode helper |
| `mobile-audio.handler.gap.md` | `backend/src/agents/mira/_handlers/mobile-audio.handler.ts` | MiraSession agent |
| `gemini-session.helper.gap.md` | `backend/src/agents/mira/_helpers/gemini-session.helper.ts` | GEMINI_API_KEY, tool declarations |
| `cooking.tool.declarations.gap.md` | `backend/src/agents/mira/_constants/cooking.tool.declarations.ts` | — |
| `forward.tool.to.brain.helper.gap.md` | `backend/src/agents/mira/_helpers/forward-tool-to-brain.helper.ts` | Brain Mira RPC (**04**) |
| `alarm.handler.gap.md` | `backend/src/agents/mira/_handlers/alarm.handler.ts` | local `cooking_timers` schema |
| `end-session.handler.gap.md` | `backend/src/agents/mira/_handlers/end-session.handler.ts` | finalize RPC, recipe helpers |
| `start-cooking.handler.gap.md` | `backend/src/agents/brain/_handlers/start-cooking.handler.ts` | RealtimeKit client, **11** open |
| `build-cooking-scene.helper.gap.md` | `backend/src/agents/mira/_scenes/build-cooking-scene.helper.ts` | **30** scene types |
| `mira.speech.decision.engine.gap.md` | `backend/src/agents/mira/mira-speech-decision/index.ts` | **30** owns module |
| `cooking.session.runtime.schema.gap.md` | `backend/src/agents/mira/_schemas/cooking.session.runtime.schema.ts` | Mira SQLite migration |
| `cooking.timers.schema.gap.md` | `backend/src/agents/mira/_schemas/cooking.timers.schema.ts` | Mira SQLite migration |
| `mira.session.rpc.gap.md` | `backend/src/agents/brain/_rpc/mira.session.rpc.ts` | **04** callable surface |

## Cross-feature drafts (do not duplicate)

| Feature | Draft |
|---|---|
| **30** | `_features/30-mira-speech-engine/draft/` (when migrated) — speech sub-components |
| **14** | `_features/14-brain-alarm-dispatch/draft/handle.cooking.timer.audit.handler.gap.md` |
| **12** | `_features/12-brain-sub-agents/draft/mira.session.agent.gap.md` — catalog only |

## Shipped (not in draft/)

| Path | Note |
|---|---|
| `backend/src/agents/brain/_schemas/session.schema.ts` | `cooking` session type enum |
| `backend/src/agents/brain/_schemas/session.turn.schema.ts` | Turn storage target |
| `backend/src/agents/brain/_schemas/recipe.origin.schema.ts` | `cooking_session` origin |

**Total in this folder:** 16 files (15 gap + this index).
