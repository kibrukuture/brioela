import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

const scheduledAlarmStatus = ['pending', 'processing', 'completed', 'failed', 'cancelled'] as const

export const scheduledAlarms = sqliteTable(
	'scheduled_alarms',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		alarmType: text('alarm_type').notNull(),
		payload: text('payload').notNull(),
		sdkScheduleId: text('sdk_schedule_id'),
		status: text('status', { enum: scheduledAlarmStatus }).notNull().default('pending'),
		attempts: integer('attempts', { mode: 'number' }).notNull().default(0),
		failureReason: text('failure_reason'),
		cancelledAt: integer('cancelled_at', { mode: 'number' }),
		cancelReason: text('cancel_reason'),
		rescheduledFromAlarmId: text('rescheduled_from_alarm_id'),
		rescheduledToAlarmId: text('rescheduled_to_alarm_id'),
		label: text('label'),
		scheduledAt: integer('scheduled_at', { mode: 'number' }).notNull(),
		startedAt: integer('started_at', { mode: 'number' }),
		completedAt: integer('completed_at', { mode: 'number' }),
		actionOutcomeStatus: text('action_outcome_status'),
		actionOutcomeJson: text('action_outcome_json'),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check('scheduled_alarms_payload_json_object_check', sql`json_valid(${table.payload}) and json_type(${table.payload}) = 'object'`),
		check(
			'scheduled_alarms_status_check',
			sql`${table.status} in ('pending', 'processing', 'completed', 'failed', 'cancelled')`,
		),
		check('scheduled_alarms_attempts_check', sql`${table.attempts} >= 0`),
		check('scheduled_alarms_cancelled_at_check', sql`${table.cancelledAt} is null or ${table.cancelledAt} >= 0`),
		check('scheduled_alarms_scheduled_at_check', sql`${table.scheduledAt} >= 0`),
		check('scheduled_alarms_started_at_check', sql`${table.startedAt} is null or ${table.startedAt} >= ${table.scheduledAt}`),
		check('scheduled_alarms_completed_at_check', sql`${table.completedAt} is null or ${table.completedAt} >= ${table.scheduledAt}`),
		check(
			'scheduled_alarms_action_outcome_json_object_check',
			sql`${table.actionOutcomeJson} is null or (json_valid(${table.actionOutcomeJson}) and json_type(${table.actionOutcomeJson}) = 'object')`,
		),
		check('scheduled_alarms_created_at_check', sql`${table.createdAt} >= 0`),
		check('scheduled_alarms_updated_at_check', sql`${table.updatedAt} >= ${table.createdAt}`),
		index('scheduled_alarms_status_scheduled_at_index').on(table.status, table.scheduledAt),
		index('scheduled_alarms_type_status_index').on(table.alarmType, table.status),
	],
)

export type BrainScheduledAlarm = typeof scheduledAlarms.$inferSelect
export type NewBrainScheduledAlarm = typeof scheduledAlarms.$inferInsert
