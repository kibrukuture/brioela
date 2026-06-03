import { z } from '@schnl/shared/zod';
import { DateSchema } from '../base/date.schema';

// medical/medication.schema.ts
export const MedicationSchema = z.object({
	name: z.string().min(1).describe('Medication name (brand or generic)'),

	generic_name: z.string().nullable().describe('Generic/active ingredient name if different from name'),

	dosage_amount: z.number().positive().nullable().describe('Numeric dosage amount'),

	dosage_unit: z.string().nullable().describe('Dosage unit (mg, mcg, mL, etc.)'),

	dosage_form: z
		.enum(['tablet', 'capsule', 'liquid', 'injection', 'cream', 'ointment', 'patch', 'inhaler', 'drops', 'suppository', 'other'])
		.nullable()
		.describe('Form of medication'),

	strength: z.string().nullable().describe('Strength as written (e.g., "500mg", "10mg/mL")'),

	route: z
		.enum([
			'oral',
			'topical',
			'intravenous',
			'intramuscular',
			'subcutaneous',
			'inhalation',
			'rectal',
			'ophthalmic',
			'otic',
			'nasal',
			'other',
		])
		.nullable()
		.describe('Route of administration'),

	frequency: z.string().nullable().describe('Frequency as written (e.g., "twice daily", "every 6 hours")'),

	duration: z.string().nullable().describe('Duration of treatment if specified'),

	quantity: z.number().int().positive().nullable().describe('Quantity prescribed'),

	refills: z.number().int().nonnegative().nullable().describe('Number of refills'),

	prescriber: z.string().nullable().describe('Prescribing physician name'),

	prescribed_date: DateSchema.nullable().describe('Date medication was prescribed'),

	instructions: z.string().nullable().describe('Special instructions or sig'),

	ndc_code: z.string().nullable().describe('National Drug Code if present'),
});
