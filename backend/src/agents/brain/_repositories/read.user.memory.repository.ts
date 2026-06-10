import { and, eq, getOne } from '@/database/drizzle/_database'
import { sql } from '@/database/sqlite/_schema'
import { userMemory } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'

export function readUserMemory(
	database: BrainDatabase,
	userId: string,
	namespace: string,
	key: string,
) {
	return getOne(
		database
			.select()
			.from(userMemory)
			.where(
				and(
					eq(userMemory.id, `${namespace}:${key}`),
					eq(userMemory.userId, userId),
					eq(userMemory.isActive, true),
				),
			),
	)
}

export function listUserMemories(
	database: BrainDatabase,
	userId: string,
	namespace: string,
) {
	return database
		.select()
		.from(userMemory)
		.where(
			and(
				eq(userMemory.userId, userId),
				eq(userMemory.namespace, namespace),
				eq(userMemory.isActive, true),
			),
		)
		.all()
}

export function countUserMemoryNamespaces(
	database: BrainDatabase,
	userId: string,
): number {
	const countRecord = getOne(
		database
			.select({
				count: sql<number>`count(distinct ${userMemory.namespace})`,
			})
			.from(userMemory)
			.where(
				and(
					eq(userMemory.userId, userId),
					eq(userMemory.isActive, true),
				),
			),
	)
	return countRecord !== null ? countRecord.count : 0
}
