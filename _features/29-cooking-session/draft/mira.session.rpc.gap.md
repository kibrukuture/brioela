# Gap snapshot: mira.session.rpc.ts

Target: `backend/src/agents/brain/_rpc/mira.session.rpc.ts`

**Status:** Not in repo. Typed Brain callable surface for Mira forwarding (**04** hardening).

```typescript
import { z } from 'zod'

export const miraForwardToolCallInputSchema = z.object({
	caller: z.literal('cooking'),
	tool: z.string().min(1),
	args: z.unknown(),
	sessionId: z.string().uuid(),
})

export type MiraForwardToolCallInput = z.infer<typeof miraForwardToolCallInputSchema>

export const finalizeCookingSessionInputSchema = z.object({
	sessionId: z.string().uuid(),
	endReason: z.enum(['user_ended', 'mobile_disconnected', 'timeout', 'error']),
	endedAt: z.number().int().positive(),
	outcomeSummary: z.string().optional(),
})

export type FinalizeCookingSessionInput = z.infer<typeof finalizeCookingSessionInputSchema>

/**
 * BrioelaBrain @callable() methods (target):
 * - forwardMiraToolCall(input: MiraForwardToolCallInput)
 * - finalizeCookingSession(input: FinalizeCookingSessionInput)
 * - loadCookingContextSlice(userId, sessionId, slice)
 */
