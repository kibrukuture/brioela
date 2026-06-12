# Draft: run.behavior.pattern.pass.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_subagents/behavior-pattern/run.behavior.pattern.pass.handler.ts`

**Gap (feature 12):** Pattern detection pass not shipped. Authoritative: `implementable-specs/15-brain-maintenance-and-behavior-patterns.md` BehaviorPatternAgent section.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { generateObject, type LanguageModel } from 'ai'
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import type { BehaviorPatternPassSummary } from '@/agents/brain/_subagents/behavior-pattern/behavior.pattern.agent'
import { z } from '@brioela/shared/zod'

const MS_PER_DAY = 86_400_000
const CONFIDENCE_FLOOR = 0.6
const DEFAULT_WINDOW_DAYS = 7

const detectedPatternSchema = z.object({
	key: z.string().min(1),
	description: z.string().min(1),
	eventIds: z.array(z.string()).min(3),
	confidence: z.number().min(0).max(1),
})

const patternDetectionOutputSchema = z.object({
	patterns: z.array(detectedPatternSchema),
})

type RunBehaviorPatternPassDeps = {
	brain: BrioelaBrain
	userId: string
	runId: string
	model: LanguageModel
	systemPrompt: string
	tools: Record<string, unknown>
}

export async function runBehaviorPatternPass(deps: RunBehaviorPatternPassDeps): Promise<BehaviorPatternPassSummary> {
	const now = Date.now()
	const lastRunRaw = await deps.brain.getAgentState({ key: 'behavior_pattern_detection.last_run' })
	const sinceTimestamp = lastRunRaw
		? parseInt(lastRunRaw, 10)
		: now - DEFAULT_WINDOW_DAYS * MS_PER_DAY

	const { events, hasMore } = await deps.brain.getMemoryEventsSince({
		sinceTimestamp,
		limit: 500,
	})

	await deps.brain.getPersonalityTraitsForBrainMaintenance({ userId: deps.userId })
	await deps.brain.getUserMemoryForBrainMaintenance({ namespace: 'pattern' })

	const { object, usage } = await generateObject({
		model: deps.model,
		schema: patternDetectionOutputSchema,
		system: deps.systemPrompt,
		prompt: JSON.stringify({ events, hasMore, sinceTimestamp }),
	})

	let patternsWritten = 0
	for (const pattern of object.patterns.filter((p) => p.confidence >= CONFIDENCE_FLOOR)) {
		await deps.brain.writeBrainMemory({
			namespace: 'pattern',
			key: pattern.key,
			value: JSON.stringify({
				description: pattern.description,
				event_ids: pattern.eventIds,
				confidence: pattern.confidence,
				detected_at: now,
			}),
			writtenBy: 'BehaviorPatternAgent',
			runId: deps.runId,
		})
		patternsWritten += 1
	}

	await deps.brain.setAgentState({
		key: 'behavior_pattern_detection.last_run',
		value: String(now),
	})

	await deps.brain.scheduleUserAlarm({
		alarmType: 'behavior_pattern_detection',
		scheduledAt: now + 3 * MS_PER_DAY,
		payload: {},
	})

	return {
		runId: deps.runId,
		status: 'completed',
		patternsWritten,
		inputTokens: usage?.inputTokens ?? 0,
		outputTokens: usage?.outputTokens ?? 0,
		summary: `Wrote ${patternsWritten} patterns${hasMore ? ' (partial batch)' : ''}`,
	}
}
```

**Namespace:** `pattern` not `patterns` — per spec **15**.
