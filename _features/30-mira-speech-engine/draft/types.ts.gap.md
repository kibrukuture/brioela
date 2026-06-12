# Gap snapshot: types.ts

Target: `backend/src/agents/mira/mira-speech-decision/types.ts`

**Status:** Not in repo. Authoritative: `implementable-specs/cooking-session/mira-speech-decision-engine/00-index.md`, `02-visual-change-detector.md`, `06-suppression-rules.md`.

Note: `FrameAnalysis` is also exported inline from `visual-change-detector.ts` — canonical definition lives here. `suppression-rules.ts` already imports `ObservationRequest` from `'./types'` — this file must exist before that module compiles.

```typescript
/** Phase of the cooking session — maps from CookingSituation.phase in 29. */
export type CookingPhase = 'prep' | 'active' | 'simmering' | 'finishing'

/**
 * A proactive observation request produced by tick().
 * MiraSession sends this as a client_content turn to Gemini.
 */
export type ObservationRequest = {
	prompt: string
	urgency: 'urgent' | 'advisory'
	turnComplete: true
}

/**
 * Classification of Gemini's response to an observation request.
 * forward: false → MiraSession must discard current audio to mobile.
 */
export type ObservationResponse = {
	forward: boolean
	urgency: 'urgent' | 'advisory' | 'silent'
	topic?: string
}

/**
 * Result of VisualChangeDetector.onVideoFrame().
 * urgencySignal bypasses soft suppression — not hard blocks.
 */
export type FrameAnalysis = {
	changeScore: number    // 0–100; mean absolute diff normalized
	urgencySignal: boolean // changeScore > 60 AND accelerating last 3 frames
	stable: boolean        // rolling avg changeScore < 10 over 10 frames
}

/**
 * Internal state snapshot passed to suppression and frequency decisions.
 * Not persisted — engine is pure in-memory; resets on DO eviction.
 */
export type EngineState = {
	phase: CookingPhase
	activeTimerLabels: string[]
	geminiCurrentlySpeaking: boolean
	pendingObservationRequest: ObservationRequest | null
	sessionStatus: 'active' | 'gemini_reconnecting' | 'mobile_reconnecting' | 'ending'
	sessionStartedAt: number
}
```
