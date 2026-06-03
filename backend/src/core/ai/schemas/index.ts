// base schamas only
export { ConfidenceSchema } from '@/core/ai/schemas/base/confidence.schema';
export { DateSchema } from '@/core/ai/schemas/base/date.schema';
export { ExtractedTextSchema } from '@/core/ai/schemas/base/extracted-text.schema';
export { LanguageDetectionSchema } from '@/core/ai/schemas/base/language.schema';
export { AIErrorSchema } from '@/core/ai/schemas/base/error.schema';

// documents schemas only
export { DocumentClassificationSchema } from '@/core/ai/schemas/documents/document-classification.schema';
export { LabWorkDocumentSchema } from '@/core/ai/schemas/documents/lab-work.schema';
export { PrescriptionDocumentSchema } from '@/core/ai/schemas/documents/prescription.schema';
export { MedicalReportDocumentSchema } from '@/core/ai/schemas/documents/medical-report.schema';

// medical schemas only
export { BiomarkerSchema } from '@/core/ai/schemas/medical/biomarker.schema';
export { MedicationSchema } from '@/core/ai/schemas/medical/medication.schema';
export { VitalSignSchema } from '@/core/ai/schemas/medical/vital-sign.schema';

// standard schemas only
export { StandardizedUnitSchema } from '@/core/ai/schemas/standard/index';

// Why This Fixes It

// .optional() means the field can be missing entirely from the object
// .nullable() means the field must be present, but can be null
// OpenAI's strict: true requires all fields to exist, so .nullable() is the correct approach

// After You Fix It
// Once you deploy this change, we can run all 6 stress tests I prepared! The schema will now properly handle:

// Fields with values: reference_range_min: 13.5
// Fields without values: reference_range_min: null

// Let me know when you've updated the schema and we'll test! 🚀
