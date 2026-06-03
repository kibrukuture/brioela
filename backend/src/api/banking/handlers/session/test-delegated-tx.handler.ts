import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingWallets } from '@brioela/shared/drizzle/schema/banking-wallets.schema';
import { bankingWalletSessions } from '@brioela/shared/drizzle/schema/banking-wallet-sessions.schema';
import { eq, and } from '@brioela/shared/drizzle';
import { getThirdWebClient } from '@/core/clients/third-web';
import { CHAIN_IDS, USDC_BY_CHAIN } from '@brioela/shared/constants';
import { polygon } from 'thirdweb/chains';
import { Engine, getContract, prepareContractCall, sendAndConfirmTransaction } from 'thirdweb';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';

export async function testDelegatedTx(c: AppContext) {
	const user = c.get('user');
	if (!user) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });
	const db = getDb();

	// Resolve primary smart account
	const [wallet] = await db
		.select()
		.from(bankingWallets)
		.where(and(eq(bankingWallets.userId, user.id), eq(bankingWallets.isPrimary, true)))
		.limit(1);
	if (!wallet) {
		throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Primary wallet not found' });
	}

	// Resolve active session
	const [session] = await db
		.select()
		.from(bankingWalletSessions)
		.where(and(eq(bankingWalletSessions.userId, user.id), eq(bankingWalletSessions.status, 'active')))
		.limit(1);
	if (!session) {
		throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'No active session' });
	}

	// Build server wallet account bound to user's smart account for ERC-4337 execution
	const client = getThirdWebClient();
	const serverSessionKeyAddress = session.sessionKeyAddress;
	const smartAccountAddress = wallet.address;

	const serverWallet = Engine.serverWallet({
		client,
		address: serverSessionKeyAddress,
		chain: polygon,
		executionOptions: {
			type: 'ERC4337',
			entrypointVersion: '0.6',
			signerAddress: serverSessionKeyAddress,
			smartAccountAddress,
		},
	});

	// Prepare a harmless ERC20 approve(0) call on USDC to prove delegated execution
	const usdc = USDC_BY_CHAIN[CHAIN_IDS.POLYGON_POS];
	const contract = getContract({ address: usdc, client, chain: polygon });
	const tx = prepareContractCall({
		contract,
		method: 'function approve(address spender, uint256 amount) returns (bool)',
		params: [serverSessionKeyAddress, 0n],
	});

	const receipt = await sendAndConfirmTransaction({ account: serverWallet, transaction: tx });
	return {
		ok: true,
		txHash: receipt.transactionHash,
		smartAccountAddress,
		spender: serverSessionKeyAddress,
		contract: usdc,
	};
}
