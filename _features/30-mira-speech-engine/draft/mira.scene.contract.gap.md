# Gap snapshot: mira.scene.contract.ts

Target: `backend/src/agents/mira/_scenes/mira.scene.contract.ts`

**Status:** Not in repo. Authoritative: `build-guide/30-mira/01-scene-contract.md`.

```typescript
export type MiraSceneKind =
	| 'cooking'
	| 'bela_shopper'
	| 'menu_language_bridge'
	| 'recipe_review'
	| 'scan_followup'
	| 'kid_explanation'
	| 'kid_co_scan'

export type MiraAudience = {
	primary: 'user' | 'shopper' | 'staff' | 'child' | 'group'
	participants: Array<{
		participantId: string
		relationshipToUser: 'self' | 'shopper' | 'staff' | 'guest' | 'child' | 'unknown'
		language: string | null
		canHearMira: boolean
		canSeePrivateUserContext: boolean
	}>
}

export type BrainContextSlice = {
	userId: string
	constraints: 'none' | 'hard_only' | 'food_relevant' | 'full_food_profile'
	memory: 'none' | 'session_relevant' | 'recipe_relevant' | 'order_relevant'
	skills: 'none' | 'scene_relevant' | 'all_active_index'
	recipes: 'none' | 'active_recipe' | 'candidate_recipe'
	health: 'none' | 'active_condition_food_rules'
}

export type MiraStimulusConfig = {
	audio: {
		enabled: boolean
		sources: Array<'user' | 'shopper' | 'staff' | 'participant' | 'child'>
	}
	video: {
		enabled: boolean
		framePurpose: 'cooking' | 'shopping' | 'menu' | 'scan' | null
		defaultFrameIntervalMs: number | null
	}
	events: Array<
		| 'scan_result'
		| 'timer_fired'
		| 'menu_answer'
		| 'order_event'
		| 'user_action'
		| 'brain_context_update'
	>
}

export type MiraCapability = {
	name: string
	owner: 'mira_session' | 'brain' | 'feature_state_machine'
	blocking: boolean
	description: string
}

export type MiraPrivacyBoundary = {
	rawAudioStorage: 'never' | 'explicit_consent_only'
	rawVideoStorage: 'never' | 'explicit_consent_only'
	transcriptStorage: 'none' | 'summary_only' | 'turns_allowed'
	canRevealConstraintsToAudience: boolean
	canRevealFullProfile: false
	durableWrites: 'none' | 'brain_only' | 'feature_only' | 'brain_and_feature'
}

export type MiraSpeechPolicy = {
	defaultMode: 'answer_only' | 'proactive_when_useful' | 'translator_turns' | 'teaching_prompt'
	canInterrupt: boolean
	shouldAskClarifyingQuestions: boolean
	maxUtteranceSeconds: number
	silenceIsAllowed: boolean
}

export type MiraExitPolicy = {
	maxDurationMs: number | null
	inactivityTimeoutMs: number | null
	allowedEndReasons: Array<'user_ended' | 'timeout' | 'error' | 'feature_completed'>
}

export type MiraScene<TSituation = unknown> = {
	sceneId: string
	kind: MiraSceneKind
	audience: MiraAudience
	brainContext: BrainContextSlice
	situationContext: TSituation
	stimuli: MiraStimulusConfig
	capabilities: MiraCapability[]
	privacyBoundary: MiraPrivacyBoundary
	speechPolicy: MiraSpeechPolicy
	exitPolicy: MiraExitPolicy
}

/** Default cooking speech policy per 30-mira/01-scene-contract.md */
export const COOKING_SPEECH_POLICY: MiraSpeechPolicy = {
	defaultMode: 'proactive_when_useful',
	canInterrupt: true,
	shouldAskClarifyingQuestions: true,
	maxUtteranceSeconds: 30,
	silenceIsAllowed: true,
}
```
