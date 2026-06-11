import type { BrainDatabase } from '@/agents/brain/_database'
import {
	incrementUserMemoryRead,
	listUserMemories,
	readUserMemory,
} from '@/agents/brain/_repositories'
import { type z, jsonValueSchema, type JsonValue } from '@brioela/shared/zod'
import type { readUserMemorySchema } from '@/agents/brain/_tools/_schemas/read.user.memory.schema'
import { readCurrentEpochMs } from '@/time/_helpers'

export const readUserMemoryExecutable = async (
	db: BrainDatabase,
	userId: string,
	{ namespace, key }: z.infer<typeof readUserMemorySchema>,
	waitUntil?: (promise: Promise<void>) => void,
) => {
	const now = readCurrentEpochMs()

	if (key) {
		const entry = readUserMemory(db, userId, namespace, key)
		if (!entry) {
			return { found: false, id: `${namespace}:${key}` }
		}

		const updatePromise = Promise.resolve().then(() => {
			incrementUserMemoryRead(db, entry.id, now)
		})
		if (waitUntil) {
			waitUntil(updatePromise)
		}

		try {
			return {
				found: true,
				id: entry.id,
				namespace: entry.namespace,
				key: entry.key,
				value: jsonValueSchema.parse(JSON.parse(entry.value)),
				confidence: entry.confidence,
				last_write: entry.lastWrite,
			}
		} catch (_) {
			return {
				found: true,
				id: entry.id,
				namespace: entry.namespace,
				key: entry.key,
				value: jsonValueSchema.parse(entry.value),
				confidence: entry.confidence,
				last_write: entry.lastWrite,
			}
		}
	} else {
		const entries = listUserMemories(db, userId, namespace)
		const parsedEntries = entries.map((entry) => {
			let parsedValue: JsonValue = entry.value
			try {
				parsedValue = jsonValueSchema.parse(JSON.parse(entry.value))
			} catch (_) {}

			return {
				key: entry.key,
				value: parsedValue,
				confidence: entry.confidence,
			}
		})

		return {
			namespace,
			count: parsedEntries.length,
			entries: parsedEntries,
		}
	}
}
