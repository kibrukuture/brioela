import type {
  Transaction,
  MoneyAddedTransaction,
  MoneySentTransaction,
  MoneyReceivedTransaction,
  CardPaymentTransaction,
  CardCheckedTransaction,
} from './types';

const cardChecked1: CardCheckedTransaction = {
  id: '1',
  type: 'card_checked',
  amount: '0',
  currency: 'USD',
  transactionNumber: '#3191586081',
  createdAt: '2025-12-04T09:25:00Z',
  category: 'Entertainment',
  merchantName: 'Circle.com',
  merchantLogo: undefined,
  infoMessage: 'This was Circle.com checking your card is active.',
  when: '4 December 2025 at 09:25',
  where: 'Online',
  whichCard: {
    lastFourDigits: '1796',
    color: '#9AE6B4',
  },
  authorisedVia: 'Manual entry',
  note: undefined,
  isRecurringPayment: false,
};

const cardChecked2: CardCheckedTransaction = {
  id: '2',
  type: 'card_checked',
  amount: '0',
  currency: 'USD',
  transactionNumber: '#3191586082',
  createdAt: '2025-12-04T09:25:00Z',
  category: 'Entertainment',
  merchantName: 'Circle.com',
  merchantLogo: undefined,
  infoMessage: 'This was Circle.com checking your card is active.',
  when: '4 December 2025 at 09:25',
  where: 'Online',
  whichCard: {
    lastFourDigits: '1796',
    color: '#9AE6B4',
  },
  authorisedVia: 'Manual entry',
  note: undefined,
  isRecurringPayment: false,
};

const googleCloudPayment: CardPaymentTransaction = {
  id: '3',
  type: 'card_payment',
  amount: '0.70',
  currency: 'TRY',
  transactionNumber: '#3182750355',
  createdAt: '2025-12-01T21:41:00Z',
  category: 'Bills',
  merchantName: 'Google Cloud',
  merchantLogo:
    'https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png',
  when: '1 December 2025 at 21:41',
  where: 'Online',
  whichCard: {
    lastFourDigits: '1796',
    color: '#9AE6B4',
  },
  authorisedVia: 'Saved details',
  note: undefined,
  isRecurringPayment: true,
  howYouPaid: {
    currency: 'TRY',
    currencyFlag: '🇹🇷',
    amountTaken: '0,70 TRY',
  },
  splitTransactionUsers: undefined,
};

const starbucksPayment: CardPaymentTransaction = {
  id: '4',
  type: 'card_payment',
  amount: '270',
  currency: 'TRY',
  transactionNumber: '#3182750356',
  createdAt: '2024-05-30T20:37:00Z',
  category: 'Eating out',
  merchantName: 'Starbucks',
  merchantLogo:
    'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/1200px-Starbucks_Corporation_Logo_2011.svg.png',
  when: '30 May 2024 at 20:37',
  where: 'IZMIR, Turkey',
  whichCard: {
    lastFourDigits: '1796',
    color: '#9AE6B4',
  },
  authorisedVia: 'Contactless',
  note: undefined,
  isRecurringPayment: false,
  howYouPaid: {
    currency: 'TRY',
    currencyFlag: '🇹🇷',
    amountTaken: '270 TRY',
  },
  splitTransactionUsers: [
    { id: '1', name: 'You', avatarUrl: 'https://i.pravatar.cc/100?img=1' },
    { id: '2', name: 'Add', avatarUrl: undefined },
  ],
};

const moneyAdded: MoneyAddedTransaction = {
  id: '5',
  type: 'money_added',
  amount: '200',
  currency: 'TRY',
  transactionNumber: '#1080139397',
  createdAt: '2024-05-23T15:30:00Z',
  category: 'General',
  recipientName: 'KIBRU JOBA KUTURE',
  youPaid: '200 TRY',
  wisesFees: '0 TRY',
  theyWouldReceive: '200 TRY',
  timeline: [
    {
      id: '1',
      date: 'May 23, 2024',
      time: '3:05 PM',
      title: 'You set up your transfer',
      isHighlighted: false,
    },
    {
      id: '2',
      date: 'May 23, 2024',
      time: '3:30 PM',
      title: 'We received your TRY',
      isHighlighted: false,
    },
    {
      id: '3',
      date: 'May 23, 2024',
      time: '3:30 PM',
      title: 'We paid out your TRY',
      isHighlighted: false,
    },
    {
      id: '4',
      date: 'May 23, 2024',
      time: '3:30 PM',
      title: "Your transfer's complete",
      description: 'We sent 200 TRY to KIBRU JOBA KUTURE.',
      isHighlighted: true,
    },
  ],
  partnershipLogo: 'moka',
  partnershipName: 'Moka United',
};

const moneySent: MoneySentTransaction = {
  id: '6',
  type: 'money_sent',
  amount: '2,075.66',
  currency: 'TRY',
  transactionNumber: '#1080181923',
  createdAt: '2024-05-23T15:42:00Z',
  category: 'General',
  recipientName: 'KIBRU JOBA KUTURE',
  youSent: '2.100 TRY',
  wisesFees: '24,34 TRY',
  youReceived: '2.075,66 TRY',
  timeline: [
    {
      id: '1',
      date: 'May 23, 2024',
      time: '3:41 PM',
      title: 'You set up your transfer',
      isHighlighted: false,
    },
    {
      id: '2',
      date: 'May 23, 2024',
      time: '3:41 PM',
      title: 'You used TRY in your Wise account',
      isHighlighted: false,
    },
    {
      id: '3',
      date: 'May 23, 2024',
      time: '3:41 PM',
      title: 'We paid out your TRY',
      isHighlighted: false,
    },
    {
      id: '4',
      date: 'May 23, 2024',
      time: '3:42 PM',
      title: 'Transfer successfully sent to your bank',
      note: 'Keep in mind — It can take up to 2 working days for your bank to credit the account.',
      isHighlighted: true,
    },
  ],
  bankDetails: {
    accountHolderName: 'KIBRU JOBA KUTURE',
    iban: 'TR23 0006 4000 0013 4470 9448 37',
    email: 'kibrukuture@gmail.com',
    bankName: 'TURKIYE IS BANKASI A.S.',
  },
  splitTransactionUsers: [
    { id: '1', name: 'You', avatarUrl: 'https://i.pravatar.cc/100?img=1' },
    { id: '2', name: 'Add', avatarUrl: undefined },
  ],
};

const moneyReceived: MoneyReceivedTransaction = {
  id: '7',
  type: 'money_received',
  amount: '1,900',
  currency: 'TRY',
  transactionNumber: '#1080170684',
  createdAt: '2024-05-23T00:00:00Z',
  category: 'General',
  senderName: 'Kıbru Joba Kuture',
  youWereSent: '1.900 TRY',
  wisesFees: '0 TRY',
  youReceived: '1.900 TRY',
  receivedOn: '23 May 2024 Thursday',
  reference: '98272353',
  partnershipLogo: 'moka',
  partnershipName: 'Moka United',
};

export const allTransactions: Transaction[] = [
  cardChecked1,
  cardChecked2,
  googleCloudPayment,
  starbucksPayment,
  moneyAdded,
  moneySent,
  moneyReceived,
];

export const getTransactionById = (id: string): Transaction | undefined => {
  return allTransactions.find((t) => t.id === id);
};
