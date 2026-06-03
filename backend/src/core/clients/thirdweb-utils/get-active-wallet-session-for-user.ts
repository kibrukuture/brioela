import { getDb } from '@/core/database/client';
import { bankingWalletSessions } from '@brioela/shared/drizzle/schema/banking-wallet-sessions.schema';
import { bankingWallets } from '@brioela/shared/drizzle/schema/banking-wallets.schema';
import { and, eq } from '@brioela/shared/drizzle';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import { ethers } from '@tolbel/align';

export async function getActiveWalletSessionForUser(input: { userId: string }): Promise<{
	smartAccountAddress: string;
	sessionKeyAddress: string;
	chainId: number;
}> {
	if (!input.userId) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Missing userId' });
	}

	const db = getDb();

	const [wallet] = await db
		.select({ address: bankingWallets.address })
		.from(bankingWallets)
		.where(and(eq(bankingWallets.userId, input.userId), eq(bankingWallets.isPrimary, true)))
		.limit(1);
	if (!wallet?.address) {
		throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Primary wallet not found' });
	}
	if (!ethers.isAddress(wallet.address)) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Invalid primary wallet address' });
	}

	const [session] = await db
		.select({ sessionKeyAddress: bankingWalletSessions.sessionKeyAddress, chainId: bankingWalletSessions.chainId })
		.from(bankingWalletSessions)
		.where(and(eq(bankingWalletSessions.userId, input.userId), eq(bankingWalletSessions.status, 'active')))
		.limit(1);
	if (!session?.sessionKeyAddress || !session.chainId) {
		throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'No active wallet session' });
	}
	if (!ethers.isAddress(session.sessionKeyAddress)) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Invalid session key address' });
	}

	return {
		smartAccountAddress: wallet.address,
		sessionKeyAddress: session.sessionKeyAddress,
		chainId: session.chainId,
	};
}
