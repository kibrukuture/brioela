# Gap snapshot: Brain DO binding after login

Target: `backend/src/api/brain/handlers/ensure-brain.handler.ts` (new) + mobile post-auth hook

**Status:** Not wired. Brain DO uses `idFromName(userId)` in tests only. Spec: `build-guide/04-auth-and-onboarding/03-session-and-route-gating.md`; `build-guide/05-brain/01-do-class-and-setup.md`; **11** session lifecycle.

**Evidence:** `rg BRIOELA_BRAIN.idFromName backend/src/api` — zero in API layer. `_features/01-platform-foundation/status.md` G6. `_features/20-brain-chat-runtime/draft/brioela.brain.agent.chat-entrypoint.gap.md` — userId derivation TBD.

```typescript
import type { AppContext } from '@/index'

export async function ensureBrainForUser(c: AppContext) {
  const user = c.get('user')
  const stub = c.env.BRIOELA_BRAIN.get(c.env.BRIOELA_BRAIN.idFromName(user.id))
  // First RPC warms DO + runs SQLite migrations (04-brain-foundation)
  await stub.ping()
  return { ok: true as const }
}
```

**Contract:** Supabase `user.id` (anonymous or permanent) is the sole Brain DO address. Mobile should not generate a separate client-side brain id. Post-login / post-anonymous-session: optional `ensureBrain` call before first scan or chat (**20**).
