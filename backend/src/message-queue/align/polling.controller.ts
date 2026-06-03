import { AppContext } from '@/index';
import { apiSuccessResponse } from '@/lib/response';
import { runPollingJob } from '@/core/polling/run-polling-job';
import type { ResolvePollingOperation } from '@/core/polling/types';
import { syncAlignCustomerKycStatus } from '@/message-queue/align/helpers/sync-align-customer-kyc-status';
import { pollingJobPayloadSchema } from '@schnl/shared/validators/polling-job.validator';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import { API_ROUTES } from '@schnl/shared/api';
import { PUBLIC_URLS } from '@schnl/shared/constants/urls';

const resolvePollingOperation: ResolvePollingOperation = (job) => {
	const key = `${job.provider}:${job.operation}`;
	switch (key) {
		case 'align:sync-customer-kyc-status':
			// THIS IS SHOUD BE FUNCTION, SHOULD NOT BE INVOKED HERE
			return syncAlignCustomerKycStatus;
		default:
			return undefined;
	}
};

export async function onPollingJob(c: AppContext) {
	const body = await c.req.json();
	const validation = pollingJobPayloadSchema.safeParse(body);
	if (!validation.success) {
		throw new HTTPException(ErrorCode.BAD_REQUEST, {
			message: validation.error.issues[0]?.message ?? 'Invalid payload',
		});
	}
	const endpoint = `${PUBLIC_URLS.PUBLIC_API_BASE_URL}${API_ROUTES.queue['align.polling.eventsEndpoint']}`;

	const result = await runPollingJob({
		jobId: validation.data.jobId,
		resolvePollingOperation,
		url: endpoint,
	});
	return c.json(apiSuccessResponse(result));
}
