# Gap snapshot: mira-speech-decision/index.ts

Target: `backend/src/agents/mira/mira-speech-decision/index.ts`

**Status:** Not in repo. Authoritative: `implementable-specs/cooking-session/mira-speech-decision-engine/00-index.md` + `06-suppression-rules.md` tick order.

```typescript
import { AdaptiveFrequency } from './adaptive-frequency'
import { PromptBuilder } from './prompt-builder'
import { ResponseFilter } from './response-filter'
import { SilenceTracker } from './silence-tracker'
import { SuppressionRules, type SessionSpeechStatus } from './suppression-rules'
import { VisualChangeDetector } from './visual-change-detector'

export type CookingPhase = 'prep' | 'active' | 'simmering' | 'finishing'

export type ObservationRequest = {
	prompt: string
	urgency: 'urgent' | 'advisory'
	turnComplete: true
}

export type ObservationResponse = {
	forward: boolean
	urgency: 'urgent' | 'advisory' | 'silent'
	topic?: string
}

export type ProactiveSpeechConfig = {
	sessionId: string
	userId: string
	userName: string
	cookingPhase?: CookingPhase
	activeTimerLabels?: string[]
}

export class MiraSpeechDecisionEngine {
	private phase: CookingPhase
	private activeTimerLabels: string[]
	private geminiCurrentlySpeaking = false
	private pendingObservationRequest: ObservationRequest | null = null
	private sessionStatus: SessionSpeechStatus = 'active'
	private readonly sessionStartedAt = Date.now()

	private readonly silence = new SilenceTracker()
	private readonly visual = new VisualChangeDetector()
	private readonly frequency = new AdaptiveFrequency()
	private readonly prompts = new PromptBuilder()
	private readonly filter = new ResponseFilter()
	private readonly suppression = new SuppressionRules()

	constructor(private readonly config: ProactiveSpeechConfig) {
		this.phase = config.cookingPhase ?? 'prep'
		this.activeTimerLabels = config.activeTimerLabels ?? []
	}

	onVoiceActivity(active: boolean): void {
		this.silence.onVoiceActivity(active)
	}

	onVideoFrame(jpegData: ArrayBuffer): void {
		this.visual.onVideoFrame(jpegData)
	}

	onGeminiSpeechStart(): void {
		this.geminiCurrentlySpeaking = true
	}

	onGeminiSpeechEnd(): void {
		this.geminiCurrentlySpeaking = false
		this.suppression.onGeminiSpeechEnd()
	}

	onTimerFired(label: string): void {
		if (!this.activeTimerLabels.includes(label)) {
			this.activeTimerLabels = [...this.activeTimerLabels, label]
		}
	}

	setPhase(phase: CookingPhase): void {
		this.phase = phase
	}

	setSessionStatus(status: SessionSpeechStatus): void {
		this.sessionStatus = status
	}

	setActiveTimerLabels(labels: string[]): void {
		this.activeTimerLabels = labels
	}

	tick(): ObservationRequest | null {
		if (this.frequency.isPostObservationCooldownActive()) {
			return null
		}

		const hard = this.suppression.isHardBlocked({
			silenceTracker: this.silence,
			geminiCurrentlySpeaking: this.geminiCurrentlySpeaking,
			sessionStatus: this.sessionStatus,
			pendingObservationRequest: this.pendingObservationRequest,
		})
		if (hard.blocked) return null

		const frame = this.visual.getLastAnalysis()
		const context = this.buildContext()

		if (frame.urgencySignal) {
			const request: ObservationRequest = {
				prompt: this.prompts.buildUrgentPrompt(context),
				urgency: 'urgent',
				turnComplete: true,
			}
			this.commitObservation(request, 'urgent')
			return request
		}

		const soft = this.suppression.isSoftBlocked({
			silenceTracker: this.silence,
			geminiLastSpeechEndedAt: this.suppression.getGeminiLastSpeechEndedAt(),
			sessionStartedAt: this.sessionStartedAt,
			observationCountLast5Min: this.suppression.countObservationsLast5Min(),
		})
		if (soft.blocked) return null

		if (!this.silence.isEligibleForObservation()) return null

		const interval = this.frequency.calculateInterval({
			phase: this.phase,
			silenceMs: this.silence.getSilenceDurationMs(),
			changeScore: frame.changeScore,
			hasActiveTimer: this.activeTimerLabels.length > 0,
			msSinceGeminiSpoke: this.suppression.getGeminiLastSpeechEndedAt()
				? Date.now() - this.suppression.getGeminiLastSpeechEndedAt()!
				: null,
		})

		if (!this.frequency.isIntervalElapsed(interval)) return null

		const request: ObservationRequest = {
			prompt: this.prompts.buildAdvisoryPrompt(context),
			urgency: 'advisory',
			turnComplete: true,
		}
		this.commitObservation(request, 'advisory')
		return request
	}

	onObservationResponse(rawResponse: string): ObservationResponse {
		this.pendingObservationRequest = null
		const decision = this.filter.onObservationResponse(rawResponse)
		this.frequency.recordObservation(decision.urgency)
		return decision
	}

	private commitObservation(request: ObservationRequest, urgency: 'urgent' | 'advisory'): void {
		this.pendingObservationRequest = request
		this.suppression.recordObservation()
		this.frequency.recordObservation(urgency)
	}

	private buildContext() {
		return {
			userName: this.config.userName,
			phase: this.phase,
			silenceMs: this.silence.getSilenceDurationMs(),
			activeTimers: this.activeTimerLabels.map((label) => ({
				label,
				remainingSeconds: 0,
			})),
			recentTopics: this.filter.getRecentTopics(),
		}
	}
}

export { SilenceTracker } from './silence-tracker'
export { VisualChangeDetector } from './visual-change-detector'
export { AdaptiveFrequency } from './adaptive-frequency'
export { PromptBuilder } from './prompt-builder'
export { ResponseFilter } from './response-filter'
export { SuppressionRules } from './suppression-rules'
```
