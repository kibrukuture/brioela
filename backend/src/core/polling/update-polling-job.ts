import dayjs from 'dayjs';
import { getDb } from '@/core/database/client';
import { pollingJobs } from '@brioela/shared/drizzle/schema/polling-jobs.schema';
import type { PollingJob } from '@brioela/shared/drizzle/schema/polling-jobs.schema';
import { eq } from '@brioela/shared/drizzle';

export async function updatePollingJob(
	id: string,
	data: Partial<Pick<PollingJob, 'status' | 'attempt' | 'nextRunAt' | 'ttlExpiry' | 'lastError' | 'updatedAt'>>
): Promise<void> {
	const db = getDb();
	await db
		.update(pollingJobs)
		.set({ ...data, updatedAt: dayjs().toDate() })
		.where(eq(pollingJobs.id, id));
}
