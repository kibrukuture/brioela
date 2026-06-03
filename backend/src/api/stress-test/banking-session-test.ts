import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingWallets } from '@brioela/shared/drizzle/schema/banking-wallets.schema';
import { bankingWalletSessions } from '@brioela/shared/drizzle/schema/banking-wallet-sessions.schema';
import { eq, and } from '@brioela/shared/drizzle';
import { getThirdWebClient } from '@/core/clients/third-web';
import { CHAIN_IDS } from '@brioela/shared/constants';
import { getContract } from 'thirdweb';
import { polygon } from 'thirdweb/chains';
import { getAllActiveSigners } from 'thirdweb/extensions/erc4337';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';

export async function registerSessionTest(c: AppContext) {
	const userId = 'fbbffef7-8b88-40ef-816f-3761b3bf744a';
	try {
		const input = {
			walletAddress: '0xa65a3669d9dd8f031A9DfE73c3d1fbDFC2E6e53b',
			sessionKeyAddress: process.env.THIRD_WEB_SERVER_WALLET_ADDRESS ?? '0xf41Ca39Ca7B78Be6B8da1AE9B467d7B68aaE3c7a',
			chainId: 137,
			approvedTargets: ['0x3c499c542cef5e3811e1192ce70d8cc03d5c3359'],
			nativeTokenLimitPerTransaction: '0',
			expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
		};

		const db = getDb();
		const [wallet] = await db
			.select()
			.from(bankingWallets)
			.where(and(eq(bankingWallets.userId, userId), eq(bankingWallets.address, input.walletAddress), eq(bankingWallets.isPrimary, true)))
			.limit(1);
		if (!wallet) {
			throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Wallet not found for user or not primary' });
		}

		const client = getThirdWebClient();
		const chain = input.chainId === CHAIN_IDS.POLYGON_POS ? polygon : undefined;
		if (!chain) {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: `Unsupported chainId: ${input.chainId}` });
		}
		const contract = getContract({ address: input.walletAddress, client, chain });
		let signers: ReadonlyArray<{ signer: string }>;
		try {
			signers = await getAllActiveSigners({ contract });
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			const name = e instanceof Error ? e.name : 'UnknownError';
			if (msg.includes('Cannot decode zero data') || name === 'AbiDecodingZeroDataError') {
				throw new HTTPException(ErrorCode.PRECONDITION_FAILED, {
					message: 'Address has no contract code (EOA): cannot read ERC-4337 signers',
				});
			}
			throw new HTTPException(ErrorCode.UPSTREAM_ERROR, { message: 'Failed to read active signers' });
		}
		const isActive = signers.map((s) => s.signer.toLowerCase()).includes(input.sessionKeyAddress.toLowerCase());
		if (!isActive) {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Session key not active on wallet' });
		}

		const [created] = await db
			.insert(bankingWalletSessions)
			.values({
				userId,
				walletId: wallet.id,
				sessionKeyAddress: input.sessionKeyAddress,
				chainId: input.chainId,
				approvedTargets: input.approvedTargets,
				nativeTokenLimitPerTransaction: input.nativeTokenLimitPerTransaction,
				expiresAt: input.expiresAt,
				status: 'active',
			})
			.returning();

		return c.json({
			ok: true,
			result: {
				id: created.id,
				sessionKeyAddress: created.sessionKeyAddress,
				expiresAt: created.expiresAt,
				status: created.status,
			},
		});
	} catch (error) {
		if (error instanceof HTTPException) throw error;
		const message = error instanceof Error ? error.message : String(error);
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message });
	}
}
