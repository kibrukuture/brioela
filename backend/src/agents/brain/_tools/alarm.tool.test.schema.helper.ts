import type { BrainDatabase } from '@/agents/brain/_database'
import { sql } from '@/database/sqlite/_schema'

export function ensureAlarmToolTestSchema(database: BrainDatabase): void {
	database.run(sql`
		CREATE TABLE IF NOT EXISTS scheduled_alarms (
			id TEXT PRIMARY KEY NOT NULL,
			user_id TEXT NOT NULL,
			alarm_type TEXT NOT NULL,
			triggering_session_id TEXT,
			payload TEXT NOT NULL,
			sdk_schedule_id TEXT,
			status TEXT NOT NULL DEFAULT 'pending',
			attempts INTEGER NOT NULL DEFAULT 0,
			failure_reason TEXT,
			cancelled_at INTEGER,
			cancel_reason TEXT,
			rescheduled_from_alarm_id TEXT,
			rescheduled_to_alarm_id TEXT,
			label TEXT,
			scheduled_at INTEGER NOT NULL,
			started_at INTEGER,
			completed_at INTEGER,
			action_outcome_status TEXT,
			action_outcome_json TEXT,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL,
			CONSTRAINT scheduled_alarms_payload_json_object_check CHECK(json_valid(payload) AND json_type(payload) = 'object'),
			CONSTRAINT scheduled_alarms_status_check CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
			CONSTRAINT scheduled_alarms_attempts_check CHECK(attempts >= 0),
			CONSTRAINT scheduled_alarms_cancelled_at_check CHECK(cancelled_at IS NULL OR cancelled_at >= 0),
			CONSTRAINT scheduled_alarms_scheduled_at_check CHECK(scheduled_at >= 0),
			CONSTRAINT scheduled_alarms_started_at_check CHECK(started_at IS NULL OR started_at >= scheduled_at),
			CONSTRAINT scheduled_alarms_completed_at_check CHECK(completed_at IS NULL OR completed_at >= scheduled_at),
			CONSTRAINT scheduled_alarms_action_outcome_json_object_check CHECK(action_outcome_json IS NULL OR (json_valid(action_outcome_json) AND json_type(action_outcome_json) = 'object')),
			CONSTRAINT scheduled_alarms_created_at_check CHECK(created_at >= 0),
			CONSTRAINT scheduled_alarms_updated_at_check CHECK(updated_at >= created_at)
		)
	`)
}
