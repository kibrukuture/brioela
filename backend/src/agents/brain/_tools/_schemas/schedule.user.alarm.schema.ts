import { z, jsonValueSchema } from '@brioela/shared/zod'
import { readCurrentEpochMs } from '@/time/_helpers'

export const scheduleUserAlarmSchema = z
	.object({
		alarm_type: z.string().min(1).describe('Alarm type — free text, e.g. sickness_followup, travel_preload.'),
		scheduled_at: z.number().int().positive().describe('Unix timestamp ms when this alarm should fire.'),
		payload: z.record(z.string(), jsonValueSchema).default({}).describe('Context the handler needs at fire time.'),
		triggering_session_id: z.uuid().optional().describe('Session that scheduled this alarm. Omit for system-scheduled alarms.'),
		dedup_key: z.string().min(1).optional().describe('Dedup key — if provided, the alarm will not be scheduled if a pending alarm with the same dedup_key already exists for this user. Format: agent:scope[:id], e.g. brain:maintenance, cooking:review:recipe_123.'),
	})
	.refine(
		(data) => data.scheduled_at > readCurrentEpochMs(),
		{ message: 'scheduled_at must be a future timestamp', path: ['scheduled_at'] },
	)

