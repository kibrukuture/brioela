import type { AppContext } from '@/index';
import type OpenAI from 'openai';
import { LengthFinishReasonError, ContentFilterFinishReasonError } from 'openai/error';
import { z } from '@brioela/shared/zod';
import { getOpenAIClient } from '@/core/ai/clients';
import { postProcessAIResponse } from '@/core/ai/utils/post-process-ai-response';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';

// ============================================================================
// TYPES
// ============================================================================

export interface StructuredCompletionOptions<T extends z.ZodType> {
	model: string;
	temperature: number;
	maxTokens?: number;
	functionName: string;
	functionDescription: string;
	schema: T;
	systemPrompt: string;
	userPrompt: string;
}

type CompletionMessages = { role: 'system' | 'user'; content: string }[];

// ============================================================================
// HELPER: Convert Zod schema to OpenAI tool format
// ============================================================================

function zodSchemaToTool<T extends z.ZodType>(name: string, description: string, schema: T): OpenAI.Chat.Completions.ChatCompletionTool {
	// ADD THESE LOGS:
	console.log('[zodSchemaToTool] schema:', schema);
	console.log('[zodSchemaToTool] schema type:', typeof schema);
	console.log('[zodSchemaToTool] schema._def:', schema?._def);
	console.log('[zodSchemaToTool] is ZodType:', schema instanceof z.ZodType);

	if (!schema || !schema._def) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: `[zodSchemaToTool] Invalid schema passed: ${schema}` });
	}

	// Use Zod v4's native JSON Schema converter
	const jsonSchema = z.toJSONSchema(schema, {
		target: 'openapi-3.0', // OpenAI compatible format
	});
	console.log('[zodSchemaToTool] jsonSchema', jsonSchema);

	// Remove $schema property (OpenAI doesn't need it)
	const { $schema, ...parametersSchema } = jsonSchema;

	console.log('[zodSchemaToTool] parametersSchema', parametersSchema);

	return {
		type: 'function',
		function: {
			name,
			description,
			parameters: parametersSchema,
			strict: true, // Enable Structured Outputs
		},
	};
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Make structured completion with intelligent fallback
 *
 * Uses chat.completions.parse() as primary method with automatic
 * fallback to chat.completions.create() on length errors.
 *
 * @param c - Hono context
 * @param options - Completion options with schema
 * @returns Validated, typed result
 */
export async function makeStructuredCompletion<T extends z.ZodType>(
	c: AppContext,
	options: StructuredCompletionOptions<T>
): Promise<z.infer<T>> {
	const openai = getOpenAIClient(c);

	const messages: CompletionMessages = [
		{ role: 'system', content: options.systemPrompt },
		{ role: 'user', content: options.userPrompt },
	];
	console.log('[Structured Completion] messages', messages);
	// Convert Zod schema to OpenAI tool format
	const tool = zodSchemaToTool(options.functionName, options.functionDescription, options.schema);
	console.log('[Structured Completion] tool', tool);
	// TRY METHOD 1: .parse() with tools (STRICT, TYPED)
	try {
		console.log(`[Structured Completion] Trying .parse() for ${options.functionName}`);

		const completion = await openai.chat.completions.parse({
			model: options.model,
			temperature: options.temperature,
			// !come check this back.
			// max_tokens: options.maxTokens,
			messages,
			tools: [tool],
			tool_choice: { type: 'function', function: { name: options.functionName } },
		});

		const toolCall = completion.choices[0]?.message.tool_calls?.[0];
		if (!toolCall || toolCall.type !== 'function') {
			throw new HTTPException(ErrorCode.UPSTREAM_ERROR, { message: 'No tool call returned from .parse()' });
		}

		// Get parsed arguments
		const result = toolCall.function.parsed_arguments;

		console.log('[Structured Completion] result', result);

		// Validate with Zod v4 (double-check)
		// const validated = options.schema.parse(result);
		// console.log('[Structured Completion] validated', validated);

		// Post-process: clean 0→null, ""→null, AND validate
		const cleaned = postProcessAIResponse(result, options.schema);
		console.log('[Structured Completion] cleaned', cleaned);

		// console.log(`[Structured Completion] ✅ .parse() succeeded`);
		// return validated;
		console.log(`[Structured Completion] ✅ .parse() succeeded`);
		return cleaned;
	} catch (error) {
		// Handle specific .parse() errors

		console.log('[Structured Completion] error', error);

		// Length error - fallback to .create()
		if (error instanceof LengthFinishReasonError) {
			console.log(`[Structured Completion] ⚠️  LengthFinishReasonError - falling back to .create()`);
			return fallbackToCreate(openai, options, messages, tool);
		}

		// Content filter - throw (safety issue, don't retry)
		if (error instanceof ContentFilterFinishReasonError) {
			console.error(`[Structured Completion] ❌ ContentFilterFinishReasonError - unsafe content`);
			throw new HTTPException(ErrorCode.UPSTREAM_ERROR, { message: `Content filter triggered: ${error.message}` });
		}

		// Other errors - throw
		console.error(`[Structured Completion] ❌ Unexpected error in .parse():`, error);
		throw error;
	}
}

// ============================================================================
// FALLBACK METHOD
// ============================================================================

/**
 * Fallback method using .create() with tools
 * Less strict than .parse() but still structured
 */
async function fallbackToCreate<T extends z.ZodType>(
	openai: OpenAI,
	options: StructuredCompletionOptions<T>,
	messages: CompletionMessages,
	tool: OpenAI.Chat.Completions.ChatCompletionTool
): Promise<z.infer<T>> {
	console.log(`[Structured Completion] Using .create() fallback`);

	const completion = await openai.chat.completions.create({
		model: options.model,
		temperature: options.temperature,
		// max_tokens: options.maxTokens,

		messages,
		tools: [tool],
		tool_choice: { type: 'function', function: { name: options.functionName } },
	});

	const toolCall = completion.choices[0]?.message.tool_calls?.[0];
	if (!toolCall || toolCall.type !== 'function') {
		throw new HTTPException(ErrorCode.UPSTREAM_ERROR, { message: 'No tool call returned from .create() fallback' });
	}

	// Parse JSON arguments manually
	const args = JSON.parse(toolCall.function.arguments);

	console.log('[Structured Completion] args', args);

	// // Validate with Zod v4
	// const validated = options.schema.parse(args);
	// console.log('[Structured Completion] validated', validated);
	// console.log(`[Structured Completion] ✅ .create() fallback succeeded`);
	// return validated;

	// Post-process: clean 0→null, ""→null, AND validate
	const cleaned = postProcessAIResponse(args, options.schema);
	console.log('[Structured Completion] cleaned', cleaned);

	console.log(`[Structured Completion] ✅ .create() fallback succeeded`);
	return cleaned;
}
