# Gap snapshot: adaptive-frequency.ts

Target: `backend/src/agents/mira/mira-speech-decision/adaptive-frequency.ts`

**Status:** Not in repo. Authoritative: `implementable-specs/cooking-session/mira-speech-decision-engine/03-adaptive-frequency.md`.

```typescript
import type { CookingPhase } from './types'

const PHASE_BASE_MS: Record<CookingPhase, number> = {
	prep: 20_000,
	active: 12_000,
	simmering: 60_000,
	finishing: 30_000,
}

const HARD_FLOOR_MS = 8_000

export type FrequencyInput = {
	phase: CookingPhase
	silenceMs: number
	changeScore: number
	hasActiveTimer: boolean
	msSinceGeminiSpoke: number | null
}

export type ObservationUrgency = 'urgent' | 'advisory' | 'silent'

export class AdaptiveFrequency {
	private lastObservationAt = 0
	private lastObservationUrgency: ObservationUrgency = 'silent'

	calculateInterval(input: FrequencyInput): number {
		let interval = PHASE_BASE_MS[input.phase]

		if (input.changeScore > 40) interval -= 4_000
		if (input.changeScore > 70) interval -= 4_000
		if (input.hasActiveTimer) interval -= 5_000
		if (input.silenceMs > 60_000) interval -= 3_000
		if (input.silenceMs > 120_000) interval -= 3_000

		if (input.msSinceGeminiSpoke !== null && input.msSinceGeminiSpoke < 60_000) {
			interval += 60_000 - input.msSinceGeminiSpoke
		}

		return Math.max(HARD_FLOOR_MS, interval)
	}

	msSinceLastObservation(): number {
		if (this.lastObservationAt === 0) return Number.POSITIVE_INFINITY
		return Date.now() - this.lastObservationAt
	}

	isIntervalElapsed(requiredIntervalMs: number): boolean {
		return this.msSinceLastObservation() >= requiredIntervalMs
	}

	recordObservation(urgency: ObservationUrgency): void {
		this.lastObservationAt = Date.now()
		this.lastObservationUrgency = urgency
	}

	postObservationCooldownMs(): number {
		switch (this.lastObservationUrgency) {
			case 'urgent':
				return 20_000
			case 'advisory':
				return 30_000
			case 'silent':
				return 10_000
		}
	}

	isPostObservationCooldownActive(): boolean {
		if (this.lastObservationAt === 0) return false
		return Date.now() - this.lastObservationAt < this.postObservationCooldownMs()
	}
}
```
