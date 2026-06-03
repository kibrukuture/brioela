import { z } from '@schnl/shared/zod';
import { ConfidenceSchema } from './confidence.schema';
// import { LanguageDetectionSchema } from './language.schema';
// base/extracted-text.schema.ts
export const ExtractedTextSchema = z.object({
	raw_text: z.string().describe('Complete extracted text from document'),
	// page_count: z.number().int().positive().nullable(),
	// confidence: ConfidenceSchema,
	// extraction_method: z.enum(['ocr', 'pdf_text', 'image_text']),
	// language: LanguageDetectionSchema.nullable(),
});
