import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingWallets } from '@brioela/shared/drizzle/schema/banking-wallets.schema';
import { eq, and } from '@brioela/shared/drizzle';
import { activateWalletSchema } from '@brioela/shared/validators/banking.validator';
import dayjs from 'dayjs';
import { DEFAULT_WALLET_NETWORK } from '@brioela/shared/constants';
import { ethers } from '@tolbel/align';
import { verifyAndConsumeActivationChallenge } from '@/api/banking/helpers/wallet/activation';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';

export async function activateWallet(c: AppContext) {
	const user = c.get('user');
	if (!user) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });
	console.log(`[activateWallet] start user=${user.id} ts=${dayjs().toISOString()}`);

	const body = await c.req.json();
	const validation = activateWalletSchema.safeParse(body);
	if (!validation.success) {
		console.error(
			`[activateWallet] validation_failed user=${user.id} ts=${dayjs().toISOString()} reason=${validation.error.issues[0].message}`
		);
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: validation.error.issues[0].message });
	}
	const input = validation.data;
	console.log(`[activateWallet] input_parsed user=${user.id} wallet=${input.walletAddress} ts=${dayjs().toISOString()}`);

	if (!ethers.isAddress(input.walletAddress)) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Invalid wallet address' });
	}

	await verifyAndConsumeActivationChallenge({
		userId: user.id,
		challengeId: input.challengeId,
		walletAddress: input.walletAddress,
		signature: input.signature,
	});

	const db = getDb();
	const [currentPrimary] = await db
		.select()
		.from(bankingWallets)
		.where(and(eq(bankingWallets.userId, user.id), eq(bankingWallets.isPrimary, true)))
		.limit(1);

	if (currentPrimary && currentPrimary.address !== input.walletAddress) {
		console.error(
			`[activateWallet] error_wallet_mismatch user=${user.id} primary=${currentPrimary.address} provided=${
				input.walletAddress
			} ts=${dayjs().toISOString()}`
		);
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, {
			message: `Wallet mismatch: primary=${currentPrimary.address} provided=${input.walletAddress}. Connect the primary wallet.`,
		});
	}
	if (currentPrimary) {
		console.log(`[activateWallet] wallet_resolved user=${user.id} wallet=${currentPrimary.address} ts=${dayjs().toISOString()}`);
		return { activated: true, walletAddress: currentPrimary.address };
	}
	const [createdWallet] = await db
		.insert(bankingWallets)
		.values({
			userId: user.id,
			address: input.walletAddress,
			network: DEFAULT_WALLET_NETWORK,
			isPrimary: true,
		})
		.returning();
	return { activated: true, walletAddress: createdWallet.address };
}
