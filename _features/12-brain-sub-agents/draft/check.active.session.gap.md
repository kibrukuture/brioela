# Draft: check.active.session.rpc.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_rpc/check.active.session.rpc.ts`

**Gap (feature 12):** Both maintenance agents require active-session guard per spec **15**. Not on `BrioelaBrain` today.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { eq } from 'drizzle-orm'
import type { BrainDatabase } from '@/agents/brain/_database'
import { sessions } from '@/agents/brain/_schemas'
import { z } from '@brioela/shared/zod'

export const checkActiveSessionInputSchema = z.object({
	userId: z.string().min(1),
})

export type CheckActiveSessionInput = z.infer<typeof checkActiveSessionInputSchema>

export type ActiveSessionCheck = {
	hasActiveSession: boolean
	sessionId: string | null
}

export function checkActiveSession(
	database: BrainDatabase,
	input: CheckActiveSessionInput,
): ActiveSessionCheck {
	const parsed = checkActiveSessionInputSchema.parse(input)

	const row = database
		.select({ id: sessions.id })
		.from(sessions)
		.where(eq(sessions.status, 'active'))
		.limit(1)
		.get()

	if (!row) {
		return { hasActiveSession: false, sessionId: null }
	}

	return { hasActiveSession: true, sessionId: row.id }
}
```

**Alternative:** read `agent_state.active_session_id` per **11-agent-state.md** — reconcile with `sessions.status = 'active'` query in **11** when both exist.

**Wire on:** `BrioelaBrain.checkActiveSession` `@callable()`.
