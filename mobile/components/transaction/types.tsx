// Transaction Types - Strictly typed interfaces for all transaction scenarios

export type TransactionType =
  | 'money_added'
  | 'money_sent'
  | 'money_received'
  | 'card_payment'
  | 'card_checked';

export type TransactionCategory =
  | 'General'
  | 'Eating out'
  | 'Entertainment'
  | 'Bills'
  | 'Shopping'
  | 'Transport'
  | 'Groceries'
  | 'Health'
  | 'Travel';

export type AuthorisedVia =
  | 'Contactless'
  | 'Chip and PIN'
  | 'Online'
  | 'Manual entry'
  | 'Saved details';

export interface TimelineStep {
  id: string;
  date: string;
  time: string;
  title: string;
  description?: string;
  isHighlighted?: boolean;
  note?: string;
}

export interface BankDetails {
  accountHolderName: string;
  iban: string;
  email: string;
  bankName: string;
}

export interface CardDetails {
  lastFourDigits: string;
  color: string;
}

export interface SplitTransactionUser {
  id: string;
  avatarUrl?: string;
  name: string;
}

export interface BaseTransaction {
  id: string;
  transactionNumber: string;
  amount: string;
  currency: string;
  type: TransactionType;
  category?: TransactionCategory;
  categoryIcon?: string;
  createdAt: string;
}

export interface MoneyAddedTransaction extends BaseTransaction {
  type: 'money_added';
  recipientName?: string;
  youPaid: string;
  wisesFees: string;
  theyWouldReceive: string;
  timeline: TimelineStep[];
  partnershipLogo?: string;
  partnershipName?: string;
}

export interface MoneySentTransaction extends BaseTransaction {
  type: 'money_sent';
  recipientName: string;
  youSent: string;
  wisesFees: string;
  youReceived?: string;
  timeline: TimelineStep[];
  bankDetails?: BankDetails;
  splitTransactionUsers?: SplitTransactionUser[];
}

export interface MoneyReceivedTransaction extends BaseTransaction {
  type: 'money_received';
  senderName: string;
  youWereSent: string;
  wisesFees: string;
  youReceived: string;
  receivedOn: string;
  reference: string;
  partnershipLogo?: string;
  partnershipName?: string;
}

export interface CardPaymentTransaction extends BaseTransaction {
  type: 'card_payment';
  merchantName: string;
  merchantLogo?: string;
  when: string;
  where: string;
  whichCard: CardDetails;
  authorisedVia: AuthorisedVia;
  note?: string;
  isRecurringPayment: boolean;
  howYouPaid: {
    currency: string;
    currencyFlag?: string;
    amountTaken: string;
  };
  splitTransactionUsers?: SplitTransactionUser[];
}

export interface CardCheckedTransaction extends BaseTransaction {
  type: 'card_checked';
  merchantName: string;
  merchantLogo?: string;
  infoMessage: string;
  when: string;
  where: string;
  whichCard: CardDetails;
  authorisedVia: AuthorisedVia;
  note?: string;
  isRecurringPayment: boolean;
}

export type Transaction =
  | MoneyAddedTransaction
  | MoneySentTransaction
  | MoneyReceivedTransaction
  | CardPaymentTransaction
  | CardCheckedTransaction;

export interface TransactionDetailScreenProps {
  transaction: Transaction;
  onBack: () => void;
  onHelp?: () => void;
  onMore?: () => void;
  onRepeatTransfer?: () => void;
  onRateApp?: () => void;
  onGetConfirmation?: () => void;
  onAddNote?: () => void;
  onAddReceipt?: () => void;
  onToggleRecurring?: (value: boolean) => void;
  onSplitTransaction?: () => void;
}
