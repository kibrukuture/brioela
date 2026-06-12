# Draft: chat.rpc.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_rpc/chat.rpc.ts`

**Gap (feature 20):** Zod boundary for `@callable() chat()`.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { z } from '@brioela/shared/zod'

export const chatTurnInputSchema = z.object({
	sessionId: z.string().uuid().optional(),
	message: z.string().min(1),
	closeAfterTurn: z.boolean().optional(),
})

export type ChatTurnInput = z.infer<typeof chatTurnInputSchema>

export type ChatTurnResponse = {
	sessionId: string
	assistantMessage: string
}
```

Export from `_rpc/index.ts` when **20** ships.
