# Draft: run.maintenance.pass.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_subagents/brain-maintenance/run.maintenance.pass.handler.ts`

**Gap (feature 12):** Three-pass orchestration not shipped. Authoritative pass logic: `implementable-specs/15-brain-maintenance-and-behavior-patterns.md` + `build-guide/06-brain-memory/02-brain-maintenance-passes.md` (mass-archive guard).

---

## Intended production file (full snapshot — not yet created)

```typescript
import { generateText, type LanguageModel } from 'ai'
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import type { MaintenancePassSummary } from '@/agents/brain/_subagents/brain-maintenance/brain.maintenance.agent'

const MS_PER_DAY = 86_400_000
const MAX_ARCHIVES_PER_RUN = 5

type RunMaintenancePassDeps = {
	brain: BrioelaBrain
	userId: string
	runId: string
	model: LanguageModel
	systemPrompt: string
	tools: Record<string, unknown>
}

export async function runMaintenancePass(deps: RunMaintenancePassDeps): Promise<MaintenancePassSummary> {
	let inputTokens = 0
	let outputTokens = 0
	let archivesThisRun = 0

	// Pass 1 — skill maintenance (rule-based then LLM overlap)
	const { skills } = await deps.brain.getSkillsForBrainMaintenance({ userId: deps.userId })
	const now = Date.now()

	for (const skill of skills) {
		if (skill.source === 'system') continue

		const daysSinceUsed = skill.lastUsedAt
			? (now - skill.lastUsedAt) / MS_PER_DAY
			: (now - skill.createdAt) / MS_PER_DAY

		if (skill.status === 'active' && skill.useCount < 3 && daysSinceUsed > 30) {
			await deps.brain.updateUserSkill({
				name: skill.name,
				content: skill.content,
				reason: `Brain maintenance: stale — use_count=${skill.useCount}`,
				updatedBy: 'brain_maintenance',
			})
		}

		if (skill.status === 'stale' && daysSinceUsed > 60) {
			if (archivesThisRun >= MAX_ARCHIVES_PER_RUN) {
				await deps.brain.setAgentState({
					key: `brain_maintenance.anomaly.${deps.runId}`,
					value: JSON.stringify({ type: 'mass_archive_threshold', ts: now }),
				})
				break
			}
			await deps.brain.archiveUserSkill({
				name: skill.name,
				reason: `Brain maintenance: archived after ${Math.round(daysSinceUsed)}d stale`,
				archivedBy: 'BrainMaintenanceAgent',
				runId: deps.runId,
			})
			archivesThisRun += 1
		}
	}

	// LLM overlap sub-call (tag groups with 2+ skills) — omitted: uses generateText + tools

	// Pass 2 — trait decay (rule-based per 03-user-personality.md)
	const { traits } = await deps.brain.getPersonalityTraitsForBrainMaintenance({ userId: deps.userId })
	for (const trait of traits.filter((t) => t.isActive)) {
		const daysSinceSeen = (now - trait.lastSeenAt) / MS_PER_DAY
		let newStrength = trait.strength
		if (daysSinceSeen > 30) newStrength -= 0.03
		newStrength = Math.max(0, Math.min(1, newStrength))

		if (newStrength < 0.15) {
			await deps.brain.archivePersonalityTrait({ id: trait.id, reason: 'strength below floor' })
		} else if (newStrength !== trait.strength) {
			await deps.brain.updatePersonalityTrait({
				id: trait.id,
				strength: newStrength,
				lastSeenAt: trait.lastSeenAt,
			})
		}
	}

	// Pass 3 — trait inference LLM sub-call
	const inference = await generateText({
		model: deps.model,
		system: deps.systemPrompt,
		tools: deps.tools,
		maxSteps: 20,
		messages: [{ role: 'user', content: 'Run personality trait inference pass.' }],
	})
	inputTokens += inference.usage?.inputTokens ?? 0
	outputTokens += inference.usage?.outputTokens ?? 0

	await deps.brain.scheduleUserAlarm({
		alarmType: 'brain_maintenance_run',
		scheduledAt: now + 7 * MS_PER_DAY,
		payload: {},
	})

	return {
		runId: deps.runId,
		status: 'completed',
		inputTokens,
		outputTokens,
		summary: 'Brain maintenance pass completed',
	}
}
```

**Note:** Pass 1 overlap LLM and Pass 3 full prompt assembly abbreviated — see spec **15** for complete prompts.
