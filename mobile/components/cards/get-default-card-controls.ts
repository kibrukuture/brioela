import type { CardControlSetting } from './types';

export function getDefaultCardControls(): readonly CardControlSetting[] {
  return [
    {
      id: 'online_payments',
      icon: 'globe',
      title: 'Online payments',
      description: 'Pay for goods and services on the internet.',
      enabled: true,
    },
    {
      id: 'magnetic_stripe',
      icon: 'magnetic_stripe',
      title: 'Magnetic stripe',
      description: 'Swipe your card with a machine to pay or withdraw.',
      enabled: true,
    },
    {
      id: 'contactless',
      icon: 'contactless',
      title: 'Contactless',
      description: 'Tap your physical card to pay or withdraw cash.',
      enabled: true,
    },
    {
      id: 'chip_transactions',
      icon: 'chip',
      title: 'Chip transactions',
      description: 'Insert your card into a machine to pay or withdraw cash.',
      enabled: true,
    },
    {
      id: 'mobile_wallet',
      icon: 'mobile_wallet',
      title: 'Mobile wallet',
      description: 'Use your mobile device to pay or withdraw cash.',
      enabled: true,
    },
    {
      id: 'cash_withdrawals',
      icon: 'cash_withdrawal',
      title: 'Cash withdrawals',
      description: 'Use contactless, chip or magnetic stripe to withdraw at ATMs.',
      enabled: true,
    },
    {
      id: 'non_3d_secure',
      icon: 'non_3d_secure',
      title: 'Non-3D secure payments',
      description: "Allow online payments that don't require 3D Secure authentication.",
      enabled: true,
    },
    {
      id: 'overseas_payments',
      icon: 'overseas',
      title: 'Overseas payments',
      description: 'Allow in-store card or mobile wallet payments outside of Germany.',
      enabled: true,
    },
  ] as const;
}
