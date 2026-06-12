# Draft: build.brain.maintenance.tools.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_subagents/brain-maintenance/_helpers/build.brain.maintenance.tools.helper.ts`

**Gap (feature 12):** AI SDK tool wrappers → typed Brain RPC not shipped. Pattern: `build-guide/05-brain/02-tool-protocol.md`.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { tool } from 'ai'
import { z } from 'zod'
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'

export function buildBrainMaintenanceTools(brain: BrioelaBrain, runId: string) {
	return {
		get_skills_for_brain_maintenance: tool({
			description: 'List all user skills with metadata. No side effects on usage counters.',
			parameters: z.object({}),
			execute: async () => brain.getSkillsForBrainMaintenance({ runId }),
		}),
		archive_user_skill: tool({
			description: 'Archive a stale or redundant user skill.',
			parameters: z.object({
				name: z.string(),
				reason: z.string(),
			}),
			execute: async (input) =>
				brain.archiveUserSkill({
					name: input.name,
					reason: input.reason,
					archivedBy: 'BrainMaintenanceAgent',
					runId,
				}),
		}),
		create_personality_trait: tool({
			description: 'Create a new personality trait from maintenance inference.',
			parameters: z.object({
				trait: z.string(),
				summary: z.string(),
				evidence: z.array(z.string()).min(1),
				strength: z.number().min(0.3).max(0.7),
			}),
			execute: async (input) => brain.createPersonalityTrait({ ...input, runId }),
		}),
		schedule_user_alarm: tool({
			description: 'Reschedule the next brain_maintenance_run.',
			parameters: z.object({
				scheduledAt: z.number(),
			}),
			execute: async (input) =>
				brain.scheduleUserAlarm({
					alarmType: 'brain_maintenance_run',
					scheduledAt: input.scheduledAt,
					payload: {},
				}),
		}),
	}
}
```

**Sibling:** `build.behavior.pattern.tools.helper.ts` — pattern write wrapper with namespace guard.

**Rule:** Child agent never imports `_schemas/` — all calls go through `BrioelaBrain` `@callable()` methods.
