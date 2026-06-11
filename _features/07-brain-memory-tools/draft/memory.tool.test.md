# Draft: memory.tool.test.ts

Target: `backend/src/agents/brain/_tools/memory.tool.test.ts`

```typescript
import { runInDurableObject } from 'cloudflare:test'
import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { createDatabase } from '@/agents/brain/_database'
import { logMemoryEventTool } from '@/agents/brain/_tools/log.memory.event.tool'
import { writeUserMemoryTool } from '@/agents/brain/_tools/write.user.memory.tool'
import { readUserMemoryTool } from '@/agents/brain/_tools/read.user.memory.tool'
import { logMemoryEventExecutable } from '@/agents/brain/_tools/_executables/log.memory.event.executable'
import { writeUserMemoryExecutable } from '@/agents/brain/_tools/_executables/write.user.memory.executable'
import { readUserMemoryExecutable } from '@/agents/brain/_tools/_executables/read.user.memory.executable'
import { readUserMemory } from '@/agents/brain/_repositories'
import { memoryEvent } from '@/agents/brain/_schemas'
import { eq } from '@/database/drizzle/_database'

describe('Brain Memory Tools', () => {
	it('supports logging raw events with nanoid identifier', async () => {
		const brain = env.BRIOELA_BRAIN.get(env.BRIOELA_BRAIN.newUniqueId())
		await brain.checkReadiness()

		await runInDurableObject(brain, async (_, state) => {
			const database = createDatabase(state.storage)
			const userId = 'user-test-1'
			const sessionId = 'session-test-1'

			const eventTool = logMemoryEventTool(database, userId, sessionId)
			expect(eventTool).toBeDefined()

			const logged = await logMemoryEventExecutable(database, userId, sessionId, {
				kind: 'food_intake',
				payload: { dish: 'shiro wot', rating: 'excellent' },
				source: 'agent',
				entity_kind: 'food',
				entity_id: 'shiro',
			})

			expect(logged.status).toBe('logged')
			expect(logged.id.length).toBe(24)

			const row = database
				.select()
				.from(memoryEvent)
				.where(eq(memoryEvent.id, logged.id))
				.get()

			expect(row).toBeDefined()
			expect(row?.userId).toBe(userId)
			expect(row?.kind).toBe('food_intake')
			expect(JSON.parse(row?.payloadJson ?? '{}')).toEqual({ dish: 'shiro wot', rating: 'excellent' })
			expect(row?.sessionId).toBe(sessionId)
			expect(row?.entityKind).toBe('food')
			expect(row?.entityId).toBe('shiro')
		})
	})

	it('supports writing and merging user memory facts with a 40-namespace cap', async () => {
		const brain = env.BRIOELA_BRAIN.get(env.BRIOELA_BRAIN.newUniqueId())
		await brain.checkReadiness()

		await runInDurableObject(brain, async (_, state) => {
			const database = createDatabase(state.storage)
			const userId = 'user-test-2'

			const writeTool = writeUserMemoryTool(database, userId)
			expect(writeTool).toBeDefined()

			const firstWrite = await writeUserMemoryExecutable(database, userId, {
				namespace: 'health.diet',
				key: 'preferences',
				value: { spicy: true },
				confidence: 0.8,
				source: 'observed',
			})

			expect(firstWrite.status).toBe('written')
			expect(firstWrite.merged).toBe(false)

			const firstRow = readUserMemory(database, userId, 'health.diet', 'preferences')
			expect(firstRow).toBeDefined()
			expect(JSON.parse(firstRow?.value ?? '{}')).toEqual({ spicy: true })
			expect(firstRow?.confidence).toBe(0.8)

			const skippedWrite = await writeUserMemoryExecutable(database, userId, {
				namespace: 'health.diet',
				key: 'preferences',
				value: { spicy: false },
				confidence: 0.5,
				source: 'observed',
			})
			expect(skippedWrite.action).toBe('skipped')

			const statedWrite = await writeUserMemoryExecutable(database, userId, {
				namespace: 'health.diet',
				key: 'preferences',
				value: { vegetarian: true },
				confidence: 0.6,
				source: 'stated',
			})
			expect(statedWrite.status).toBe('written')
			expect(statedWrite.merged).toBe(true)

			const mergedRow = readUserMemory(database, userId, 'health.diet', 'preferences')
			expect(JSON.parse(mergedRow?.value ?? '{}')).toEqual({ spicy: true, vegetarian: true })
			expect(mergedRow?.confidence).toBe(0.6)

			for (let idx = 0; idx < 39; idx++) {
				await writeUserMemoryExecutable(database, userId, {
					namespace: `test.ns.n${idx}`,
					key: 'dummy',
					value: { val: idx },
					confidence: 1.0,
					source: 'stated',
				})
			}

			const limitUpdate = await writeUserMemoryExecutable(database, userId, {
				namespace: 'health.diet',
				key: 'preferences',
				value: { vegan: false },
				confidence: 1.0,
				source: 'stated',
			})
			expect(limitUpdate.status).toBe('written')

			const overCap = await writeUserMemoryExecutable(database, userId, {
				namespace: 'test.ns.blocked',
				key: 'dummy',
				value: { val: 999 },
				confidence: 1.0,
				source: 'stated',
			})
			expect(overCap.error).toBe('namespace_cap_reached')
		})
	})

	it('supports reading specific keys or full namespaces from user memory', async () => {
		const brain = env.BRIOELA_BRAIN.get(env.BRIOELA_BRAIN.newUniqueId())
		await brain.checkReadiness()

		await runInDurableObject(brain, async (_, state) => {
			const database = createDatabase(state.storage)
			const userId = 'user-test-3'

			const readTool = readUserMemoryTool(database, userId)
			expect(readTool).toBeDefined()

			await writeUserMemoryExecutable(database, userId, {
				namespace: 'cooking.pref',
				key: 'spice_level',
				value: { level: 'hot' },
				confidence: 0.9,
				source: 'stated',
			})

			await writeUserMemoryExecutable(database, userId, {
				namespace: 'cooking.pref',
				key: 'preferred_dishes',
				value: { Ethiopian: ['doro wat', 'shiro'] },
				confidence: 1.0,
				source: 'stated',
			})

			const readSingle = await readUserMemoryExecutable(database, userId, {
				namespace: 'cooking.pref',
				key: 'spice_level',
			})
			expect(readSingle.found).toBe(true)
			expect(readSingle.value).toEqual({ level: 'hot' })
			expect(readSingle.confidence).toBe(0.9)

			const readMissing = await readUserMemoryExecutable(database, userId, {
				namespace: 'cooking.pref',
				key: 'non_existent',
			})
			expect(readMissing.found).toBe(false)

			const readFull = await readUserMemoryExecutable(database, userId, {
				namespace: 'cooking.pref',
			})
			if ('entries' in readFull && readFull.entries) {
				expect(readFull.namespace).toBe('cooking.pref')
				expect(readFull.count).toBe(2)

				const expectedKeys = ['preferred_dishes', 'spice_level']
				const keysFound = readFull.entries.map((entry) => entry.key).sort()
				expect(keysFound).toEqual(expectedKeys)
			} else {
				throw new Error('Expected entries to be defined on full namespace read')
			}
		})
	})
})
```

> **Future tests when G1/G2 close:** importance on write; namespace list in cap error.
