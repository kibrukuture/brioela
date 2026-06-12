# Draft: build.kid.co.scan.mira.scene.helper.ts (gap — file does not exist)

Target: `backend/src/agents/mira/_scenes/build.kid.co.scan.mira.scene.helper.ts`

**Gap:** No `kid_co_scan` MiraScene builder.

**Source:** `build-guide/21-kids-mode/07-kid-co-scan-mode.md`, `build-guide/30-mira/01-scene-contract.md`

---

```typescript
import type { KidsModeAgeRange } from '@/shared/validator/kids.mode/kids.scan.explanation.schema'
import type { MiraScene } from '@/agents/mira/_types/mira.scene.types'

export type KidCoScanSituation = {
	coScanSessionId: string
	ageRange: KidsModeAgeRange
	voiceEnabled: boolean
	scanCount: number
	lastScanEventId: string | null
}

export type BuildKidCoScanMiraSceneInput = {
	userId: string
	sessionId: string
	situation: KidCoScanSituation
}

export async function buildKidCoScanMiraScene(
	input: BuildKidCoScanMiraSceneInput,
): Promise<MiraScene<KidCoScanSituation>> {
	return {
		sceneId: `kid-co-scan-${input.situation.coScanSessionId}`,
		kind: 'kid_co_scan',
		audience: {
			primary: 'child',
			participants: [
				{
					participantId: input.userId,
					relationshipToUser: 'self',
					language: null,
					canHearMira: true,
					canSeePrivateUserContext: true,
				},
				{
					participantId: 'supervised-child',
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
			recipes: 'none',
			health: 'none',
		},
		situationContext: input.situation,
		stimuli: {
			audio: { enabled: input.situation.voiceEnabled, sources: ['user', 'child'] },
			video: { enabled: true, framePurpose: 'scan', defaultFrameIntervalMs: 1000 },
			events: ['scan_result', 'user_action'],
		},
		capabilities: [
			{
				name: 'mute_voice',
				owner: 'feature_state_machine',
				blocking: false,
				description: 'Parent mutes Mira voice instantly',
			},
			{
				name: 'end_kid_co_scan',
				owner: 'feature_state_machine',
				blocking: true,
				description: 'Parent ends supervised co-scan session',
			},
		],
		privacyBoundary: {
			rawAudioStorage: 'never',
			rawVideoStorage: 'never',
			transcriptStorage: 'summary_only',
			canRevealConstraintsToAudience: false,
			canRevealFullProfile: false,
			durableWrites: 'feature_only',
		},
		speechPolicy: {
			defaultMode: 'teaching_prompt',
			canInterrupt: true,
			shouldAskClarifyingQuestions: false,
			maxUtteranceSeconds: 18,
			silenceIsAllowed: true,
		},
		exitPolicy: {
			onParentEnd: 'close_session',
			onHardAllergy: 'parent_first_safety_framing',
		},
	}
}
```
