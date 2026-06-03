import { getDb } from '@/core/database/client';
import { pollingJobs } from '@brioela/shared/drizzle/schema/polling-jobs.schema';
import type { NewPollingJob, PollingJob } from '@brioela/shared/drizzle/schema/polling-jobs.schema';

export async function insertPollingJob(payload: NewPollingJob): Promise<PollingJob> {
	const db = getDb();
	const [row] = await db.insert(pollingJobs).values(payload).returning();
	return row;
}
