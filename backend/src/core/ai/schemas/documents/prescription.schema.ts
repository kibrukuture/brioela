import { z } from '@brioela/shared/zod';
import { LanguageDetectionSchema } from '../base/language.schema';
import { ConfidenceSchema } from '../base/confidence.schema';
import { DateSchema } from '../base/date.schema';
import { MedicationSchema } from '../medical/medication.schema';

export const PrescriptionDocumentSchema = z.object({
	document_type: z.literal('prescription'),

	language: LanguageDetectionSchema,

	confidence: ConfidenceSchema,

	// Prescriber information
	prescriber_name: z.string().nullable().describe('Prescribing physician name'),

	prescriber_license: z.string().nullable().describe('Medical license number'),

	prescriber_dea: z.string().nullable().describe('DEA number if present'),

	prescriber_contact: z.string().nullable().describe('Prescriber phone or contact'),

	// Patient information
	patient_name: z.string().nullable(),

	patient_dob: DateSchema.nullable(),

	patient_address: z.string().nullable(),

	// Prescription details
	prescription_date: DateSchema.describe('Date prescription was written'),

	prescription_number: z.string().nullable().describe('Prescription number/ID'),

	// Medications (main data)
	medications: z.array(MedicationSchema).min(1).describe('All medications on this prescription'),

	// Pharmacy info
	pharmacy_name: z.string().nullable(),

	pharmacy_phone: z.string().nullable(),

	// Additional
	diagnosis: z.string().nullable().describe('Diagnosis or indication if present'),

	notes: z.string().nullable(),
});
