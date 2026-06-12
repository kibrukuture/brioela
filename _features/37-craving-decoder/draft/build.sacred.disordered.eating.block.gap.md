# Draft: sacred block — disordered-eating guard (gap — not wired)

Target:
- `backend/src/agents/brain/_helpers/session/build.sacred.context.helper.ts`
- `backend/src/agents/brain/_schemas/session.sacred.context.schema.ts`

**Gap:** Spec **24** sacred block exists in docs; no `disordered_eating_guard` field in compression path.

**Source:** `build-guide/39-craving-decoder/03-safety-guard.md`, `brioela-specs/24-technical-architecture-backbone.md`

---

```typescript
import { z } from '@brioela/shared/zod'

export const SessionSacredContextSchema = z.object({
  hardAllergies: z.array(z.string()).default([]),
  activeConditions: z.array(z.string()).default([]),
  activeRecallAlertIds: z.array(z.string()).default([]),
  disorderedEatingGuardActive: z.boolean().default(false),
  disorderedEatingGuardCopy: z.string().optional(),
})

export type SessionSacredContext = z.infer<typeof SessionSacredContextSchema>

export function buildSacredContextBlock(ctx: SessionSacredContext): string {
  const parts: string[] = []

  if (ctx.disorderedEatingGuardActive) {
    parts.push(
      '[DISORDERED EATING GUARD — SACRED]',
      ctx.disorderedEatingGuardCopy ??
        'Do not analyze cravings, log craving_decoded events, or pattern-match eating behavior on this thread. Decline gently if asked.',
    )
  }

  // ... existing allergy / condition / recall blocks ...

  return parts.join('\n')
}
```

**Compression rule:** `compress.session.handler` must merge `sacred_block + compressed_middle + recent_tail` per spec **24** — guard block never summarized away.
