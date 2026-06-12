# Draft: maintenance-only tools (gap — files do not exist)

Targets under `backend/src/agents/brain/_tools/_executables/`:

- `get.skills.for.brain.maintenance.executable.ts`
- `get.personality.traits.for.brain.maintenance.executable.ts`
- `get.user.memory.for.brain.maintenance.executable.ts`
- `get.memory.events.since.executable.ts`
- `update.personality.trait.executable.ts`
- `archive.personality.trait.executable.ts`
- `create.personality.trait.executable.ts`

**Gap (feature 12):** None shipped. Spec: `implementable-specs/15-brain-maintenance-and-behavior-patterns.md` maintenance-specific tools section.

---

## get.skills.for.brain.maintenance.executable.ts (intended)

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
// import read helpers — no use_count / last_used_at mutation

export type BrainMaintenanceSkill = {
	name: string
	description: string
	content: string
	tags: string[]
	status: 'active' | 'stale' | 'archived'
	version: number
	useCount: number
	lastUsedAt: number | null
	createdAt: number
	updatedAt: number
	source: string
}

export function getSkillsForBrainMaintenanceExecutable(
	database: BrainDatabase,
	userId: string,
): { skills: BrainMaintenanceSkill[] } {
	// SELECT * FROM skills WHERE user_id = ? AND source = 'user'
	// NO increment use_count — maintenance read is not a usage signal
	return { skills: [] }
}
```

## get.memory.events.since.executable.ts (intended)

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'

export function getMemoryEventsSinceExecutable(
	database: BrainDatabase,
	input: { sinceTimestamp: number; limit?: number },
): {
	events: Array<{
		id: string
		kind: string
		payload: string
		capturedAt: number
		source: string
		entityKind: string | null
		entityId: string | null
	}>
	hasMore: boolean
} {
	const limit = Math.min(input.limit ?? 500, 2000)
	// ORDER BY created_at ASC WHERE captured_at > sinceTimestamp LIMIT limit+1
	return { events: [], hasMore: false }
}
```

## create.personality.trait.executable.ts (intended)

```typescript
import { z } from '@brioela/shared/zod'
import type { BrainDatabase } from '@/agents/brain/_database'
import { createId } from '@brioela/shared/_ids'

export const createPersonalityTraitInputSchema = z.object({
	trait: z.string().regex(/^[a-z][a-z0-9-]*$/).max(64),
	summary: z.string().min(1),
	evidence: z.array(z.string()).min(1),
	strength: z.number().min(0.3).max(0.7),
})

export function createPersonalityTraitExecutable(
	database: BrainDatabase,
	userId: string,
	input: z.infer<typeof createPersonalityTraitInputSchema>,
) {
	const now = Date.now()
	// INSERT user_personality — id, isActive=true, revised_count=0, inferred_at=now
	return { id: createId(), trait: input.trait, isActive: true }
}
```

**update.personality.trait** and **archive.personality.trait** follow same pattern per spec **15** input shapes.

**Forwarded tools:** `update_user_skill`, `archive_user_skill` reuse **06** executables when shipped — Brain RPC wraps with caller check.
