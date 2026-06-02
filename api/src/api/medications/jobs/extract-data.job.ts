import { getDb } from '@/core/database/client';
import { apiErrorResponse, apiSuccessResponse } from '@/lib/response';
import { ErrorCode } from '@schnl/shared/types/api';
import { AppContext } from '@/index';
import { HTTPException } from 'hono/http-exception';

interface ExtractDataJobPayload {
	type: 'extract_data';
	documentId: string;
	userId: string;
	fileUrl: string;
	fileType: string;
}

export async function handleExtractDataJob(c: AppContext) {
	try {
		const payload: ExtractDataJobPayload = await c.req.json();

		if (!payload || payload.type !== 'extract_data') {
			throw new HTTPException(400, {
				message: 'Invalid job payload',
			});
		}

		const { documentId, userId, fileUrl, fileType } = payload;

		const db = getDb();

		// TODO: Call AI extraction service here
		// const extractedData = await extractMedicationData(fileUrl, fileType);

		// TODO: Create user_medications records
		// TODO: Create user_document_links

		return c.json({ success: true, documentId });
	} catch (err) {
		console.error('Extract data job error:', err);

		// Update status to failed
		const payload: ExtractDataJobPayload = await c.req.json();
		if (payload.documentId) {
			const db = getDb();
		} else {
			return c.json(apiErrorResponse(ErrorCode.EXTRACTION_FAILED, 'Failed to extract data'), 500);
		}

		return c.json(apiSuccessResponse({ success: true, documentId: payload.documentId }));
	}
}
