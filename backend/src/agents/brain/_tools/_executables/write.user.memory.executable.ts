import type { BrainDatabase } from '@/agents/brain/_database'
import {
	countUserMemoryNamespaces,
	readUserMemory,
	writeUserMemory,
} from '@/agents/brain/_repositories'
import type { z } from '@brioela/shared/zod'
import type { writeUserMemorySchema } from '@/agents/brain/_tools/_schemas/write.user.memory.schema'
import type { JsonValue } from '@/agents/brain/_tools/_schemas/json.value.schema'

export async function writeUserMemoryExecute(
	db: BrainDatabase,
	userId: string,
	{ namespace, key, value, confidence, source }: z.infer<typeof writeUserMemorySchema>,
) {
	const id = `${namespace}:${key}`
	const existing = readUserMemory(db, userId, namespace, key)

	const isNewNamespace = !existing
	if (isNewNamespace) {
		const namespaceCount = countUserMemoryNamespaces(db, userId)
		if (namespaceCount >= 40) {
			return {
				error: 'namespace_cap_reached',
				current: namespaceCount,
				max: 40,
				reason: '40-namespace cap reached. Archive or consolidate before adding new namespaces.',
			}
		}
	}

	let mergedValue: Record<string, JsonValue> = value
	let mergedConfidence = confidence

	if (existing) {
		if (confidence <= existing.confidence && source !== 'stated') {
			return {
				action: 'skipped',
				reason: 'existing confidence is equal or higher and source is not stated',
			}
		}

		try {
			const oldObj = JSON.parse(existing.value) as Record<string, JsonValue>
			mergedValue = { ...oldObj, ...value }
		} catch (_) {
			mergedValue = value
		}
	}

	const now = Date.now()
	const written = writeUserMemory(db, {
		id,
		userId,
		namespace,
		key,
		value: JSON.stringify(mergedValue),
		confidence: mergedConfidence,
		source,
		isActive: true,
		writeCount: (existing?.writeCount ?? 0) + 1,
		lastWrite: now,
		updatedAt: now,
		readCount: existing?.readCount ?? 0,
		lastRead: existing?.lastRead ?? null,
		importance: existing?.importance ?? 5,
	})

	return {
		id: written.id,
		merged: !!existing,
		write_count: written.writeCount,
		status: 'written',
	}
}
