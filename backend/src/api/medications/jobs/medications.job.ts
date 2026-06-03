// all the medications jobs will be handled here.
// this acts as a main entry point for all the medications jobs.or orchestrator.

import { AppContext } from '@/index';
import { handleExtractDataJob } from '@/api/medications/jobs/extract-data.job';
import { apiErrorResponse } from '@/lib/response';
import { ErrorCode } from '@schnl/shared/types/api';

export async function medicationsJobOrchestrator(c: AppContext) {
	try {
		const payload = await c.req.json();
		const { type } = payload;
		switch (type) {
			case 'extract_data':
				return handleExtractDataJob(c);
			default:
				return c.json(apiErrorResponse(ErrorCode.INVALID_INPUT, 'Unknown medications job type'), 400);
		}
	} catch (error) {
		console.error('Medications job orchestrator error:', error);
		return c.json(
			apiErrorResponse(
				ErrorCode.PROCESSING_FAILED,
				'Failed to process medications job',
				error instanceof Error ? error.message : 'Unknown error'
			),
			500
		);
	}
}
