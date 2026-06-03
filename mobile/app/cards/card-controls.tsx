import * as React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CardControlsScreen } from '@/components/cards/card-controls-screen';
import { useCardControls } from '@/network/card-controls/use-card-controls';
import { useUpdateCardControls } from '@/network/card-controls/use-update-card-controls';
import type { CardControlSetting } from '@/components/cards/types';
import type {
  CardControlsState,
  CardControlKey,
  UpdateCardControlsInput,
} from '@brioela/shared/validators/card-controls.validator';
import { cardControlKeys } from '@brioela/shared/validators/card-controls.validator';

export default function CardControlsPage() {
  const router = useRouter();
  const { cardId } = useLocalSearchParams<{ cardId?: string }>();
  const id = typeof cardId === 'string' ? cardId : '';
  const { data } = useCardControls(id);
  const { mutate } = useUpdateCardControls();
  const [loadingControlId, setLoadingControlId] = React.useState<string | null>(null);

  const CONTROL_META: {
    key: keyof Omit<CardControlsState, 'cardId'>;
    icon: CardControlSetting['icon'];
    title: string;
    description: string;
  }[] = [
    {
      key: 'onlinePayments',
      icon: 'globe',
      title: 'Online payments',
      description: 'Pay for goods and services on the internet.',
    },
    {
      key: 'magneticStripe',
      icon: 'magnetic_stripe',
      title: 'Magnetic stripe',
      description: 'Swipe your card with a machine to pay or withdraw.',
    },
    {
      key: 'contactless',
      icon: 'contactless',
      title: 'Contactless',
      description: 'Tap your physical card to pay or withdraw cash.',
    },
    {
      key: 'chipTransactions',
      icon: 'chip',
      title: 'Chip transactions',
      description: 'Insert your card into a machine to pay or withdraw cash.',
    },
    {
      key: 'mobileWallet',
      icon: 'mobile_wallet',
      title: 'Mobile wallet',
      description: 'Use your mobile device to pay or withdraw cash.',
    },
    {
      key: 'cashWithdrawals',
      icon: 'cash_withdrawal',
      title: 'Cash withdrawals',
      description: 'Use contactless, chip or magnetic stripe to withdraw at ATMs.',
    },
    {
      key: 'non3dSecure',
      icon: 'non_3d_secure',
      title: 'Non-3D secure payments',
      description: "Allow online payments that don't require 3D Secure authentication.",
    },
    {
      key: 'overseasPayments',
      icon: 'overseas',
      title: 'Overseas payments',
      description: 'Allow in-store card or mobile wallet payments outside of Germany.',
    },
  ];

  const controls = CONTROL_META.map((m) => {
    let enabled = true;
    if (data) {
      enabled = data[m.key];
    }
    return {
      id: m.key,
      icon: m.icon,
      title: m.title,
      description: m.description,
      enabled,
    };
  });

  const handleControlToggle = (controlId: string, enabled: boolean): void => {
    if (!id) return;
    const typedKey = (cardControlKeys as readonly CardControlKey[]).find((k) => k === controlId);
    if (!typedKey) return;
    const controls: Partial<Record<CardControlKey, boolean>> = {};
    controls[typedKey] = enabled;
    const payload: UpdateCardControlsInput = { cardId: id, controls };
    setLoadingControlId(controlId);
    mutate(payload, {
      onSettled: () => {
        setLoadingControlId(null);
      },
    });
  };

  return (
    <CardControlsScreen
      controls={controls}
      onControlToggle={handleControlToggle}
      onBack={() => router.back()}
      loadingControlId={loadingControlId}
    />
  );
}
