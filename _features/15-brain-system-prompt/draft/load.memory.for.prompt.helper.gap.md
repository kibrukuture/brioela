# Draft: load.memory.for.prompt.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/load.memory.for.prompt.helper.ts`

**Gap (feature 15):** Block 4 loader with fire-and-forget read_count bump per `02-user-memory.md`.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { and, eq, inArray } from '@/database/drizzle/_database'
import { sql } from '@/database/sqlite/_schema'
import { userMemory } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { BrainUserMemory } from '@/agents/brain/_schemas'
import { readCurrentEpochMs } from '@/time/_helpers'

export async function loadMemoryForPrompt(
	database: BrainDatabase,
	userId: string,
	namespaces: readonly string[],
): Promise<BrainUserMemory[]> {
	if (namespaces.length === 0) {
		return []
	}

	const entries = database
		.select()
		.from(userMemory)
		.where(
			and(
				eq(userMemory.userId, userId),
				eq(userMemory.isActive, true),
				inArray(userMemory.namespace, [...namespaces]),
			),
		)
		.all()

	if (entries.length === 0) {
		return []
	}

	const now = readCurrentEpochMs()
	const ids = entries.map((entry) => entry.id)

	database
		.update(userMemory)
		.set({
			readCount: sql`${userMemory.readCount} + 1`,
			lastRead: now,
		})
		.where(inArray(userMemory.id, ids))
		.run()

	return entries
}
```

Source: `implementable-specs/02-user-memory.md` § read_count Side Effect.

**Note:** When Brain DO has `ExecutionContext`, caller may wrap bump in `waitUntil` — helper uses synchronous `.run()` fire-and-forget pattern from spec snippet.
