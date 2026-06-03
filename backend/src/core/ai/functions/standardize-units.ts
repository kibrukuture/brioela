import { AppContext } from '@/index';
import { makeStructuredCompletion } from '@/core/ai/utils/structured-completion';
import { AI_FUNCTION_MODELS } from '@/core/ai/config/ai-models.config';
import { AI_FUNCTION_TEMPERATURE, AI_FUNCTION_MAX_TOKENS } from '@/core/ai/config/ai-models.config';
import { StandardizedUnitSchema } from '@/core/ai/schemas';

import { getStandardizeUnitsPrompt, type StandardizeUnitsInput } from '@/core/ai/prompts/standardize-units.prompt';

export async function standardizeUnits(c: AppContext, input: StandardizeUnitsInput) {
	const prompt = getStandardizeUnitsPrompt(input);

	return makeStructuredCompletion(c, {
		model: AI_FUNCTION_MODELS.standardizeUnits,
		temperature: AI_FUNCTION_TEMPERATURE.standardizeUnits,
		maxTokens: AI_FUNCTION_MAX_TOKENS.standardizeUnits,
		functionName: 'standardize_units',
		functionDescription: 'Standardize the units of the input',
		schema: StandardizedUnitSchema,
		systemPrompt: prompt.system,
		userPrompt: prompt.user,
	});
}
