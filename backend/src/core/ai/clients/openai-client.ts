import OpenAI from 'openai';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import { AppContext } from '@/index';

// ============================================================================
// CONFIGURATION
// ============================================================================

const OPENAI_CONFIG = {
	timeout: 60000, // 60 seconds
	maxRetries: 3, // Retry on failures
} as const;

export function getOpenAIClient(c: AppContext): OpenAI {
	const apiKey = process.env.OPENAI_API_KEY;

	if (!apiKey) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'OPENAI_API_KEY not configured in environment' });
	}

	// Create new client
	const client = new OpenAI({
		apiKey,
		timeout: OPENAI_CONFIG.timeout,
		maxRetries: OPENAI_CONFIG.maxRetries,
	});

	return client;
}
