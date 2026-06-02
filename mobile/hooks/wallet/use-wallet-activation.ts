import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveAccount, useActiveWallet, useDisconnect } from 'thirdweb/react';
import { inAppWallet } from 'thirdweb/wallets';
import { preAuthenticate } from 'thirdweb/wallets/in-app';
import { useCreateActivationChallenge } from '@/hooks/banking/use-create-activation-challenge';
import { useActivateWallet } from '@/hooks/banking/use-activate-wallet';
import { useGrantSessionFlow } from '@/hooks/banking/use-grant-session-flow';
import { useSessionStatus } from '@/hooks/banking/use-session-status';
import { useSmartConnect } from '@/hooks/wallet/use-smart-connect';
import { thirdwebClient } from '@/lib/clients/thirdweb';
import { QUERY_KEYS } from '@/lib/query-keys';
import { useAuthStore } from '@/stores/account/use-auth-store';
import { useWalletActivationStore } from '@/stores/wallet/use-wallet-activation-store';

type RequestActivationInput = {
  code: string;
};

export function useWalletActivation() {
  const queryClient = useQueryClient();
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const { connect } = useSmartConnect();
  const sessionStatusQuery = useSessionStatus();
  const { mutateAsync: createChallenge } = useCreateActivationChallenge();
  const { mutateAsync: activate, isPending: isActivating } = useActivateWallet();
  const { runGrantFlow } = useGrantSessionFlow();

  const phase = useWalletActivationStore((s) => s.phase);
  const error = useWalletActivationStore((s) => s.error);
  const activationInFlight = useWalletActivationStore((s) => s.activationInFlight);

  const email = useAuthStore((s) => s.user?.email ?? null);

  const sessionStatus = sessionStatusQuery.data?.status ?? null;

  const isBusy =
    phase === 'sending_code' ||
    phase === 'connecting' ||
    phase === 'awaiting_account_activation' ||
    phase === 'activating' ||
    phase === 'disconnecting' ||
    isActivating;

  const isSessionActive = sessionStatusQuery.data?.status === 'active';

  const sendEmailCode = async (): Promise<boolean> => {
    if (isBusy) return false;
    if (!email) {
      useWalletActivationStore.getState().setError('Email not found');
      return false;
    }

    useWalletActivationStore.getState().setError(null);
    useWalletActivationStore.getState().setPhase('sending_code');

    try {
      await preAuthenticate({
        client: thirdwebClient,
        strategy: 'email',
        email,
      });
      useWalletActivationStore.getState().setPhase('awaiting_otp');
      return true;
    } catch (e: unknown) {
      useWalletActivationStore
        .getState()
        .setError(e instanceof Error ? e.message : 'Failed to send code');
      useWalletActivationStore.getState().setPhase('idle_disconnected');
      return false;
    }
  };

  useEffect(() => {
    const continueAfterConnect = async (): Promise<void> => {
      if (phase !== 'awaiting_account_activation') return;
      if (!account) return;
      if (useWalletActivationStore.getState().activationInFlight) return;

      if (sessionStatus === 'active') {
        useWalletActivationStore.getState().setPhase('idle_connected');
        return;
      }

      useWalletActivationStore.getState().setActivationInFlight(true);
      useWalletActivationStore.getState().setPhase('activating');
      useWalletActivationStore.getState().setError(null);
      try {
        await runActivationSteps(account);
        useWalletActivationStore.getState().setPhase('idle_connected');
      } catch (e: unknown) {
        useWalletActivationStore
          .getState()
          .setError(e instanceof Error ? e.message : 'Activation failed');
        useWalletActivationStore.getState().setPhase('idle_connected');
      } finally {
        useWalletActivationStore.getState().setActivationInFlight(false);
      }
    };

    continueAfterConnect();
  }, [account, phase, sessionStatus]);

  useEffect(() => {
    // Keep baseline phase aligned with actual connection truth when not in an active operation.
    if (
      phase === 'sending_code' ||
      phase === 'connecting' ||
      phase === 'awaiting_account_activation' ||
      phase === 'activating' ||
      phase === 'disconnecting'
    ) {
      return;
    }

    if (account) {
      if (phase !== 'idle_connected')
        useWalletActivationStore.getState().setPhase('idle_connected');
      return;
    }

    if (phase !== 'awaiting_otp' && phase !== 'idle_disconnected') {
      useWalletActivationStore.getState().setPhase('idle_disconnected');
    }
  }, [account, phase]);

  const connectWallet = async ({ code }: RequestActivationInput): Promise<void> => {
    if (!email) {
      useWalletActivationStore.getState().setError('Email not found');
      throw new Error('Email not found');
    }

    useWalletActivationStore.getState().setError(null);
    useWalletActivationStore.getState().setPhase('connecting');

    try {
      await connect(async () => {
        const wallet = inAppWallet();
        await wallet.connect({
          client: thirdwebClient,
          strategy: 'email',
          email,
          verificationCode: code,
        });
        return wallet;
      });
    } catch (e: unknown) {
      useWalletActivationStore
        .getState()
        .setError(e instanceof Error ? e.message : 'Wallet connect failed');
      throw e;
    }
  };

  const runActivationSteps = async (activeAccount: NonNullable<typeof account>): Promise<void> => {
    // Ensure wallet is activated/linked on backend.
    const challengeResp = await createChallenge({ walletAddress: activeAccount.address });
    const message = JSON.stringify(challengeResp.challenge);
    const signature = await activeAccount.signMessage({ message });

    await activate({
      challengeId: challengeResp.challengeId,
      signature,
      walletAddress: activeAccount.address,
    });

    // Grant/renew backend session permission (1 year).
    await runGrantFlow();

    // Refresh backend truth.
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANKING.SESSION_STATUS });
    await sessionStatusQuery.refetch();
  };

  const activateOrRenewSession = async (input?: Partial<RequestActivationInput>): Promise<void> => {
    if (isBusy) return;
    useWalletActivationStore.getState().setError(null);

    if (account && sessionStatus === 'active') {
      useWalletActivationStore.getState().setPhase('idle_connected');
      return;
    }

    // If not connected, we must connect first using OTP.
    if (!account) {
      const code = input?.code;
      if (!code) {
        throw new Error('Verification code required');
      }
      await connectWallet({ code });

      // The smart account (`useActiveAccount`) will be available on the next render.
      // We complete the activation in a minimal synchronization effect.
      useWalletActivationStore.getState().setPhase('awaiting_account_activation');
      return;
    }

    if (activationInFlight) return;
    useWalletActivationStore.getState().setActivationInFlight(true);
    useWalletActivationStore.getState().setPhase('activating');
    try {
      await runActivationSteps(account);
      useWalletActivationStore.getState().setPhase('idle_connected');
    } catch (e: unknown) {
      useWalletActivationStore
        .getState()
        .setError(e instanceof Error ? e.message : 'Activation failed');
      throw e;
    } finally {
      useWalletActivationStore.getState().setActivationInFlight(false);
      if (useWalletActivationStore.getState().phase === 'activating') {
        useWalletActivationStore.getState().setPhase('idle_connected');
      }
    }
  };

  const disconnectWallet = async () => {
    if (isBusy) return;
    useWalletActivationStore.getState().setPhase('disconnecting');
    if (wallet) {
      disconnect(wallet);
    }
    useWalletActivationStore.getState().setError(null);
    useWalletActivationStore.getState().setActivationInFlight(false);
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANKING.SESSION_STATUS });
    useWalletActivationStore.getState().setPhase('idle_disconnected');
  };

  const setError = (next: string | null) => {
    useWalletActivationStore.getState().setError(next);
  };

  return {
    account,
    email,
    error,
    phase,
    sessionStatus: sessionStatusQuery.data ?? null,
    isSessionStatusLoading: sessionStatusQuery.isLoading,
    isSessionActive,
    isBusy,
    isActivating,
    sendEmailCode,
    activateOrRenewSession,
    disconnectWallet,
    setError,
  };
}
