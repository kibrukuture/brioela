import { AppContext } from '@/index';
import { makeStructuredCompletion } from '@/core/ai/utils/structured-completion';
import { AI_FUNCTION_MODELS } from '@/core/ai/config/ai-models.config';
import { AI_FUNCTION_TEMPERATURE, AI_FUNCTION_MAX_TOKENS } from '@/core/ai/config/ai-models.config';
import { DocumentClassificationSchema } from '@/core/ai/schemas';
import { getClassifyDocumentPrompt } from '@/core/ai/prompts/classify-document.prompt';

export async function classifyDocument(c: AppContext, text: string) {
	const prompt = getClassifyDocumentPrompt(text);

	return makeStructuredCompletion(c, {
		model: AI_FUNCTION_MODELS.classifyDocument,
		temperature: AI_FUNCTION_TEMPERATURE.classifyDocument,
		maxTokens: AI_FUNCTION_MAX_TOKENS.classifyDocument,
		functionName: 'classify_document',
		functionDescription: 'Classify the document into a category',
		schema: DocumentClassificationSchema,
		systemPrompt: prompt.system,
		userPrompt: prompt.user,
	});
}
