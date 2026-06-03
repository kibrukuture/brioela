import { getDb } from '@/core/database/client';
import { dbPingers } from '@schnl/shared/drizzle/schema/db-pinger.schema';

export async function pingSupabase(): Promise<void> {
	try {
		const db = getDb();
		const existingRecords = await db.select().from(dbPingers);
		if (existingRecords && existingRecords.length > 0) {
			const deletedRecords = await db.delete(dbPingers).returning();
			console.log('Deleted records:', deletedRecords);
			return;
		}
		const newRecord = await db.insert(dbPingers).values({}).returning();
		console.log('New record:', newRecord);
	} catch (error: unknown) {
		console.error('Error pinging Supabase:', error);
	}
}
