import { PollingJobStatus } from '@schnl/shared/drizzle/schema/polling-jobs.schema';
import type { PollingJob } from '@schnl/shared/drizzle/schema/polling-jobs.schema';
import { updatePollingJob } from '@/core/polling/update-polling-job';

type PollingStatus = (typeof PollingJobStatus.enumValues)[number];

type MarkPollingJobExtra = Partial<Pick<PollingJob, 'attempt' | 'nextRunAt' | 'ttlExpiry' | 'lastError'>>;

export async function markPollingJob(id: string, status: PollingStatus, extra?: MarkPollingJobExtra): Promise<void> {
	await updatePollingJob(id, { status, ...extra });
}
