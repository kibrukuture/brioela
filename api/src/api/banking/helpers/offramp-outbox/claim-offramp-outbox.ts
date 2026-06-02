import dayjs from 'dayjs';
import { getDb } from '@/core/database/client';
import { and, eq, isNull, or, sql } from '@schnl/shared/drizzle';
import { bankingOfframpOutbox } from '@schnl/shared/drizzle/schema/banking-offramp-outbox.schema';
import { OFFRAMP_OUTBOX_LOCK_TTL_MINUTES } from '@schnl/shared/constants/offramp-outbox';

type ClaimOfframpOutboxResult =
	| { claimed: true; row: typeof bankingOfframpOutbox.$inferSelect }
	| { claimed: false; row: typeof bankingOfframpOutbox.$inferSelect | undefined };

export async function claimOfframpOutbox(params: { outboxId: string; lockedBy: string }): Promise<ClaimOfframpOutboxResult> {
	const db = getDb();
	const now = dayjs();

	return db.transaction(async (tx) => {
		const [row] = await tx.select().from(bankingOfframpOutbox).where(eq(bankingOfframpOutbox.id, params.outboxId)).limit(1);
		if (!row) return { claimed: false, row: undefined };

		const lockExpired = row.lockedAt ? now.diff(dayjs(row.lockedAt), 'minute') > OFFRAMP_OUTBOX_LOCK_TTL_MINUTES : false;
		const canLock = row.status !== 'done' && (row.lockedAt === null || lockExpired);
		if (!canLock) return { claimed: false, row };

		const [updated] = await tx
			.update(bankingOfframpOutbox)
			.set({
				status: 'in_progress',
				lockedAt: now.toDate(),
				lockedBy: params.lockedBy,
				updatedAt: now.toDate(),
			})
			.where(
				and(
					eq(bankingOfframpOutbox.id, params.outboxId),
					or(
						isNull(bankingOfframpOutbox.lockedAt),
						sql`${bankingOfframpOutbox.lockedAt} < ${now.subtract(OFFRAMP_OUTBOX_LOCK_TTL_MINUTES, 'minute').toDate()}`
					)
				)
			)
			.returning();

		if (!updated) return { claimed: false, row };
		return { claimed: true, row: updated };
	});
}
