# Gap snapshot: mira.scene.contract.schema.ts

Target: `backend/src/agents/mira/_scenes/mira.scene.contract.schema.ts`

**Status:** Not in repo. Authoritative: `build-guide/30-mira/01-scene-contract.md`.

Zod validators for every type in `mira.scene.contract.ts`. Used to validate scene objects before MiraSession opens — ensures no scene builder silently passes a malformed scene into the runtime.

```typescript
import { z } from 'zod'

export const MiraSceneKindSchema = z.enum([
	'cooking',
	'bela_shopper',
	'menu_language_bridge',
	'recipe_review',
	'scan_followup',
	'kid_explanation',
	'kid_co_scan',
])

export const MiraAudienceSchema = z.object({
	primary: z.enum(['user', 'shopper', 'staff', 'child', 'group']),
	participants: z.array(
		z.object({
			participantId: z.string(),
			relationshipToUser: z.enum(['self', 'shopper', 'staff', 'guest', 'child', 'unknown']),
			language: z.string().nullable(),
			canHearMira: z.boolean(),
			canSeePrivateUserContext: z.boolean(),
		}),
	),
})

export const BrainContextSliceSchema = z.object({
	userId: z.string(),
	constraints: z.enum(['none', 'hard_only', 'food_relevant', 'full_food_profile']),
	memory: z.enum(['none', 'session_relevant', 'recipe_relevant', 'order_relevant']),
	skills: z.enum(['none', 'scene_relevant', 'all_active_index']),
	recipes: z.enum(['none', 'active_recipe', 'candidate_recipe']),
	health: z.enum(['none', 'active_condition_food_rules']),
})

export const MiraStimulusConfigSchema = z.object({
	audio: z.object({
		enabled: z.boolean(),
		sources: z.array(z.enum(['user', 'shopper', 'staff', 'participant', 'child'])),
	}),
	video: z.object({
		enabled: z.boolean(),
		framePurpose: z.enum(['cooking', 'shopping', 'menu', 'scan']).nullable(),
		defaultFrameIntervalMs: z.number().int().positive().nullable(),
	}),
	events: z.array(
		z.enum([
			'scan_result',
			'timer_fired',
			'menu_answer',
			'order_event',
			'user_action',
			'brain_context_update',
		]),
	),
})

export const MiraCapabilitySchema = z.object({
	name: z.string(),
	owner: z.enum(['mira_session', 'brain', 'feature_state_machine']),
	blocking: z.boolean(),
	description: z.string(),
})

export const MiraPrivacyBoundarySchema = z.object({
	rawAudioStorage: z.enum(['never', 'explicit_consent_only']),
	rawVideoStorage: z.enum(['never', 'explicit_consent_only']),
	transcriptStorage: z.enum(['none', 'summary_only', 'turns_allowed']),
	canRevealConstraintsToAudience: z.boolean(),
	canRevealFullProfile: z.literal(false),
	durableWrites: z.enum(['none', 'brain_only', 'feature_only', 'brain_and_feature']),
})

export const MiraSpeechPolicySchema = z.object({
	defaultMode: z.enum(['answer_only', 'proactive_when_useful', 'translator_turns', 'teaching_prompt']),
	canInterrupt: z.boolean(),
	shouldAskClarifyingQuestions: z.boolean(),
	maxUtteranceSeconds: z.number().int().positive(),
	silenceIsAllowed: z.boolean(),
})

export const MiraExitPolicySchema = z.object({
	maxDurationMs: z.number().int().positive().nullable(),
	inactivityTimeoutMs: z.number().int().positive().nullable(),
	allowedEndReasons: z.array(
		z.enum(['user_ended', 'timeout', 'error', 'feature_completed']),
	),
})

export const MiraSceneSchema = z.object({
	sceneId: z.string(),
	kind: MiraSceneKindSchema,
	audience: MiraAudienceSchema,
	brainContext: BrainContextSliceSchema,
	situationContext: z.unknown(),
	stimuli: MiraStimulusConfigSchema,
	capabilities: z.array(MiraCapabilitySchema),
	privacyBoundary: MiraPrivacyBoundarySchema,
	speechPolicy: MiraSpeechPolicySchema,
	exitPolicy: MiraExitPolicySchema,
})
```
