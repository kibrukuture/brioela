# Gap snapshot: silence-tracker.ts

Target: `backend/src/agents/mira/mira-speech-decision/silence-tracker.ts`

**Status:** Not in repo. Authoritative: `implementable-specs/cooking-session/mira-speech-decision-engine/01-silence-tracker.md`.

```typescript
export type SilenceTrackerState = {
	silenceStartedAt: number | null
	lastSpeechEndedAt: number | null
	currentlyVoiceActive: boolean
	consecutiveSilenceMs: number
}

/** Tracks user silence duration from VAD samples. Does not decide to speak. */
export class SilenceTracker {
	private state: SilenceTrackerState = {
		silenceStartedAt: null,
		lastSpeechEndedAt: null,
		currentlyVoiceActive: false,
		consecutiveSilenceMs: 0,
	}

	onVoiceActivity(active: boolean): void {
		const now = Date.now()

		if (active && !this.state.currentlyVoiceActive) {
			this.state.currentlyVoiceActive = true
			this.state.silenceStartedAt = null
			this.state.consecutiveSilenceMs = 0
		}

		if (!active && this.state.currentlyVoiceActive) {
			this.state.currentlyVoiceActive = false
			this.state.lastSpeechEndedAt = now
			this.state.silenceStartedAt = now
		}

		if (!active && this.state.silenceStartedAt !== null) {
			this.state.consecutiveSilenceMs = now - this.state.silenceStartedAt
		}
	}

	getSilenceDurationMs(): number {
		return this.state.consecutiveSilenceMs
	}

	isUserSpeaking(): boolean {
		return this.state.currentlyVoiceActive
	}

	getTimeSinceLastSpeechMs(): number | null {
		if (this.state.lastSpeechEndedAt === null) return null
		return Date.now() - this.state.lastSpeechEndedAt
	}

	/** 15s minimum before proactive eligibility (10s dead zone + 5s settling). */
	isEligibleForObservation(): boolean {
		if (this.state.currentlyVoiceActive) return false
		return this.state.consecutiveSilenceMs >= 15_000
	}
}
```
