export type CardType = 'physical' | 'virtual';

export type CardStatus = 'active' | 'frozen' | 'expired' | 'expiring_soon' | 'cancelled';

export type CardDesign = 'hello_world' | 'schnl_tropical' | 'schnl_frozen' | 'schnl_default';

export interface CardData {
  readonly id: string;
  readonly type: CardType;
  readonly status: CardStatus;
  readonly design: CardDesign;
  readonly label?: string | null;
  readonly lastFourDigits: string;
  readonly expiryDate: string;
  readonly cardholderName: string;
  readonly cardNumber: string;
  readonly securityCode: string;
  readonly billingAddress: string;
  readonly pin: string;
  readonly isExpiringSoon: boolean;
  readonly expiryWarningMessage: string | null;
}

export interface CardControlSetting {
  readonly id: string;
  readonly icon: CardControlIconType;
  readonly title: string;
  readonly description: string;
  readonly enabled: boolean;
}

export type CardControlIconType =
  | 'globe'
  | 'magnetic_stripe'
  | 'contactless'
  | 'chip'
  | 'mobile_wallet'
  | 'cash_withdrawal'
  | 'non_3d_secure'
  | 'overseas';

export type QuickActionType = 'show_pin' | 'card_details' | 'freeze_card' | 'unfreeze_card';

export interface QuickAction {
  readonly id: QuickActionType;
  readonly label: string;
  readonly icon: QuickActionIconType;
}

export type QuickActionIconType = 'pin_grid' | 'card_outline' | 'snowflake';

export type ManageCardItemType = 'card_controls' | 'card_label' | 'spending_limits' | 'delete_card';

export interface CardDetailsField {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly copyable: boolean;
}

export interface QRPaymentOption {
  readonly id: string;
  readonly icon: QRPaymentIconType;
  readonly label: string;
}

export type QRPaymentIconType = 'camera' | 'plus' | 'settings';

// Props interfaces for components
export interface CardItemProps {
  readonly card: CardData;
  readonly isActive: boolean;
}

export interface CardCarouselProps {
  readonly cards: readonly CardData[];
  readonly activeIndex: number;
  readonly onCardChange: (index: number) => void;
}

export interface QuickActionsProps {
  readonly isFrozen: boolean;
  readonly isFreezePending?: boolean;
  readonly onShowPin: () => void;
  readonly onCardDetails: () => void;
  readonly onFreezeToggle: () => void;
}

export interface ManageCardListProps {
  readonly items: readonly ManageCardItemType[];
  readonly onItemPress: (itemId: ManageCardItemType) => void;
}

export interface PinBottomSheetProps {
  readonly isVisible: boolean;
  readonly pin: string;
  readonly onClose: () => void;
}

export interface CardDetailsBottomSheetProps {
  readonly isVisible: boolean;
  readonly card: CardData | null;
  readonly onClose: () => void;
  readonly onCopy: (value: string, label: string) => void;
}

export interface CardLabelBottomSheetProps {
  readonly isVisible: boolean;
  readonly cardId: string;
  readonly existingLabel: string | null;
  readonly onClose: () => void;
}

export interface CardControlItemProps {
  readonly control: CardControlSetting;
  readonly onToggle: (controlId: string, enabled: boolean) => void;
}

export interface CardControlsScreenProps {
  readonly controls: readonly CardControlSetting[];
  readonly onControlToggle: (controlId: string, enabled: boolean) => void;
  readonly onBack: () => void;
}

export interface ExpiryWarningProps {
  readonly message: string;
  readonly onReplace: () => void;
}

export interface AppleWalletButtonProps {
  readonly onPress: () => void;
  readonly isPending?: boolean;
}

export interface QRCodeScreenProps {
  readonly onScanPress: () => void;
  readonly onImportPress: () => void;
  readonly onHowItWorksPress: () => void;
}
