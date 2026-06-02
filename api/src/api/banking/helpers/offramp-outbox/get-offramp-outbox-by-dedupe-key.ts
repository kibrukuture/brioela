import { getDb } from '@/core/database/client';
import { eq } from '@schnl/shared/drizzle';
import { bankingOfframpOutbox } from '@schnl/shared/drizzle/schema/banking-offramp-outbox.schema';
import type { BankingOfframpOutbox } from '@schnl/shared/drizzle/schema/banking-offramp-outbox.schema';

export async function getOfframpOutboxByDedupeKey(dedupeKey: string): Promise<BankingOfframpOutbox | null> {
	const db = getDb();
	const [row] = await db.select().from(bankingOfframpOutbox).where(eq(bankingOfframpOutbox.dedupeKey, dedupeKey)).limit(1);
	return row ?? null;
}
