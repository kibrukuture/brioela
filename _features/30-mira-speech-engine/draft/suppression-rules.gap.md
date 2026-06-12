# Gap snapshot: suppression-rules.ts

Target: `backend/src/agents/mira/mira-speech-decision/suppression-rules.ts`

**Status:** Not in repo. Authoritative: `implementable-specs/cooking-session/mira-speech-decision-engine/06-suppression-rules.md`.

```typescript
import type { SilenceTracker } from './silence-tracker'
import type { ObservationRequest } from './types'

export type SessionSpeechStatus =
	| 'active'
	| 'gemini_reconnecting'
	| 'mobile_reconnecting'
	| 'ending'

export type HardBlockInput = {
	silenceTracker: SilenceTracker
	geminiCurrentlySpeaking: boolean
	sessionStatus: SessionSpeechStatus
	pendingObservationRequest: ObservationRequest | null
}

export type SoftBlockInput = {
	silenceTracker: SilenceTracker
	geminiLastSpeechEndedAt: number | null
	sessionStartedAt: number
	observationCountLast5Min: number
}

export type BlockResult = { blocked: boolean; reason: string }

const GEMINI_RECENT_MS = 25_000
const USER_RECENT_MS = 10_000
const SESSION_START_MS = 30_000
const RATE_LIMIT_COUNT = 8
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000

export class SuppressionRules {
	private observationLog: number[] = []
	private geminiLastSpeechEndedAt: number | null = null

	onGeminiSpeechEnd(): void {
		this.geminiLastSpeechEndedAt = Date.now()
	}

	getGeminiLastSpeechEndedAt(): number | null {
		return this.geminiLastSpeechEndedAt
	}

	isHardBlocked(input: HardBlockInput): BlockResult {
		if (input.silenceTracker.isUserSpeaking()) {
			return { blocked: true, reason: 'user_speaking' }
		}
		if (input.geminiCurrentlySpeaking) {
			return { blocked: true, reason: 'gemini_speaking' }
		}
		if (input.sessionStatus !== 'active') {
			return { blocked: true, reason: `session_status_${input.sessionStatus}` }
		}
		if (input.pendingObservationRequest !== null) {
			return { blocked: true, reason: 'observation_in_flight' }
		}
		return { blocked: false, reason: '' }
	}

	isSoftBlocked(input: SoftBlockInput): BlockResult {
		const msSinceGeminiSpoke =
			input.geminiLastSpeechEndedAt !== null
				? Date.now() - input.geminiLastSpeechEndedAt
				: null

		if (msSinceGeminiSpoke !== null && msSinceGeminiSpoke < GEMINI_RECENT_MS) {
			return { blocked: true, reason: 'gemini_spoke_recently' }
		}

		const msSinceUserSpoke = input.silenceTracker.getTimeSinceLastSpeechMs()
		if (msSinceUserSpoke !== null && msSinceUserSpoke < USER_RECENT_MS) {
			return { blocked: true, reason: 'user_spoke_recently' }
		}

		const sessionAgeMs = Date.now() - input.sessionStartedAt
		if (sessionAgeMs < SESSION_START_MS) {
			return { blocked: true, reason: 'session_just_started' }
		}

		if (input.observationCountLast5Min >= RATE_LIMIT_COUNT) {
			return { blocked: true, reason: 'rate_limit' }
		}

		return { blocked: false, reason: '' }
	}

	recordObservation(): void {
		this.observationLog.push(Date.now())
	}

	countObservationsLast5Min(): number {
		const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS
		this.observationLog = this.observationLog.filter((ts) => ts > cutoff)
		return this.observationLog.length
	}
}
```
