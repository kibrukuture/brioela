import type { WalletActivationPhase } from '@/stores/wallet/use-wallet-activation-store';

type WalletActivationCopyInput = {
  phase: WalletActivationPhase;
  email: string | null;
  isConnected: boolean;
  isActivatedUi: boolean;
  isBusy: boolean;
  isSessionStatusLoading: boolean;
};

export function getWalletActivationCopy(input: WalletActivationCopyInput) {
  const { phase, email, isConnected, isActivatedUi, isSessionStatusLoading } = input;

  let title = 'Activate your bank account';
  let subtitle = 'Securely link your wallet to unlock Schnl banking.';
  let helperText = 'Tap “Send code” to receive a 6-digit code.';
  let primaryLabel = 'Send code';
  let disclaimerText = 'By continuing, you agree to link this wallet for Schnl banking features.';

  if (isActivatedUi) {
    title = 'Your bank account is active';
    subtitle = 'Your wallet is connected for Schnl banking.';
    helperText = '';
    primaryLabel = 'Disconnect wallet';
    disclaimerText = 'Disconnecting will require email verification to reconnect.';
    return { title, subtitle, helperText, primaryLabel, disclaimerText };
  }

  if (isSessionStatusLoading) {
    helperText = 'Checking wallet status…';
  }

  if (phase === 'awaiting_otp') {
    if (email) {
      subtitle = `Enter the verification code sent to ${email}.`;
    } else {
      subtitle = 'Enter the verification code from your email.';
    }
    helperText = 'Enter the 6-digit code from your email.';
    primaryLabel = 'Activate';
    return { title, subtitle, helperText, primaryLabel, disclaimerText };
  }

  if (phase === 'sending_code') {
    if (email) {
      subtitle = `We’ll send a verification code to ${email}.`;
    }
    helperText = 'Sending verification code…';
    primaryLabel = 'Sending…';
    return { title, subtitle, helperText, primaryLabel, disclaimerText };
  }

  if (phase === 'connecting' || phase === 'awaiting_account_activation' || phase === 'activating') {
    if (isConnected) {
      subtitle = 'Approve Schnl to manage banking transactions for you.';
    }
    helperText = 'Still working... Polygon Network confirmations can take a few seconds.';
    primaryLabel = 'Activating…';
    return { title, subtitle, helperText, primaryLabel, disclaimerText };
  }

  if (isConnected) {
    subtitle = 'Approve Schnl to manage banking transactions for you.';
    helperText = 'Approve Schnl banking permissions to continue.';
    primaryLabel = 'Activate';
    return { title, subtitle, helperText, primaryLabel, disclaimerText };
  }

  if (email) {
    subtitle = `We’ll send a verification code to ${email}.`;
  }

  return { title, subtitle, helperText, primaryLabel, disclaimerText };
}
