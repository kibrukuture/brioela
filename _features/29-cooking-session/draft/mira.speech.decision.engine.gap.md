# Gap snapshot: mira-speech-decision/index.ts

Target: `backend/src/agents/mira/mira-speech-decision/index.ts`

**Status:** Not in repo. Module owned by **30**; **29** integrates. From `mira-speech-decision-engine/00-index.md`.

```typescript
import { SilenceTracker } from './silence-tracker'
import { VisualChangeDetector } from './visual-change-detector'
import { AdaptiveFrequency } from './adaptive-frequency'
import { PromptBuilder } from './prompt-builder'
import { ResponseFilter } from './response-filter'
import { SuppressionRules } from './suppression-rules'

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

export class MiraSpeechDecisionEngine {
	private phase: CookingPhase = 'prep'
	private activeTimerLabels: string[] = []
	private geminiCurrentlySpeaking = false
	private pendingObservationRequest: ObservationRequest | null = null
	private sessionStatus: 'active' | 'gemini_reconnecting' | 'mobile_reconnecting' | 'ending' = 'active'

	private readonly silence = new SilenceTracker()
	private readonly visual = new VisualChangeDetector()
	private readonly frequency = new AdaptiveFrequency()
	private readonly prompts = new PromptBuilder()
	private readonly filter = new ResponseFilter()
	private readonly suppression = new SuppressionRules()

	constructor(private readonly config: { sessionId: string; userId: string }) {}

	onVoiceActivity(active: boolean): void {
		this.silence.onVoiceActivity(active)
	}

	onVideoFrame(jpegData: ArrayBuffer): void {
		this.visual.onFrame(jpegData)
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

	setSessionStatus(status: typeof this.sessionStatus): void {
		this.sessionStatus = status
	}

	tick(activeTimerLabels: string[]): ObservationRequest | null {
		this.activeTimerLabels = activeTimerLabels

		const hard = this.suppression.isHardBlocked({
			silenceTracker: this.silence,
			geminiCurrentlySpeaking: this.geminiCurrentlySpeaking,
			sessionStatus: this.sessionStatus,
			pendingObservationRequest: this.pendingObservationRequest,
		})
		if (hard.blocked) return null

		const interval = this.frequency.intervalFor(this.phase, this.silence.getSilenceDurationMs())
		if (!this.frequency.shouldTick(interval)) return null

		const visualSignal = this.visual.latestSignal()
		if (!visualSignal && this.silence.getSilenceDurationMs() < 15_000) return null

		const prompt = this.prompts.build({
			phase: this.phase,
			visualSignal,
			silenceMs: this.silence.getSilenceDurationMs(),
			activeTimers: this.activeTimerLabels,
		})
		if (!prompt) return null

		const request: ObservationRequest = {
			prompt,
			urgency: visualSignal?.urgent ? 'urgent' : 'advisory',
			turnComplete: true,
		}
		this.pendingObservationRequest = request
		return request
	}

	onObservationResponse(rawResponse: string): ObservationResponse {
		this.pendingObservationRequest = null
		return this.filter.classify(rawResponse)
	}
}
