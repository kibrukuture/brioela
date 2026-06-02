import { z } from '@schnl/shared/zod';
import { LanguageDetectionSchema } from '../base/language.schema';
import { ConfidenceSchema } from '../base/confidence.schema';
import { DateSchema } from '../base/date.schema';
import { BiomarkerSchema } from '../medical/biomarker.schema';

// documents/lab-work.schema.ts
export const LabWorkDocumentSchema = z.object({
	// Document metadata
	document_type: z.literal('lab_work').describe('Document type identifier'),

	language: LanguageDetectionSchema,

	confidence: ConfidenceSchema.describe('Overall extraction confidence'),

	// Lab information
	lab_name: z.string().nullable().describe('Name of laboratory'),

	lab_address: z.string().nullable().describe('Laboratory address if present'),

	lab_phone: z.string().nullable().describe('Laboratory phone number'),

	// Patient information
	patient_name: z.string().nullable().describe('Patient name if present on report'),

	patient_dob: DateSchema.nullable().describe('Patient date of birth'),

	patient_id: z.string().nullable().describe('Patient ID or medical record number'),

	// Test information
	test_date: DateSchema.describe('Date tests were performed'),

	collection_date: DateSchema.nullable().describe('Date specimen was collected if different from test date'),

	report_date: DateSchema.nullable().describe('Date report was generated'),

	test_panel_name: z.string().nullable().describe('Name of test panel (e.g., "Complete Blood Count", "Metabolic Panel")'),

	// Ordering physician
	ordering_physician: z.string().nullable().describe('Name of ordering physician'),

	// Biomarkers (main data)
	biomarkers: z.array(BiomarkerSchema).min(1).describe('All biomarkers/test results from the report'),

	// Additional info
	specimen_type: z.string().nullable().describe('Type of specimen (blood, urine, etc.)'),

	fasting_status: z.enum(['fasting', 'non_fasting', 'unknown']).nullable().describe('Whether patient was fasting'),

	clinical_notes: z.string().nullable().describe('Any clinical notes or interpretations from the report'),

	abnormal_flags: z.array(z.string()).nullable().describe('List of biomarkers flagged as abnormal'),
});
