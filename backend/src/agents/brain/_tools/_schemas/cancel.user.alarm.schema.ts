import { z } from '@brioela/shared/zod'

export const cancelUserAlarmSchema = z.object({
	id: z.uuid().describe('Alarm UUID to cancel.'),
	reason: z.string().min(1).optional().describe('Why this alarm is being cancelled.'),
})
