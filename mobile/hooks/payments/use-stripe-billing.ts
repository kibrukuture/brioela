import { useMutation } from '@tanstack/react-query';
import { Linking } from 'react-native';
import * as Burnt from 'burnt';
import { createStripeBillingSession } from '@/services/api/payments/stripe';

export function useStripeBilling() {
  return useMutation({
    mutationFn: () => createStripeBillingSession(),
    onSuccess: async (url) => {
      console.log('url => ', url);
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          Burnt.toast({
            title: 'Opening billing portal',
            preset: 'done',
          });
        } else {
          throw new Error('Unable to open billing portal URL');
        }
      } catch (error: unknown) {
        Burnt.alert({
          title: 'Error',
          message: error instanceof Error ? error.message : 'Failed to open billing portal',
          preset: 'error',
        });
      }
    },
    onError: (error: unknown) => {
      Burnt.alert({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create billing session',
        preset: 'error',
      });
    },
  });
}
