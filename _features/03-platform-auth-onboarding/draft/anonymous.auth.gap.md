# Gap snapshot: anonymous first-run auth

Target: `mobile/lib/auth/anonymous-session.ts` (new) + `mobile/stores/account/use-auth-store.ts` (extend `initializeAuth`)

**Status:** Not in repo. Spec: `brioela-specs/21-onboarding.md` (deferred account creation); `build-guide/04-auth-and-onboarding/00-overview.md` (Supabase anonymous identity before linking); `build-guide/04-auth-and-onboarding/05-onboarding-flow.md`.

**Evidence:** `rg signInAnonymously mobile/` — zero matches. `use-protected-route.ts` redirects to `/onboarding` when `!user`. `app/index.tsx` same. No anonymous session path exists.

```typescript
import { supabase } from '@/lib/auth/supabase'

/**
 * Ensures a Supabase user exists for first-run scan identity.
 * Anonymous users get a stable user.id for Brain DO addressing (05-brain).
 */
export async function ensureAnonymousSession(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) return

  const { error } = await supabase.auth.signInAnonymously()
  if (error) throw error
}
```

**Contract (from spec):** First app open → camera-first scan without Apple/Google/email. Anonymous `user.id` is the Brain DO key until `linkIdentity` to a permanent provider at save/contribute/voice gates.
