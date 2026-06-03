import { z } from '@brioela/shared/zod';
import { DateTimeSchema } from '../base/date.schema';

export const VitalSignSchema = z.object({
	type: z
		.enum(['blood_pressure', 'heart_rate', 'temperature', 'respiratory_rate', 'oxygen_saturation', 'weight', 'height', 'bmi'])
		.describe('Type of vital sign'),

	value: z.union([z.number(), z.string()]).describe('Value (string for blood pressure like "120/80")'),

	unit: z.string().describe('Unit of measurement'),

	measured_at: DateTimeSchema.nullable().describe('When measurement was taken'),

	notes: z.string().nullable(),
});
