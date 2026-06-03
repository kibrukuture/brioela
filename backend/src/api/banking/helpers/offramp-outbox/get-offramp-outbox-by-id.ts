import { getDb } from '@/core/database/client';
import { eq } from '@schnl/shared/drizzle';
import { bankingOfframpOutbox } from '@schnl/shared/drizzle/schema/banking-offramp-outbox.schema';
import type { BankingOfframpOutbox } from '@schnl/shared/drizzle/schema/banking-offramp-outbox.schema';

export async function getOfframpOutboxById(id: string): Promise<BankingOfframpOutbox | undefined> {
	const db = getDb();
	const [row] = await db.select().from(bankingOfframpOutbox).where(eq(bankingOfframpOutbox.id, id)).limit(1);
	return row;
}
