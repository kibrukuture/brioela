# Draft: behavior.pattern.agent.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_subagents/behavior-pattern/behavior.pattern.agent.ts`

**Gap (feature 12):** DO class not in production. Ledger `07-sub-agents/0002` open.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { Agent, callable } from 'agents'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import { runBehaviorPatternPass } from '@/agents/brain/_subagents/behavior-pattern/run.behavior.pattern.pass.handler'
import { buildBehaviorPatternTools } from '@/agents/brain/_subagents/behavior-pattern/_helpers/build.behavior.pattern.tools.helper'
import { BEHAVIOR_PATTERN_SYSTEM_PROMPT } from '@/agents/brain/_subagents/behavior-pattern/behavior.pattern.system.prompt'
import { z } from '@brioela/shared/zod'

const runBehaviorPatternPassInputSchema = z.object({
	userId: z.string().min(1),
	runId: z.string().min(1),
})

export type RunBehaviorPatternPassInput = z.infer<typeof runBehaviorPatternPassInputSchema>
export type BehaviorPatternPassSummary = {
	runId: string
	status: 'completed' | 'deferred'
	patternsWritten: number
	inputTokens: number
	outputTokens: number
	summary: string
}

export class BehaviorPatternAgent extends Agent<Cloudflare.Env> {
	@callable()
	async runBehaviorPatternPass(input: RunBehaviorPatternPassInput): Promise<BehaviorPatternPassSummary> {
		const parsed = runBehaviorPatternPassInputSchema.parse(input)
		const brain = await this.parentAgent<BrioelaBrain>()

		const active = await brain.checkActiveSession({ userId: parsed.userId })
		if (active.hasActiveSession) {
			await brain.scheduleUserAlarm({
				alarmType: 'behavior_pattern_detection',
				scheduledAt: Date.now() + 60 * 60 * 1000,
				payload: {},
			})
			return {
				runId: parsed.runId,
				status: 'deferred',
				patternsWritten: 0,
				inputTokens: 0,
				outputTokens: 0,
				summary: 'Deferred — user session active',
			}
		}

		return runBehaviorPatternPass({
			brain,
			runId: parsed.runId,
			userId: parsed.userId,
			model: anthropic('claude-haiku-4-5-20251001'),
			systemPrompt: BEHAVIOR_PATTERN_SYSTEM_PROMPT,
			tools: buildBehaviorPatternTools(brain, parsed.runId),
		})
	}
}
```

**Namespace rule:** all writes via `write_user_memory` must use `pattern.*` prefix — enforced in executable + Zod.
