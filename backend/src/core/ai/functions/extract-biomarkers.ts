import { z } from '@brioela/shared/zod';
import { AppContext } from '@/index';
import { makeStructuredCompletion } from '@/core/ai/utils/structured-completion';
import { BiomarkerSchema } from '@/core/ai/schemas';
import { AI_FUNCTION_MODELS } from '@/core/ai/config/ai-models.config';
import { AI_FUNCTION_TEMPERATURE, AI_FUNCTION_MAX_TOKENS } from '@/core/ai/config/ai-models.config';
import { getExtractBiomarkersPrompt } from '@/core/ai/prompts/extract-biomarkers.prompt';

const BiomarkersResponseSchema = z.object({
	biomarkers: z.array(BiomarkerSchema),
	overall_confidence: z.number().min(0).max(1),
});

export async function extractBiomarkers(c: AppContext, text: string) {
	const prompt = getExtractBiomarkersPrompt(text);

	return makeStructuredCompletion(c, {
		model: AI_FUNCTION_MODELS.extractBiomarkers,
		temperature: AI_FUNCTION_TEMPERATURE.extractBiomarkers,
		// maxTokens: AI_FUNCTION_MAX_TOKENS.extractBiomarkers,
		// token is never used nevertheless. we let ai determin the number of tokens it wants to use.
		maxTokens: AI_FUNCTION_MAX_TOKENS.ARTIFICIAL_TEST_SMALL, // FOR TEST ONLY.
		functionName: 'extract_biomarkers',
		functionDescription: 'Extract biomarkers from lab report',
		schema: BiomarkersResponseSchema,
		systemPrompt: prompt.system,
		userPrompt: prompt.user,
	});
}
