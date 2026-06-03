import { z } from '@schnl/shared/zod';
export const StandardizedUnitSchema = z.object({
	value: z.number().describe('Standardized numeric value'),
	unit: z.string().describe('Standardized unit of measurement'),
	conversion_factor: z.number().describe('Conversion factor from original unit to standardized unit'),
	original_unit: z.string().describe('Original unit of measurement'),
	original_value: z.number().describe('Original numeric value'),
	standardized_value: z.number().describe('Standardized numeric value'),
	standardized_unit: z.string().describe('Standardized unit of measurement'),
});
