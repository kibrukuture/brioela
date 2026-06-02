import { thirdwebClient } from '@/lib/clients/thirdweb';
import { addSessionKey } from 'thirdweb/extensions/erc4337';
import { getContract, sendAndConfirmTransaction } from 'thirdweb';
import { polygon } from 'thirdweb/chains';
import { getSessionConfig, registerSession } from '@/services/api/banking/banking.api';
import { useActiveAccount } from 'thirdweb/react';
import dayjs from 'dayjs';

type RunGrantInput = void;

export function useGrantSessionFlow() {
  const account = useActiveAccount();
  async function runGrantFlow(_: RunGrantInput) {
    if (!account) {
      throw new Error('No active account');
    }
    console.log('[session] fetch config');
    const sessionConfig = await getSessionConfig();
    console.log('[session] config', {
      chainId: sessionConfig.chainId,
      targets: sessionConfig.approvedTargets,
      sessionKeyAddress: sessionConfig.sessionKeyAddress,
    });
    const sessionKeyAddress = sessionConfig.sessionKeyAddress;
    const approvedTargets = sessionConfig.approvedTargets;
    const start = dayjs(sessionConfig.permissionStartTimestamp);
    const end = dayjs(sessionConfig.permissionEndTimestamp);
    const contract = getContract({
      address: account.address,
      client: thirdwebClient,
      chain: polygon,
    });
    console.log('[session] build addSessionKey tx');
    const nativeTokenLimitPerTransaction = Number(
      sessionConfig.nativeTokenLimitPerTransaction || '0'
    );
    const tx = addSessionKey({
      contract,
      account,
      sessionKeyAddress,
      permissions: {
        approvedTargets: approvedTargets || '*',
        nativeTokenLimitPerTransaction,
        permissionStartTimestamp: start.toDate(),
        permissionEndTimestamp: end.toDate(),
      },
    });
    console.log('[session] send tx');
    await sendAndConfirmTransaction({ account, transaction: tx });
    console.log('[session] tx confirmed');
    await registerSession({
      walletAddress: account.address,
      sessionKeyAddress,
      chainId: sessionConfig.chainId,
      approvedTargets,
      nativeTokenLimitPerTransaction: sessionConfig.nativeTokenLimitPerTransaction || '0',
      expiresAt: end.toDate(),
    });
    console.log('[session] register ok');
  }
  return { runGrantFlow };
}
