import { and, eq } from '@brioela/shared/drizzle';
import { bankingLedgerAccounts, bankingLedgerEntries, bankingLedgerHolds } from '@brioela/shared/drizzle/schema';
import { parseAmountAtomic } from '@brioela/shared/utils/money';
import type { BankingCurrencyCode, Tx } from '@/api/banking/helpers/ledger/types';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';

function assertNonNegativeAtomic(value: bigint, message: string) {
	if (value < 0n) throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message });
}

export async function createHold(params: {
	tx: Tx;
	userId: string;
	currency: BankingCurrencyCode;
	amountAtomic: string;
	referenceType: string;
	referenceId: string;
	expiresAt: Date;
	description?: string;
}) {
	const amountAtomic = parseAmountAtomic(params.amountAtomic);
	if (amountAtomic <= 0n) throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Amount must be greater than 0' });

	const [account] = await params.tx
		.select()
		.from(bankingLedgerAccounts)
		.where(and(eq(bankingLedgerAccounts.userId, params.userId), eq(bankingLedgerAccounts.currency, params.currency)))
		.limit(1);

	const ledgerAccount =
		account ??
		(
			await params.tx
				.insert(bankingLedgerAccounts)
				.values({
					userId: params.userId,
					currency: params.currency,
					balanceAvailableAtomic: 0n,
					balanceHeldAtomic: 0n,
				})
				.returning()
		)[0];

	const availableAtomic = BigInt(String(ledgerAccount.balanceAvailableAtomic));
	const heldAtomic = BigInt(String(ledgerAccount.balanceHeldAtomic));
	assertNonNegativeAtomic(availableAtomic - amountAtomic, 'Insufficient available balance');

	const nextAvailable = availableAtomic - amountAtomic;
	const nextHeld = heldAtomic + amountAtomic;

	await params.tx
		.update(bankingLedgerAccounts)
		.set({
			balanceAvailableAtomic: nextAvailable,
			balanceHeldAtomic: nextHeld,
			updatedAt: new Date(),
		})
		.where(eq(bankingLedgerAccounts.id, ledgerAccount.id));

	await params.tx.insert(bankingLedgerEntries).values({
		userId: params.userId,
		accountId: ledgerAccount.id,
		currency: params.currency,
		type: 'hold',
		amountAtomic,
		referenceType: params.referenceType,
		referenceId: params.referenceId,
		description: params.description,
	});

	const [hold] = await params.tx
		.insert(bankingLedgerHolds)
		.values({
			userId: params.userId,
			accountId: ledgerAccount.id,
			currency: params.currency,
			amountAtomic,
			status: 'active',
			referenceType: params.referenceType,
			referenceId: params.referenceId,
			expiresAt: params.expiresAt,
		})
		.returning();

	return { account: ledgerAccount, hold };
}

export async function releaseHold(params: { tx: Tx; holdId: string; userId: string; reason?: string }) {
	const [hold] = await params.tx.select().from(bankingLedgerHolds).where(eq(bankingLedgerHolds.id, params.holdId)).limit(1);

	if (!hold) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Hold not found' });
	if (hold.userId !== params.userId) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });
	if (hold.status !== 'active') return { released: false };

	const [account] = await params.tx.select().from(bankingLedgerAccounts).where(eq(bankingLedgerAccounts.id, hold.accountId)).limit(1);

	if (!account) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Ledger account not found' });

	const amountAtomic = BigInt(String(hold.amountAtomic));
	const availableAtomic = BigInt(String(account.balanceAvailableAtomic));
	const heldAtomic = BigInt(String(account.balanceHeldAtomic));
	assertNonNegativeAtomic(heldAtomic - amountAtomic, 'Ledger held balance underflow');

	await params.tx
		.update(bankingLedgerAccounts)
		.set({
			balanceAvailableAtomic: availableAtomic + amountAtomic,
			balanceHeldAtomic: heldAtomic - amountAtomic,
			updatedAt: new Date(),
		})
		.where(eq(bankingLedgerAccounts.id, account.id));

	await params.tx.insert(bankingLedgerEntries).values({
		userId: hold.userId,
		accountId: account.id,
		currency: hold.currency,
		type: 'release',
		amountAtomic,
		referenceType: hold.referenceType,
		referenceId: hold.referenceId,
		description: params.reason,
	});

	await params.tx.update(bankingLedgerHolds).set({ status: 'released', releasedAt: new Date() }).where(eq(bankingLedgerHolds.id, hold.id));

	return { released: true };
}

export async function captureHold(params: { tx: Tx; holdId: string; userId: string; reason?: string }) {
	const [hold] = await params.tx.select().from(bankingLedgerHolds).where(eq(bankingLedgerHolds.id, params.holdId)).limit(1);

	if (!hold) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Hold not found' });
	if (hold.userId !== params.userId) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });
	if (hold.status !== 'active') return { captured: false };

	const [account] = await params.tx.select().from(bankingLedgerAccounts).where(eq(bankingLedgerAccounts.id, hold.accountId)).limit(1);

	if (!account) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Ledger account not found' });

	const amountAtomic = BigInt(String(hold.amountAtomic));
	const heldAtomic = BigInt(String(account.balanceHeldAtomic));
	assertNonNegativeAtomic(heldAtomic - amountAtomic, 'Ledger held balance underflow');

	await params.tx
		.update(bankingLedgerAccounts)
		.set({
			balanceHeldAtomic: heldAtomic - amountAtomic,
			updatedAt: new Date(),
		})
		.where(eq(bankingLedgerAccounts.id, account.id));

	await params.tx.insert(bankingLedgerEntries).values({
		userId: hold.userId,
		accountId: account.id,
		currency: hold.currency,
		type: 'debit',
		amountAtomic,
		referenceType: hold.referenceType,
		referenceId: hold.referenceId,
		description: params.reason,
	});

	await params.tx.update(bankingLedgerHolds).set({ status: 'captured', capturedAt: new Date() }).where(eq(bankingLedgerHolds.id, hold.id));

	return { captured: true };
}
