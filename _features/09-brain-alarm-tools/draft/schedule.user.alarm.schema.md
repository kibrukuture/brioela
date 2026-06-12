# Draft: schedule.user.alarm.schema

Target: `backend/src/agents/brain/_tools/_schemas/schedule.user.alarm.schema.ts`

```typescript
import { z, jsonValueSchema } from '@brioela/shared/zod'
import { readCurrentEpochMs } from '@/time/_helpers'

export const scheduleUserAlarmSchema = z
	.object({
		alarm_type: z.string().min(1).describe('Alarm type — free text, e.g. sickness_followup, travel_preload.'),
		scheduled_at: z.number().int().positive().describe('Unix timestamp ms when this alarm should fire.'),
		payload: z.record(z.string(), jsonValueSchema).default({}).describe('Context the handler needs at fire time.'),
		triggering_session_id: z.uuid().optional().describe('Session that scheduled this alarm. Omit for system-scheduled alarms.'),
	})
	.refine(
		(data) => data.scheduled_at > readCurrentEpochMs(),
		{ message: 'scheduled_at must be a future timestamp', path: ['scheduled_at'] },
	)

export const DEDUP_USER_ALARM_TYPES = ['brain_maintenance_run', 'behavior_pattern_detection'] as const
```
