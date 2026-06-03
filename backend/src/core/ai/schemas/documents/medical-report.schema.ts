// report by a doctor to patient.
import { z } from '@schnl/shared/zod';
import { LanguageDetectionSchema } from '../base/language.schema';
import { ConfidenceSchema } from '../base/confidence.schema';
import { DateSchema } from '../base/date.schema';
import { MedicationSchema } from '../medical/medication.schema';
import { VitalSignSchema } from '../medical/vital-sign.schema';

export const MedicalReportDocumentSchema = z.object({
	document_type: z.literal('medical_report'),

	language: LanguageDetectionSchema,

	confidence: ConfidenceSchema,

	report_type: z
		.enum(['consultation', 'discharge_summary', 'progress_note', 'operative_report', 'radiology', 'pathology', 'other'])
		.nullable()
		.describe('Type of medical report'),

	report_date: DateSchema,

	// Provider
	provider_name: z.string().nullable(),

	provider_specialty: z.string().nullable(),

	// Patient
	patient_name: z.string().nullable(),

	patient_dob: DateSchema.nullable(),

	// Report content
	chief_complaint: z.string().nullable().describe('Chief complaint or reason for visit'),

	diagnoses: z.array(z.string()).nullable().describe('List of diagnoses'),

	procedures: z.array(z.string()).nullable().describe('Procedures performed'),

	findings: z.string().nullable().describe('Clinical findings'),

	recommendations: z.string().nullable().describe('Treatment recommendations'),

	medications: z.array(MedicationSchema).nullable().describe('Medications mentioned in report'),

	vital_signs: z.array(VitalSignSchema).nullable().describe('Vital signs if present'),

	full_text: z.string().nullable().describe('Complete report text for reference'),
});
