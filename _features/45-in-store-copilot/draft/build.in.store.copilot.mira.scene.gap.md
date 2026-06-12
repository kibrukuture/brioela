# Draft: build.in.store.copilot.mira.scene.helper.ts (gap — file does not exist)

Target: `backend/src/agents/mira/_scenes/build.in.store.copilot.mira.scene.helper.ts`

**Gap:** No `in_store_copilot` MiraScene. Resolves G5/G6 — **separate from `bela_shopper`**.

**Source:** `brioela-specs/45-in-store-copilot.md`, `build-guide/32-in-store-copilot/03-speech-rules-and-swaps.md`, `build-guide/30-mira/01-scene-contract.md`

---

```typescript
import type { ShopContextPayload } from '@brioela/shared/validator/shop/shop.context.payload.schema'
import type { MiraScene } from '@/agents/mira/_types/mira.scene.types'

export type InStoreCopilotSituation = {
  visitId: string
  placeId: string
  runningSpendEstimate: number
  pricedItemCount: number
  unpromptedInterventionCount: number
  baselineMentioned: boolean
  groundFindRelayed: boolean
  lastScanEventId: string | null
}

export type BuildInStoreCopilotMiraSceneInput = {
  userId: string
  sessionId: string
  context: ShopContextPayload
  situation: InStoreCopilotSituation
}

export async function buildInStoreCopilotMiraScene(
  input: BuildInStoreCopilotMiraSceneInput,
): Promise<MiraScene<InStoreCopilotSituation>> {
  return {
    sceneId: `in-store-${input.situation.visitId}`,
    kind: 'in_store_copilot',
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
      skills: 'none',
      recipes: 'none',
      health: 'active_condition_food_rules',
      injectedPayload: input.context,
    },
    situationContext: input.situation,
    stimuli: {
      audio: { enabled: true, sources: ['user'] },
      video: { enabled: false, framePurpose: null },
      events: ['scan_result', 'brain_context_update', 'user_action'],
    },
    capabilities: [
      {
        name: 'explain_scan_verdict',
        owner: 'mira_session',
        blocking: false,
        description: 'Answer user questions about a scan',
      },
      {
        name: 'suggest_personal_swap',
        owner: 'feature_state_machine',
        blocking: false,
        description: 'Volunteer swap only when evidence bar clears',
      },
      {
        name: 'relay_ground_find',
        owner: 'feature_state_machine',
        blocking: false,
        description: 'At most one find at session start',
      },
      {
        name: 'announce_spend_milestone',
        owner: 'feature_state_machine',
        blocking: false,
        description: 'Baseline crossing once per visit',
      },
      {
        name: 'warn_constraint',
        owner: 'mira_session',
        blocking: false,
        description: 'Speak hard/Mesa violations — user decides',
      },
    ],
    privacyBoundary: {
      rawAudioStorage: 'never',
      rawVideoStorage: 'never',
      transcriptStorage: 'turns_allowed',
      canRevealConstraintsToAudience: true,
      canRevealFullProfile: false,
      durableWrites: 'brain_and_feature',
    },
    exitPolicy: {
      onInactivityMinutes: 20,
      onExplicitEnd: true,
      onGeofenceExit: true,
    },
    speechPolicy: {
      defaultMode: 'answer_only',
      canInterrupt: true,
      shouldAskClarifyingQuestions: false,
      maxUtteranceSeconds: 12,
      silenceIsAllowed: true,
      maxUnpromptedInterventions: 3,
      safetyInterventionsUnlimited: true,
    },
  }
}
```
