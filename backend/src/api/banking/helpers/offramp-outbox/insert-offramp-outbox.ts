import { getDb } from '@/core/database/client';
import { bankingOfframpOutbox } from '@schnl/shared/drizzle/schema/banking-offramp-outbox.schema';
import type { BankingOfframpOutbox, NewBankingOfframpOutbox } from '@schnl/shared/drizzle/schema/banking-offramp-outbox.schema';
import { getOfframpOutboxByDedupeKey } from '@/api/banking/helpers/offramp-outbox/get-offramp-outbox-by-dedupe-key';

export async function insertOfframpOutbox(payload: NewBankingOfframpOutbox): Promise<BankingOfframpOutbox> {
	const db = getDb();

	if (payload.dedupeKey) {
		const existing = await getOfframpOutboxByDedupeKey(payload.dedupeKey);
		if (existing) return existing;
	}

	try {
		const [row] = await db.insert(bankingOfframpOutbox).values(payload).returning();
		return row;
	} catch (error) {
		if (!payload.dedupeKey) throw error;
		const existing = await getOfframpOutboxByDedupeKey(payload.dedupeKey);
		if (existing) return existing;
		throw error;
	}
}
