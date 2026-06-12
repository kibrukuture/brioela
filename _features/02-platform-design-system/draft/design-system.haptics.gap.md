# Gap snapshot: design-system/haptics.ts

Target: `mobile/design-system/haptics.ts`

**Status:** Not in repo. Spec: `build-guide/01-design-system/08-haptics.md`.

```typescript
import * as Haptics from 'expo-haptics'
import { useUserPreferencesStore } from '@/stores/account/use-user-preferences'

function isHapticsEnabled(): boolean {
  return useUserPreferencesStore.getState().hapticsEnabled !== false
}

export const haptic = {
  selection: () => {
    if (!isHapticsEnabled()) return
    void Haptics.selectionAsync()
  },
  impact: {
    soft: () => {
      if (!isHapticsEnabled()) return
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
    },
    light: () => {
      if (!isHapticsEnabled()) return
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    },
    medium: () => {
      if (!isHapticsEnabled()) return
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    },
    heavy: () => {
      if (!isHapticsEnabled()) return
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    },
    rigid: () => {
      if (!isHapticsEnabled()) return
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
    },
  },
  verdict: {
    safe: () => {
      if (!isHapticsEnabled()) return
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    },
    caution: () => {
      if (!isHapticsEnabled()) return
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    },
    danger: () => {
      if (!isHapticsEnabled()) return
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    },
  },
} as const
```

**Production:** `expo-haptics` installed; feature code calls `Haptics.*` directly (e.g. `features/search/hooks/use-haptic-on-scroll.ts`, `components/profile/copy-button.tsx`). No semantic wrapper, no settings toggle wired to a design-system module.
