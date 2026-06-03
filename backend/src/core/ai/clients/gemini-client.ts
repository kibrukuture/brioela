import { GoogleGenAI } from '@google/genai';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import { AppContext } from '@/index';

export function getGeminiClient(c: AppContext) {
	const apiKey = process.env.GEMINI_API_KEY;

	if (!apiKey) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'GEMINI_API_KEY not configured in environment' });
	}

	return new GoogleGenAI({ apiKey });
}
