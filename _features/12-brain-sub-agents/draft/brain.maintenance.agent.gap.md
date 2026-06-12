# Draft: brain.maintenance.agent.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_subagents/brain-maintenance/brain.maintenance.agent.ts`

**Gap (feature 12):** DO class not in production. Ledger `07-sub-agents/0001` open. Spawned by **14** via `spawn.brain.maintenance.handler.ts`.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { Agent, callable } from 'agents'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import { runMaintenancePass } from '@/agents/brain/_subagents/brain-maintenance/run.maintenance.pass.handler'
import { buildBrainMaintenanceTools } from '@/agents/brain/_subagents/brain-maintenance/_helpers/build.brain.maintenance.tools.helper'
import { BRAIN_MAINTENANCE_SYSTEM_PROMPT } from '@/agents/brain/_subagents/brain-maintenance/brain.maintenance.system.prompt'
import { z } from '@brioela/shared/zod'

const runMaintenancePassInputSchema = z.object({
	userId: z.string().min(1),
	runId: z.string().min(1),
})

export type RunMaintenancePassInput = z.infer<typeof runMaintenancePassInputSchema>
export type MaintenancePassSummary = {
	runId: string
	status: 'completed' | 'deferred'
	reason?: string
	inputTokens: number
	outputTokens: number
	summary: string
}

export class BrainMaintenanceAgent extends Agent<Cloudflare.Env> {
	@callable()
	async runMaintenancePass(input: RunMaintenancePassInput): Promise<MaintenancePassSummary> {
		const parsed = runMaintenancePassInputSchema.parse(input)
		const brain = await this.parentAgent<BrioelaBrain>()

		const active = await brain.checkActiveSession({ userId: parsed.userId })
		if (active.hasActiveSession) {
			await brain.scheduleUserAlarm({
				alarmType: 'brain_maintenance_run',
				scheduledAt: Date.now() + 60 * 60 * 1000,
				payload: {},
			})
			return {
				runId: parsed.runId,
				status: 'deferred',
				reason: 'active_session',
				inputTokens: 0,
				outputTokens: 0,
				summary: 'Deferred — user session active',
			}
		}

		const result = await runMaintenancePass({
			brain,
			runId: parsed.runId,
			userId: parsed.userId,
			model: anthropic('claude-haiku-4-5-20251001'),
			systemPrompt: BRAIN_MAINTENANCE_SYSTEM_PROMPT,
			tools: buildBrainMaintenanceTools(brain, parsed.runId),
		})

		return result
	}
}
```

**Depends:** **06** skill tools, personality maintenance executables, Brain RPC methods on `BrioelaBrain`.
