import { getDb } from '@/core/database/client';
import { pollingJobs } from '@brioela/shared/drizzle/schema/polling-jobs.schema';
import type { PollingJob } from '@brioela/shared/drizzle/schema/polling-jobs.schema';
import { eq } from '@brioela/shared/drizzle';

export async function getPollingJobById(id: string): Promise<PollingJob | undefined> {
	const db = getDb();
	const [row] = await db.select().from(pollingJobs).where(eq(pollingJobs.id, id)).limit(1);
	return row;
}
