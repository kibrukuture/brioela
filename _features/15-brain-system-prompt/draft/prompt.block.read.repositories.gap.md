# Draft: prompt.block.read.repositories.gap.md (gap — files do not exist)

Targets under `backend/src/agents/brain/_repositories/`:

- `read.prompt.constraints.repository.ts`
- `read.prompt.personality.repository.ts`
- `read.prompt.skills.repository.ts`
- `read.prompt.recipes.repository.ts`
- `read.prompt.alarms.repository.ts`
- `read.prompt.memory.repository.ts`
- `read.prompt.sessions.repository.ts`

**Gap (feature 15):** SQLite reads for prompt blocks — not consolidated in production.

---

## Intended production files (full snapshots — not yet created)

### read.prompt.constraints.repository.ts

```typescript
import { and, eq, inArray, ne } from '@/database/drizzle/_database'
import { constraints } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'

export function listNonRejectedUserConstraints(database: BrainDatabase, userId: string) {
	return database
		.select()
		.from(constraints)
		.where(
			and(
				eq(constraints.userId, userId),
				inArray(constraints.status, ['proposed', 'confirmed', 'auto_confirmed']),
			),
		)
		.all()
}
```

### read.prompt.personality.repository.ts

```typescript
import { and, desc, eq } from '@/database/drizzle/_database'
import { userPersonality } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'

type ListTraitsOptions = {
	limit: number
}

export function listActiveUserPersonalityTraits(
	database: BrainDatabase,
	userId: string,
	options: ListTraitsOptions,
) {
	return database
		.select()
		.from(userPersonality)
		.where(and(eq(userPersonality.userId, userId), eq(userPersonality.isActive, true)))
		.orderBy(desc(userPersonality.strength))
		.limit(options.limit)
		.all()
}
```

### read.prompt.skills.repository.ts

```typescript
import { and, desc, eq, inArray } from '@/database/drizzle/_database'
import { skills } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'

export function listSkillIndexRows(database: BrainDatabase, userId: string) {
	return database
		.select({ name: skills.name, description: skills.description })
		.from(skills)
		.where(
			and(
				eq(skills.userId, userId),
				inArray(skills.status, ['active', 'stale']),
			),
		)
		.orderBy(desc(skills.useCount))
		.all()
}
```

### read.prompt.recipes.repository.ts

```typescript
import { and, asc, eq } from '@/database/drizzle/_database'
import { recipes } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'

export function listActiveUserRecipeIndexRows(database: BrainDatabase, userId: string) {
	return database
		.select({ id: recipes.id, title: recipes.title })
		.from(recipes)
		.where(and(eq(recipes.userId, userId), eq(recipes.status, 'active')))
		.orderBy(asc(recipes.title))
		.all()
}
```

### read.prompt.alarms.repository.ts

```typescript
import { and, asc, eq, ne } from '@/database/drizzle/_database'
import { scheduledAlarms } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'

export function listPendingUserAlarmsForPrompt(database: BrainDatabase, userId: string) {
	return database
		.select()
		.from(scheduledAlarms)
		.where(
			and(
				eq(scheduledAlarms.userId, userId),
				eq(scheduledAlarms.status, 'pending'),
				ne(scheduledAlarms.alarmType, 'session_watchdog'),
			),
		)
		.orderBy(asc(scheduledAlarms.scheduledAt))
		.all()
}
```

### read.prompt.memory.repository.ts

```typescript
import { and, asc, eq, inArray } from '@/database/drizzle/_database'
import { userMemory } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'

export function listActiveUserMemoriesForNamespaces(
	database: BrainDatabase,
	userId: string,
	namespaces: readonly string[],
) {
	if (namespaces.length === 0) return []
	return database
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
}

export function listDistinctActiveMemoryNamespaces(database: BrainDatabase, userId: string) {
	const rows = database
		.selectDistinct({ namespace: userMemory.namespace })
		.from(userMemory)
		.where(and(eq(userMemory.userId, userId), eq(userMemory.isActive, true)))
		.orderBy(asc(userMemory.namespace))
		.all()
	return rows.map((row) => row.namespace)
}
```

### read.prompt.sessions.repository.ts

```typescript
import { and, desc, eq, getOne, isNotNull } from '@/database/drizzle/_database'
import { sessions } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'

export function readLastCompletedSessionOutcome(
	database: BrainDatabase,
	userId: string,
): string | null {
	const row = getOne(
		database
			.select({ outcomeSummary: sessions.outcomeSummary })
			.from(sessions)
			.where(
				and(
					eq(sessions.userId, userId),
					eq(sessions.status, 'completed'),
					isNotNull(sessions.endedAt),
					isNotNull(sessions.outcomeSummary),
				),
			)
			.orderBy(desc(sessions.endedAt))
			.limit(1),
	)
	return row?.outcomeSummary ?? null
}
```

Export all from `_repositories/index.ts`.

Source: `build-guide/05-brain/03-session-lifecycle.md`; `_features/15-brain-system-prompt/spec.md` per-block sections.
