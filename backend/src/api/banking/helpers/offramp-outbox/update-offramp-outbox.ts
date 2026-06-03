import dayjs from 'dayjs';
import { getDb } from '@/core/database/client';
import { eq } from '@schnl/shared/drizzle';
import { bankingOfframpOutbox } from '@schnl/shared/drizzle/schema/banking-offramp-outbox.schema';
import type { BankingOfframpOutbox } from '@schnl/shared/drizzle/schema/banking-offramp-outbox.schema';

export async function updateOfframpOutbox(
	id: string,
	data: Partial<Pick<BankingOfframpOutbox, 'status' | 'attempt' | 'nextRunAt' | 'lockedAt' | 'lockedBy' | 'lastError' | 'updatedAt'>>
): Promise<void> {
	const db = getDb();
	await db
		.update(bankingOfframpOutbox)
		.set({ ...data, updatedAt: dayjs().toDate() })
		.where(eq(bankingOfframpOutbox.id, id));
}
