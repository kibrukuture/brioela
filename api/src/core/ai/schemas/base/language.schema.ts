import { z } from '@schnl/shared/zod';
import { ConfidenceSchema } from '@/core/ai/schemas/base/confidence.schema';

export const LanguageCodeSchema = z
	.string()
	.length(2)
	.regex(/^[a-z]{2}$/)
	.describe('ISO 639-1 language code (2 lowercase letters)');

export const LanguageDetectionSchema = z.object({
	primary_language: LanguageCodeSchema,
	confidence: ConfidenceSchema,
	detected_languages: z
		.array(
			z.object({
				language: LanguageCodeSchema,
				confidence: ConfidenceSchema,
				text_portion: z.number().min(0).max(1).describe('Portion of text in this language (0-1)'),
			})
		)
		.nullable() // [CHANGE] Change from .nullable() to .nullable()
		.describe('All detected languages if document is multilingual'),
});
