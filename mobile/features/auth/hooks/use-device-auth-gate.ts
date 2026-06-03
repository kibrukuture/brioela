import { useCallback } from 'react';
import { SECURE_STORAGE_KEYS } from '@/constants';
import { authenticate } from '@/lib/auth/local-authentication';
import { encryptedStorage } from '@/lib/storage/encrypted-storage';
import { useProgressSheetStore } from '@/stores/ui/use-progress-sheet-store';

export function useDeviceAuthGate() {
  const { show, hide } = useProgressSheetStore();

  const isEnabled = useCallback(async (): Promise<boolean> => {
    const pref = await encryptedStorage.get(SECURE_STORAGE_KEYS.LOCAL_DEVICE_AUTH_ENABLED);
    return pref === 'true';
  }, []);

  const requireDeviceAuth = useCallback(
    async (promptMessage: string, progressTitle?: string): Promise<boolean> => {
      try {
        const enabled = await isEnabled();
        if (!enabled) return true;

        if (progressTitle) {
          show(progressTitle);
        }

        const result = await authenticate({ promptMessage });
        hide();

        return result.success && 'authenticated' in result && result.authenticated;
      } catch {
        hide();
        return false;
      }
    },
    [hide, isEnabled, show]
  );

  return { isEnabled, requireDeviceAuth };
}
