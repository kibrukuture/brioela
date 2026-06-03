import { z } from '@brioela/shared/zod';
export const BiomarkerSchema = z.object({
	name: z.string().min(1).describe('Biomarker name as written in the lab report'),

	value: z.number().describe('Measured numeric value'),

	unit: z.string().min(1).describe('Unit of measurement exactly as written (e.g., "mg/dL", "mmol/L")'),

	reference_range_min: z.number().nullable().describe('Minimum normal reference value from lab report'),

	reference_range_max: z.number().nullable().describe('Maximum normal reference value from lab report'),

	reference_range_text: z.string().nullable().describe('Raw reference range text if not numeric (e.g., "Negative", "Normal")'),

	flag: z.enum(['low', 'normal', 'high', 'critical_low', 'critical_high']).nullable().describe('Lab-provided status flag if present'),

	notes: z.string().nullable().describe('Any additional notes or comments from lab report'),

	test_method: z.string().nullable().describe('Testing methodology if specified'),
});
