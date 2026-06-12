# Gap snapshot: menu-language-bridge.scene.ts

Target: `backend/src/agents/mira/scenes/menu-language-bridge.scene.ts`

**Status:** Not in repo. **29**/**30** owns MiraSession runtime; **26** defines situation context. From `build-guide/17-menu-scanning/08-language-bridge.md`, `30-mira/01-scene-contract.md`.

```typescript
import type { MiraScene } from '@brioela/shared/validator/mira.scene'
import type { MenuDishVerdict } from '@brioela/shared/validator/menu.scan'

export type MenuLanguageBridgeSituation = {
  scanId: string
  dish: MenuDishVerdict
  userLanguage: string
  staffLanguage: string
  primaryQuestion: string
  staffLanguageQuestion: string
  allowedTopics: ['ingredients', 'preparation', 'modifications', 'ordering']
}

export function buildMenuLanguageBridgeScene(
  userId: string,
  situation: MenuLanguageBridgeSituation,
): MiraScene<MenuLanguageBridgeSituation> {
  return {
    sceneId: crypto.randomUUID(),
    kind: 'menu_language_bridge',
    audience: {
      primary: 'staff',
      participants: [
        {
          participantId: userId,
          relationshipToUser: 'self',
          language: situation.userLanguage,
          canHearMira: true,
          canSeePrivateUserContext: true,
        },
        {
          participantId: 'staff',
          relationshipToUser: 'staff',
          language: situation.staffLanguage,
          canHearMira: true,
          canSeePrivateUserContext: false,
        },
      ],
    },
    brainContext: {
      userId,
      constraints: 'hard_only',
      memory: 'session_relevant',
      skills: 'none',
      recipes: 'none',
      medications: 'none',
    },
    situationContext: situation,
    stimuli: { voice: true, camera: false, screen: true },
    capabilities: ['speak_staff_language', 'summarize_staff_reply', 'confirm_before_order'],
    privacyBoundary: {
      shareFullProfile: false,
      shareMedicalDiagnosis: false,
      shareOnlyConstraintMentionedInQuestion: true,
    },
    speechPolicy: {
      speakToStaffLanguage: situation.staffLanguage,
      speakToUserLanguage: situation.userLanguage,
      summarizeHardConstraintAnswersBeforeOrder: true,
    },
    exitPolicy: {
      onOrderConfirmed: 'close_scene',
      onUserCancel: 'close_scene',
    },
  }
}
```

**Entry:** User taps "Ask for me" or says "Brioela, talk to the waiter."
