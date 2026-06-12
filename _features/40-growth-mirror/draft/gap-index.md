# Feature 40 — Growth Mirror — Draft index

Production snapshots for review. **None of these files exist in `backend/` or `shared/` yet.**

| Draft file | Target production path | Gap ID |
|---|---|---|
| `skill.trajectory.schema.gap.md` | `backend/src/agents/brain/_schemas/skill.trajectory.schema.ts` | G1 |
| `growth.recognition.schema.gap.md` | `backend/src/agents/brain/_schemas/growth.recognition.schema.ts` | G2 |
| `skill.evidence.payload.schema.gap.md` | `shared/validator/growth-mirror/skill.evidence.payload.schema.ts` | G3, G17 |
| `extract.skill.evidence.from.session.handler.gap.md` | `backend/src/agents/brain/_handlers/growth-mirror/extract.skill.evidence.from.session.handler.ts` | G4 |
| `normalize.by.recipe.difficulty.helper.gap.md` | `backend/src/agents/brain/_helpers/growth-mirror/normalize.by.recipe.difficulty.helper.ts` | G5 |
| `run.skill.trajectory.update.pass.handler.gap.md` | `backend/src/agents/brain/_handlers/growth-mirror/run.skill.trajectory.update.pass.handler.ts` | G6 |
| `brain.maintenance.pass3.exclusion.gap.md` | `backend/src/agents/brain/_subagents/brain-maintenance/brain.maintenance.system.prompt.ts` (delta) | G7 |
| `check.growth.insight.budget.helper.gap.md` | `backend/src/agents/brain/_helpers/growth-mirror/check.growth.insight.budget.helper.ts` | G10, G19 |
| `enqueue.growth.recognition.candidate.helper.gap.md` | `backend/src/agents/brain/_helpers/growth-mirror/enqueue.growth.recognition.candidate.helper.ts` | G11 |
| `surface.growth.recognition.helper.gap.md` | `backend/src/agents/brain/_helpers/growth-mirror/surface.growth.recognition.helper.ts` | G11 |
| `build.demonstrated.skill.summary.helper.gap.md` | `backend/src/agents/brain/_helpers/growth-mirror/build.demonstrated.skill.summary.helper.ts` | G12, G13 |
| `load.growth.mirror.context.for.mira.handler.gap.md` | `backend/src/agents/brain/_handlers/growth-mirror/load.growth.mirror.context.for.mira.handler.ts` | G11 |
| `delete.growth.mirror.data.handler.gap.md` | `backend/src/agents/brain/_handlers/growth-mirror/delete.growth.mirror.data.handler.ts` | G15 |
| `load.craft.chapter.candidate.handler.gap.md` | `backend/src/agents/brain/_handlers/growth-mirror/load.craft.chapter.candidate.handler.ts` | G14 |

**Not drafted (owned by other features):** `vision_event` schema + writes (**39**), MiraSession session-end fiber (**29**), BrainMaintenanceAgent DO shell (**12**), generative grammar recipe renderer (**52**), Harvest composition (**53**).
