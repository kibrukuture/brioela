// /stores/use-network-store.ts
import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  initialize: () => void;
  cleanup: () => void;
}

let unsubscribe: (() => void) | null = null;

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: true,
  isInternetReachable: null,

  initialize: () => {
    // Listen to network changes
    unsubscribe = NetInfo.addEventListener((state) => {
      set({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
      });
    });
  },

  cleanup: () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  },
}));
