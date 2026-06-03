import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingWallets } from '@brioela/shared/drizzle/schema/banking-wallets.schema';
import { bankingWalletSessions } from '@brioela/shared/drizzle/schema/banking-wallet-sessions.schema';
import { eq, and } from '@brioela/shared/drizzle';
import { registerSessionSchema } from '@brioela/shared/validators/banking.validator';
import { getThirdWebClient } from '@/core/clients/third-web';
import { CHAIN_IDS } from '@brioela/shared/constants';
import { getContract } from 'thirdweb';
import { polygon } from 'thirdweb/chains';
import { getAllActiveSigners } from 'thirdweb/extensions/erc4337';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';

export async function registerSession(c: AppContext) {
	const user = c.get('user');
	if (!user) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });
	console.log('[session.register]: start', { userId: user.id });
	const body = await c.req.json();
	const validation = registerSessionSchema.safeParse(body);
	if (!validation.success) {
		console.log('[session.register]: validation_failed', { userId: user.id, error: validation.error.issues[0].message });
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: validation.error.issues[0].message });
	}
	const input = validation.data;
	console.log('[session.register]: input', {
		userId: user.id,
		walletAddress: input.walletAddress,
		sessionKeyAddress: input.sessionKeyAddress,
		chainId: input.chainId,
	});
	const db = getDb();
	const [wallet] = await db
		.select()
		.from(bankingWallets)
		.where(and(eq(bankingWallets.userId, user.id), eq(bankingWallets.address, input.walletAddress), eq(bankingWallets.isPrimary, true)))
		.limit(1);
	if (!wallet) {
		throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Wallet not found.' });
	}
	const client = getThirdWebClient();
	const chain = input.chainId === CHAIN_IDS.POLYGON_POS ? polygon : undefined;
	if (!chain) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Unsupported chain for session verification' });
	}
	const contract = getContract({
		address: input.walletAddress,
		client,
		chain,
	});
	let signers: ReadonlyArray<{ signer: string }>;
	try {
		signers = await getAllActiveSigners({ contract });
		console.log('[session.register]: signers.count', { count: signers.length });
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : String(e);
		throw new HTTPException(ErrorCode.UPSTREAM_ERROR, { message });
	}
	const isActive = signers.map((s) => s.signer.toLowerCase()).includes(input.sessionKeyAddress.toLowerCase());
	console.log('[session.register]: isActive', { isActive });
	if (!isActive) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Session key not active on wallet' });
	}
	let created: typeof bankingWalletSessions.$inferSelect;
	try {
		created = await db.transaction(async (tx) => {
			await tx
				.update(bankingWalletSessions)
				.set({
					status: 'revoked',
					updatedAt: new Date(),
				})
				.where(and(eq(bankingWalletSessions.walletId, wallet.id), eq(bankingWalletSessions.status, 'active')));

			const [inserted] = await tx
				.insert(bankingWalletSessions)
				.values({
					userId: user.id,
					walletId: wallet.id,
					sessionKeyAddress: input.sessionKeyAddress,
					chainId: input.chainId,
					approvedTargets: input.approvedTargets,
					nativeTokenLimitPerTransaction: input.nativeTokenLimitPerTransaction,
					expiresAt: input.expiresAt,
					status: 'active',
				})
				.returning();

			return inserted;
		});
	} catch (e: unknown) {
		// If we raced another request, the partial unique index may reject our insert.
		// In that case, return the already-active session.
		const [existing] = await db
			.select()
			.from(bankingWalletSessions)
			.where(and(eq(bankingWalletSessions.walletId, wallet.id), eq(bankingWalletSessions.status, 'active')))
			.limit(1);
		if (existing) {
			created = existing;
		} else {
			const message = e instanceof Error ? e.message : String(e);
			throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message });
		}
	}
	console.log('[session.register]: created', { id: created.id });
	return {
		id: created.id,
		sessionKeyAddress: created.sessionKeyAddress,
		expiresAt: created.expiresAt,
		status: created.status,
	};
}
