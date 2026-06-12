# Gap snapshot: prompt-builder.ts

Target: `backend/src/agents/mira/mira-speech-decision/prompt-builder.ts`

**Status:** Not in repo. Authoritative: `implementable-specs/cooking-session/mira-speech-decision-engine/04-prompt-builder.md`.

```typescript
import type { CookingPhase } from './types'

export type ObservationContext = {
	userName: string
	phase: CookingPhase
	silenceMs: number
	activeTimers: Array<{ label: string; remainingSeconds: number }>
	recentTopics: string[]
}

const PHASE_HINTS: Record<CookingPhase, string> = {
	prep: 'They are in the preparation phase.',
	active: 'They are actively cooking.',
	simmering: 'Something is simmering or cooking slowly.',
	finishing: 'They appear to be finishing the dish.',
}

export class PromptBuilder {
	buildUrgentPrompt(context: ObservationContext): string {
		return [
			'[URGENT KITCHEN CHECK]',
			'Something significant just changed in the kitchen.',
			`Look at what you see right now and immediately tell ${context.userName} what you notice.`,
			'If it is dangerous (smoke, burning, overflow, fire) — say so directly and urgently.',
			'If it turns out to be nothing serious, say so briefly and reassuringly.',
			'Respond now. Do not wait.',
		].join(' ')
	}

	buildAdvisoryPrompt(context: ObservationContext): string {
		const parts: string[] = ['[KITCHEN OBSERVATION]']

		if (context.activeTimers.length > 0) {
			const timerList = context.activeTimers
				.map((t) => `"${t.label}" (${t.remainingSeconds}s left)`)
				.join(', ')
			parts.push(`Active timers: ${timerList}.`)
		}

		const silenceMin = Math.floor(context.silenceMs / 60_000)
		const silenceSec = Math.floor((context.silenceMs % 60_000) / 1_000)
		if (silenceMin > 0) {
			parts.push(
				`${context.userName} has been quiet for ${silenceMin} minute${silenceMin > 1 ? 's' : ''}.`,
			)
		} else {
			parts.push(`${context.userName} has been quiet for ${silenceSec} seconds.`)
		}

		parts.push(PHASE_HINTS[context.phase])

		if (context.recentTopics.length > 0) {
			parts.push(
				`You already mentioned: ${context.recentTopics.join(', ')}. Do not repeat these unless something significantly changed.`,
			)
		}

		parts.push(
			[
				'Look at what you see in the kitchen right now.',
				'If you notice something worth mentioning — food ready to flip, technique to suggest,',
				'something looking done or not done, an ingredient to add — say it naturally and briefly.',
				'If everything looks fine and there is nothing useful to add, respond with exactly: ok',
				'Do not explain why you are saying ok. Do not narrate your observation process.',
				'Either say something useful or say: ok',
			].join(' '),
		)

		return parts.join('\n')
	}

	buildMilestonePrompt(context: ObservationContext, milestone: string): string {
		return [
			'[MILESTONE CHECK]',
			milestone,
			`Look at what you see and tell ${context.userName} what you observe.`,
			'Keep it warm and brief — acknowledge the moment.',
		].join(' ')
	}
}
```
