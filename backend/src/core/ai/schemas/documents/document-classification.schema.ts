import { z } from '@brioela/shared/zod';
import { LanguageDetectionSchema } from '../base/language.schema';
import { ConfidenceSchema } from '../base/confidence.schema';

export const DocumentClassificationSchema = z.object({
	document_type: z
		.enum([
			'lab_work',
			'prescription',
			'medical_report',
			'insurance_card',
			'vaccination_record',
			'imaging_report',
			'referral',
			'consent_form',
			'other',
		])
		.describe('Primary document classification'),

	confidence: ConfidenceSchema,

	sub_type: z.string().nullable().describe('More specific sub-type if applicable'),

	language: LanguageDetectionSchema,

	contains_phi: z.boolean().describe('Whether document contains Protected Health Information'),

	suggested_category: z.string().nullable().describe('Suggested user-facing category'),
});
