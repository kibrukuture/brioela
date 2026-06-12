# Draft: build.kid.explanation.mira.scene.helper.ts (gap — file does not exist)

Target: `backend/src/agents/mira/_scenes/build.kid.explanation.mira.scene.helper.ts`

**Gap:** No one-shot `kid_explanation` scene for voice tone switch.

**Source:** `build-guide/21-kids-mode/03-voice-mode.md`, `build-guide/30-mira/01-scene-contract.md`

---

```typescript
import type { KidsModeAgeRange } from '@/shared/validator/kids.mode/kids.scan.explanation.schema'
import type { MiraScene } from '@/agents/mira/_types/mira.scene.types'

export type KidExplanationSituation = {
	parentSceneKind: 'cooking' | 'scan_followup'
	ageRange: KidsModeAgeRange
	contextEntityId: string | null
	contextLabel: string | null
}

export type BuildKidExplanationMiraSceneInput = {
	userId: string
	sessionId: string
	situation: KidExplanationSituation
}

export async function buildKidExplanationMiraScene(
	input: BuildKidExplanationMiraSceneInput,
): Promise<MiraScene<KidExplanationSituation>> {
	return {
		sceneId: `kid-explanation-${input.sessionId}-${Date.now()}`,
		kind: 'kid_explanation',
		audience: {
			primary: 'group',
			participants: [
				{
					participantId: input.userId,
					relationshipToUser: 'self',
					language: null,
					canHearMira: true,
					canSeePrivateUserContext: true,
				},
				{
					participantId: 'listening-child',
					relationshipToUser: 'child',
					language: null,
					canHearMira: true,
					canSeePrivateUserContext: false,
				},
			],
		},
		brainContext: {
			userId: input.userId,
			constraints: 'hard_only',
			memory: 'none',
			skills: 'none',
			recipes: input.situation.parentSceneKind === 'cooking' ? 'active_recipe' : 'none',
			health: 'none',
		},
		situationContext: input.situation,
		stimuli: {
			audio: { enabled: true, sources: ['user'] },
			video: { enabled: false, framePurpose: null, defaultFrameIntervalMs: null },
			events: ['user_action'],
		},
		capabilities: [],
		privacyBoundary: {
			rawAudioStorage: 'never',
			rawVideoStorage: 'never',
			transcriptStorage: 'summary_only',
			canRevealConstraintsToAudience: false,
			canRevealFullProfile: false,
			durableWrites: 'none',
		},
		speechPolicy: {
			defaultMode: 'teaching_prompt',
			canInterrupt: true,
			shouldAskClarifyingQuestions: false,
			maxUtteranceSeconds: 20,
			silenceIsAllowed: true,
		},
		exitPolicy: {
			afterResponses: 1,
			returnToParentScene: input.situation.parentSceneKind,
		},
	}
}
```
