import { create } from 'zustand';

export type WalletActivationPhase =
  | 'idle_disconnected'
  | 'idle_connected'
  | 'sending_code'
  | 'awaiting_otp'
  | 'connecting'
  | 'awaiting_account_activation'
  | 'activating'
  | 'disconnecting';

interface WalletActivationState {
  phase: WalletActivationPhase;
  error: string | null;
  activationInFlight: boolean;

  setPhase: (phase: WalletActivationPhase) => void;
  setError: (error: string | null) => void;
  setActivationInFlight: (activationInFlight: boolean) => void;
  reset: () => void;
}

export const useWalletActivationStore = create<WalletActivationState>((set) => ({
  phase: 'idle_disconnected',
  error: null,
  activationInFlight: false,

  setPhase: (phase) => set({ phase }),
  setError: (error) => set({ error }),
  setActivationInFlight: (activationInFlight) => set({ activationInFlight }),
  reset: () => set({ phase: 'idle_disconnected', error: null, activationInFlight: false }),
}));
