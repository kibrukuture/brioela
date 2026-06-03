/**
 * Extract text from medical documents
 * Uses Gemini for OCR and document understanding
 */

import { getGeminiClient } from '@/core/ai/clients';
import { getExtractTextPrompt } from '@/core/ai/prompts';
import { ExtractedTextSchema } from '@/core/ai/schemas';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import { AI_FUNCTION_MODELS } from '@/core/ai/config/ai-models.config';
import type { AppContext } from '@/index';
import type { z } from '@brioela/shared/zod';

type ExtractedText = z.infer<typeof ExtractedTextSchema>;

/**
 * Extract text from document using Gemini
 *
 * @param c - Hono context
 * @param documentUrl - URL to document file (PDF or image)
 * @returns Extracted text with metadata
 */
export async function extractText(c: AppContext, documentUrl: string): Promise<ExtractedText> {
	// Get Gemini client from context
	const gemini = getGeminiClient(c);

	// Get prompt
	const prompt = getExtractTextPrompt();

	// Fetch document from URL
	const response = await fetch(documentUrl);
	if (!response.ok) {
		throw new HTTPException(ErrorCode.UPSTREAM_ERROR, { message: `Failed to fetch document: ${response.statusText}` });
	}

	const buffer = await response.arrayBuffer();
	const base64Data = Buffer.from(buffer).toString('base64');

	// Determine MIME type from URL or response
	const contentType = response.headers.get('content-type') || 'application/pdf';

	// Call Gemini with document
	const result = await gemini.models.generateContent({
		model: AI_FUNCTION_MODELS.extractText,
		contents: [
			{
				role: 'user',
				parts: [
					{ text: prompt.system },
					{
						inlineData: {
							data: base64Data,
							mimeType: contentType,
						},
					},
				],
			},
		],
	});

	const extractedText = result.text;

	// Build response object
	const output = {
		raw_text: extractedText,
		// confidence: 0.95, // Gemini doesn't provide confidence, use default high value
		// extraction_method: 'gemini' as const,
	};

	// Validate with Zod
	const validated = ExtractedTextSchema.parse(output);

	return validated;
}
