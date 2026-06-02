import { AppContext } from '@/index';
import { makeStructuredCompletion } from '@/core/ai/utils/structured-completion';
import { AI_FUNCTION_MODELS } from '@/core/ai/config/ai-models.config';
import { AI_FUNCTION_TEMPERATURE, AI_FUNCTION_MAX_TOKENS } from '@/core/ai/config/ai-models.config';
import { getDetectLanguagePrompt } from '@/core/ai/prompts/detect-language.prompt';
import { LanguageDetectionSchema } from '@/core/ai/schemas';

export async function detectLanguage(c: AppContext, text: string) {
	const prompt = getDetectLanguagePrompt(text);
	console.log('prompt', prompt);

	const result = await makeStructuredCompletion(c, {
		model: AI_FUNCTION_MODELS.detectLanguage,
		temperature: AI_FUNCTION_TEMPERATURE.detectLanguage,
		maxTokens: AI_FUNCTION_MAX_TOKENS.detectLanguage,
		// token is never used nevertheless. we let ai determin the number of tokens it wants to use.
		functionName: 'detect_language',
		functionDescription: 'Detect the primary language of the provided text',
		schema: LanguageDetectionSchema,
		systemPrompt: prompt.system,
		userPrompt: prompt.user,
	});

	console.log('[detectLanguage] result', result);
	return result;
}
