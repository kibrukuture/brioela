import { check, index, integer, real, sql, sqliteTable, text } from '@/database/sqlite/_schema'

export const userMemory = sqliteTable(
	'user_memory',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		namespace: text('namespace').notNull(),
		key: text('key').notNull(),
		value: text('value').notNull(),
		confidence: real('confidence').notNull().default(1.0),
		source: text('source').notNull(),
		isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
		importance: integer('importance', { mode: 'number' }).notNull().default(5),
		readCount: integer('read_count', { mode: 'number' }).notNull().default(0),
		writeCount: integer('write_count', { mode: 'number' }).notNull().default(0),
		lastRead: integer('last_read', { mode: 'number' }),
		lastWrite: integer('last_write', { mode: 'number' }),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check('user_memory_value_json_object_check', sql`json_valid(${table.value}) and json_type(${table.value}) = 'object'`),
		check('user_memory_confidence_check', sql`${table.confidence} >= 0 and ${table.confidence} <= 1`),
		check('user_memory_is_active_check', sql`${table.isActive} in (0, 1)`),
		check('user_memory_importance_check', sql`${table.importance} >= 1 and ${table.importance} <= 10`),
		check('user_memory_read_count_check', sql`${table.readCount} >= 0`),
		check('user_memory_write_count_check', sql`${table.writeCount} >= 0`),
		check('user_memory_last_read_check', sql`${table.lastRead} is null or ${table.lastRead} >= 0`),
		check('user_memory_last_write_check', sql`${table.lastWrite} is null or ${table.lastWrite} >= 0`),
		check('user_memory_updated_at_check', sql`${table.updatedAt} >= 0`),
		index('user_memory_namespace_is_active_index').on(table.namespace, table.isActive),
		index('user_memory_is_active_last_write_index').on(table.isActive, table.lastWrite),
		index('user_memory_source_index').on(table.source),
	],
)

export type BrainUserMemory = typeof userMemory.$inferSelect
export type NewBrainUserMemory = typeof userMemory.$inferInsert
