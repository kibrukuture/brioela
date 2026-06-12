# Gap snapshot: anonymous → permanent account linking

Target: `mobile/features/auth/hooks/use-link-identity.ts` (new) + updates to `mobile/features/auth/components/account.tsx`

**Status:** Not in repo. Spec: `build-guide/04-auth-and-onboarding/02-sign-in-methods.md` (link anonymous user to Apple/Google); `brioela-specs/21-onboarding.md` (Apple/Google only at sign-up prompt).

**Evidence:** `account.tsx` calls `signInWithIdToken` directly — no `linkIdentity`. `rg linkIdentity mobile/` — zero.

```typescript
import { supabase } from '@/lib/auth/supabase'

type LinkProvider = 'google' | 'apple'

export async function linkProviderIdentity(
  provider: LinkProvider,
  token: string
): Promise<{ userId: string }> {
  const { data: { user: current } } = await supabase.auth.getUser()
  if (!current) throw new Error('No session to link')

  const isAnonymous = current.is_anonymous === true
  if (isAnonymous) {
    const { data, error } = await supabase.auth.linkIdentity({
      provider,
      token,
    })
    if (error) throw error
    if (!data.user) throw new Error('Link succeeded without user')
    return { userId: data.user.id }
  }

  const { data, error } = await supabase.auth.signInWithIdToken({ provider, token })
  if (error) throw error
  if (!data.user) throw new Error('Sign-in without user')
  return { userId: data.user.id }
}
```

**Rule:** Preserve `user.id` across anonymous → linked transition so Brain DO data is not orphaned (`build-guide/04-auth-and-onboarding/03-session-and-route-gating.md`).
