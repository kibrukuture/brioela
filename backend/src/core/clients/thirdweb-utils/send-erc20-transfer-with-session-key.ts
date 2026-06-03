import { getThirdWebClient } from '@/core/clients/third-web';
import { CHAIN_IDS } from '@brioela/shared/constants/chains';
import { Engine, getContract, prepareContractCall, sendAndConfirmTransaction } from 'thirdweb';
import { polygon } from 'thirdweb/chains';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import { ethers } from '@tolbel/align';

export async function sendErc20TransferWithSessionKey(params: {
	chainId: number;
	smartAccountAddress: string;
	sessionKeyAddress: string;
	tokenAddress: string;
	to: string;
	amount: bigint;
}): Promise<{ txHash: string }> {
	if (!params.smartAccountAddress || !params.sessionKeyAddress || !params.tokenAddress || !params.to) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Missing required params for delegated ERC20 transfer' });
	}
	if (!ethers.isAddress(params.smartAccountAddress)) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Invalid smartAccountAddress' });
	}
	if (!ethers.isAddress(params.sessionKeyAddress)) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Invalid sessionKeyAddress' });
	}
	if (!ethers.isAddress(params.tokenAddress)) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Invalid tokenAddress' });
	}
	if (!ethers.isAddress(params.to)) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Invalid destination address' });
	}

	if (params.chainId !== CHAIN_IDS.POLYGON_POS) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Unsupported chain for delegated transfer' });
	}

	const client = getThirdWebClient();

	const serverWallet = Engine.serverWallet({
		client,
		address: params.sessionKeyAddress,
		chain: polygon,
		executionOptions: {
			type: 'ERC4337',
			entrypointVersion: '0.6',
			signerAddress: params.sessionKeyAddress,
			smartAccountAddress: params.smartAccountAddress,
		},
	});

	const contract = getContract({ address: params.tokenAddress, client, chain: polygon });
	const tx = prepareContractCall({
		contract,
		method: 'function transfer(address to, uint256 value) returns (bool)',
		params: [params.to, params.amount],
	});

	const receipt = await sendAndConfirmTransaction({ account: serverWallet, transaction: tx });
	return { txHash: receipt.transactionHash };
}
