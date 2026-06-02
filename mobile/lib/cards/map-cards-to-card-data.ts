import type { Card } from '@schnl/shared/validators/card.validator';
import type { CardData } from '@/components/cards/types';

export function mapCardsToCardData(input: { cards: readonly Card[] }): readonly CardData[] {
  return input.cards.map((c, index) => {
    const expiryDate = `${String(c.expiryMonth).padStart(2, '0')}/${String(c.expiryYear).slice(-2)}`;

    const maskedNumber = `•••• •••• •••• ${c.last4}`;

    const cardholderName =
      `${c.cardholderFirstName ?? ''} ${c.cardholderLastName ?? ''}`.trim() || '';

    const status =
      c.status === 'frozen' ? 'frozen' : c.status === 'cancelled' ? 'cancelled' : 'active';

    const designFromTheme =
      c.theme === 'frozen' ? 'schnl_frozen' : c.theme === 'tropical' ? 'schnl_tropical' : null;

    return {
      id: c.id,
      type: c.type === 'virtual' ? 'virtual' : 'physical',
      status,
      design:
        status === 'frozen'
          ? 'schnl_frozen'
          : (designFromTheme ?? (index % 2 === 0 ? 'hello_world' : 'schnl_tropical')),
      label: c.label ?? null,
      lastFourDigits: c.last4,
      expiryDate,
      cardholderName,
      cardNumber: maskedNumber,
      securityCode: '***',
      billingAddress: '—',
      pin: '****',
      isExpiringSoon: false,
      expiryWarningMessage: null,
    };
  });
}
