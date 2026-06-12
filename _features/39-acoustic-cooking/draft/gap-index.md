# Feature 39 — Acoustic Cooking — Draft index

Production snapshots for review. **None of these files exist in `backend/` or `shared/` yet.**

| Draft file | Target production path | Gap ID |
|---|---|---|
| `acoustic.awareness.prompt.gap.md` | `backend/src/agents/mira/_prompts/acoustic.awareness.prompt.ts` | G1 |
| `append.acoustic.instruction.block.helper.gap.md` | `backend/src/agents/mira/_helpers/append-acoustic-instruction-block.helper.ts` | G7 |
| `imported.step.sound.cue.schema.gap.md` | `backend/src/agents/brain/_schemas/normalized.recipe.content.schema.ts` (delta) | G2 |
| `vision.event.schema.gap.md` | `backend/src/agents/brain/_schemas/vision.event.schema.ts` | G3, G4 |
| `intervention.event.types.gap.md` | `backend/src/agents/mira/_constants/intervention.event.types.ts` | G5 |
| `evidence.source.schema.gap.md` | `shared/validator/acoustic-cooking/evidence.source.schema.ts` | G13 |
| `format.recipe.steps.for.session.helper.gap.md` | `backend/src/agents/mira/_helpers/format-recipe-steps-for-session.helper.ts` | G7 |
| `write.intervention.event.handler.gap.md` | `backend/src/agents/brain/_handlers/write-intervention-event.handler.ts` | G6 |
| `record.intervention.event.helper.gap.md` | `backend/src/agents/mira/_helpers/record-intervention-event.helper.ts` | G6 |
| `learn.sound.cue.from.session.handler.gap.md` | `backend/src/agents/brain/_handlers/learn-sound-cue-from-session.handler.ts` | G11 |
| `extract.intervention.events.from.transcript.helper.gap.md` | `backend/src/agents/brain/_helpers/acoustic/extract-intervention-events-from-transcript.helper.ts` | G6 |
| `emit.acoustic.metric.helper.gap.md` | `backend/src/agents/brain/_helpers/acoustic/emit-acoustic-metric.helper.ts` | G12 |

**Not drafted (owned by other features):** MiraSession DO (**29**), PCM → Gemini (**29**), `MiraSpeechDecisionEngine` (**30**), ingestion sound-cue author (**25**).
