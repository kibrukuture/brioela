# Gap snapshot: camera-first Brioela onboarding screen

Target: `mobile/app/onboarding.tsx` (replace Schnl carousel) + `mobile/app/index.tsx` (route logic)

**Status:** Shipped file is Schnl/fintech carousel — not Brioela product onboarding. Spec: `brioela-specs/21-onboarding.md`; `build-guide/04-auth-and-onboarding/05-onboarding-flow.md`.

**Evidence:** `onboarding.tsx` renders 7-slide carousel (`Welcome`, `OnboardingTwo`, …, `Account`) with Schnl copy (`welcome.tsx`: "One health record"). Spec requires: full-screen "Point at something you're about to eat" → camera opens immediately → verdict under 3s.

```typescript
// Target shape — thin route; scanner UI owned by 24-scanner
import { Redirect } from 'expo-router'
import { useAuthStore } from '@/stores/account/use-auth-store'
import { ensureAnonymousSession } from '@/lib/auth/anonymous-session'
import { useIsomorphicLayoutEffect } from 'usehooks-ts'

export default function OnboardingScreen() {
  const { user, isLoading } = useAuthStore()

  useIsomorphicLayoutEffect(() => {
    if (!isLoading && !user) {
      void ensureAnonymousSession()
    }
  }, [isLoading, user])

  if (isLoading) return null

  // Camera-first: no carousel, no feature tour (21-onboarding.md)
  return <Redirect href="/camera" />
}
```

**Conflicts:** Current `NotifSetup` slide requests notifications before first scan — violates permission sequencing in `21-onboarding.md` § Permission Request Sequencing.
