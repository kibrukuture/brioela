/**
 * AI Model Configuration
 *
 * Centralized configuration for all AI models and their settings.
 * All models are typed for intellisense support.
 */

// ============================================================================
// OPENAI MODELS
// ============================================================================

/**
 * Available OpenAI models
 */
export const OPENAI_MODELS = {
	GPT_4_TURBO: 'gpt-4-turbo',
	GPT_4O: 'gpt-4o',
	GPT_4O_MINI: 'gpt-4o-mini',
	GPT_4O_2024_08_06: 'gpt-4o-2024-08-06', // Required for structured outputs
} as const;

/**
 * Type for OpenAI models (enables intellisense)
 */
export type OpenAIModel = (typeof OPENAI_MODELS)[keyof typeof OPENAI_MODELS];

// ============================================================================
// GEMINI MODELS
// ============================================================================

/**
 * Available Gemini models
 */
export const GEMINI_MODELS = {
	GEMINI_2_0_FLASH: 'gemini-2.0-flash',
} as const;

/**
 * Type for Gemini models (enables intellisense)
 */
export type GeminiModel = (typeof GEMINI_MODELS)[keyof typeof GEMINI_MODELS];

// ============================================================================
// FUNCTION-SPECIFIC MODEL CONFIGURATION
// ============================================================================

/**
 * AI model assigned to each function
 * Change models here to affect all function calls
 */
export const AI_FUNCTION_MODELS = {
	// Text extraction uses Gemini (better at OCR/document understanding)
	extractText: GEMINI_MODELS.GEMINI_2_0_FLASH,

	// Language detection uses fast model
	detectLanguage: OPENAI_MODELS.GPT_4O_MINI,

	// Data extraction uses structured output models
	extractBiomarkers: OPENAI_MODELS.GPT_4O_MINI,
	extractMedications: OPENAI_MODELS.GPT_4O_MINI,

	// Classification uses fast model
	classifyDocument: OPENAI_MODELS.GPT_4O_MINI,

	// Unit standardization uses fast model
	standardizeUnits: OPENAI_MODELS.GPT_4O_MINI,
} as const;

// ============================================================================
// TEMPERATURE SETTINGS
// ============================================================================

/**
 * Temperature settings for different use cases
 *
 * - 0: Deterministic (data extraction, factual tasks)
 * - 0.3-0.5: Slightly creative
 * - 0.7-0.9: Creative (generation tasks)
 */
export const AI_TEMPERATURE = {
	/** For data extraction - must be factual and consistent */
	DETERMINISTIC: 0,

	/** For slightly varied outputs */
	LOW_CREATIVITY: 0.3,

	/** For creative generation */
	CREATIVE: 0.7,
} as const;

/**
 * Temperature assigned to each function
 */
export const AI_FUNCTION_TEMPERATURE = {
	extractText: AI_TEMPERATURE.DETERMINISTIC,
	detectLanguage: AI_TEMPERATURE.DETERMINISTIC,
	extractBiomarkers: AI_TEMPERATURE.DETERMINISTIC,
	extractMedications: AI_TEMPERATURE.DETERMINISTIC,
	classifyDocument: AI_TEMPERATURE.DETERMINISTIC,
	standardizeUnits: AI_TEMPERATURE.DETERMINISTIC,
} as const;

// ============================================================================
// TOKEN LIMITS
// ============================================================================

/**
 * Maximum tokens for different operations
 */
export const AI_MAX_TOKENS = {
	/** For simple responses */
	SHORT: 500,

	/** For medium responses */
	MEDIUM: 2000,

	/** For long responses (large documents) */
	LONG: 4000,

	/** For very long responses */
	EXTRA_LONG: 8000,

	// [THIS IS FOR TEST]
	// ARTIFICAIL SMALL TOKEN SIZE SO THAT WE TEST THE MODEL THROUGWING ERROR.
	ARTIFICIAL_TEST_SMALL: 10, // FOR TEST ONLY.
} as const;

/**
 * Max tokens assigned to each function
 */
export const AI_FUNCTION_MAX_TOKENS = {
	extractText: AI_MAX_TOKENS.LONG,
	detectLanguage: AI_MAX_TOKENS.SHORT,
	extractBiomarkers: AI_MAX_TOKENS.LONG,
	extractMedications: AI_MAX_TOKENS.MEDIUM,
	classifyDocument: AI_MAX_TOKENS.SHORT,
	standardizeUnits: AI_MAX_TOKENS.SHORT,
	ARTIFICIAL_TEST_SMALL: AI_MAX_TOKENS.ARTIFICIAL_TEST_SMALL, // FOR TEST ONLY.
} as const;

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Available AI function names
 */
export type AIFunctionName = keyof typeof AI_FUNCTION_MODELS;

/**
 * Get model for a specific function
 */
export function getModelForFunction(functionName: AIFunctionName): OpenAIModel | GeminiModel {
	return AI_FUNCTION_MODELS[functionName];
}

/**
 * Get temperature for a specific function
 */
export function getTemperatureForFunction(functionName: AIFunctionName): number {
	return AI_FUNCTION_TEMPERATURE[functionName];
}

/**
 * Get max tokens for a specific function
 */
export function getMaxTokensForFunction(functionName: AIFunctionName): number {
	return AI_FUNCTION_MAX_TOKENS[functionName];
}
