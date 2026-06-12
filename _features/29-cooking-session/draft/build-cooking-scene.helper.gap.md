# Gap snapshot: build-cooking-scene.helper.ts

Target: `backend/src/agents/mira/_scenes/build-cooking-scene.helper.ts`

**Status:** Not in repo. Scene contract from `build-guide/30-mira/01-scene-contract.md`; cooking situation owned by **29**.

```typescript
import { z } from 'zod'

export const cookingSituationSchema = z.object({
	recipeId: z.string().uuid().nullable(),
	phase: z.enum(['prep', 'active_cooking', 'waiting', 'plating', 'done']),
	activeStepId: z.string().nullable(),
	timers: z.array(
		z.object({
			timerId: z.string().uuid(),
			label: z.string(),
			firesAt: z.number().int().positive(),
		}),
	),
})

export type CookingSituation = z.infer<typeof cookingSituationSchema>

export type MiraSceneKind = 'cooking'

export type MiraScene<TSituation> = {
	sceneId: string
	kind: MiraSceneKind
	audience: {
		primary: 'user' | 'group'
		participants: Array<{
			participantId: string
			relationshipToUser: 'self' | 'guest' | 'unknown'
			language: string | null
			canHearMira: boolean
			canSeePrivateUserContext: boolean
		}>
	}
	brainContext: {
		userId: string
		constraints: 'food_relevant'
		memory: 'session_relevant'
		skills: 'scene_relevant'
		recipes: 'active_recipe'
		health: 'active_condition_food_rules'
	}
	situationContext: TSituation
	stimuli: {
		audio: { enabled: true; sources: ['user', 'participant'] }
		video: { enabled: true; framePurpose: 'cooking'; defaultFrameIntervalMs: 1000 }
		events: ['timer_fired', 'user_action', 'brain_context_update']
	}
	capabilities: Array<{ name: string; owner: 'mira_session' | 'brain'; blocking: boolean }>
	privacyBoundary: {
		rawAudioStorage: 'never'
		rawVideoStorage: 'never'
		transcriptStorage: 'turns_allowed'
		canRevealConstraintsToAudience: boolean
		canRevealFullProfile: false
		durableWrites: 'brain_only'
	}
	speechPolicy: {
		defaultMode: 'proactive_when_useful'
		canInterrupt: true
		shouldAskClarifyingQuestions: true
		maxUtteranceSeconds: 30
		silenceIsAllowed: true
	}
	exitPolicy: { onUserEnd: true; onTimeoutMinutes: 90; onMobileDisconnectMinutes: 5 }
}

export async function buildCookingMiraScene(input: {
	userId: string
	sessionId: string
	recipeId: string | null
}): Promise<MiraScene<CookingSituation>> {
	return {
		sceneId: `cooking:${input.sessionId}`,
		kind: 'cooking',
		audience: {
			primary: 'user',
			participants: [
				{
					participantId: input.userId,
					relationshipToUser: 'self',
					language: null,
					canHearMira: true,
					canSeePrivateUserContext: true,
				},
			],
		},
		brainContext: {
			userId: input.userId,
			constraints: 'food_relevant',
			memory: 'session_relevant',
			skills: 'scene_relevant',
			recipes: 'active_recipe',
			health: 'active_condition_food_rules',
		},
		situationContext: {
			recipeId: input.recipeId,
			phase: 'prep',
			activeStepId: null,
			timers: [],
		},
		stimuli: {
			audio: { enabled: true, sources: ['user', 'participant'] },
			video: { enabled: true, framePurpose: 'cooking', defaultFrameIntervalMs: 1000 },
			events: ['timer_fired', 'user_action', 'brain_context_update'],
		},
		capabilities: [
			{ name: 'schedule_timer', owner: 'mira_session', blocking: true },
			{ name: 'cancel_timer', owner: 'mira_session', blocking: true },
			{ name: 'write_memory', owner: 'brain', blocking: true },
			{ name: 'propose_constraint', owner: 'brain', blocking: true },
			{ name: 'view_recipe', owner: 'brain', blocking: true },
			{ name: 'write_session_note', owner: 'brain', blocking: true },
		],
		privacyBoundary: {
			rawAudioStorage: 'never',
			rawVideoStorage: 'never',
			transcriptStorage: 'turns_allowed',
			canRevealConstraintsToAudience: false,
			canRevealFullProfile: false,
			durableWrites: 'brain_only',
		},
		speechPolicy: {
			defaultMode: 'proactive_when_useful',
			canInterrupt: true,
			shouldAskClarifyingQuestions: true,
			maxUtteranceSeconds: 30,
			silenceIsAllowed: true,
		},
		exitPolicy: { onUserEnd: true, onTimeoutMinutes: 90, onMobileDisconnectMinutes: 5 },
	}
}
