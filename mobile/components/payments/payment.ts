// TODO: All types must come from the shared package. Correct this. this file shoud not exist here.  Remove this file.
import type { SupportedCurrency } from '@brioela/shared/constants';

export interface Recipient {
  id: string;
  type: 'myself' | 'someone_else' | 'business_or_charity';
  name: string;
  email?: string;
  schnltag?: string;
  avatar?: string;
  accountDetails?: AccountDetails;
}

export interface AccountDetails {
  region: 'inside_europe' | 'outside_europe';
  fullName: string;
  bankName: string;
  iban?: string;
  swift?: string;
  accountNumber?: string;
  routingNumber?: string;
  accountType?: 'checking' | 'savings';
  email?: string;
}

export interface PaymentFlow {
  amount: number;
  sourceCurrency: SupportedCurrency;
  targetCurrency: SupportedCurrency;
  recipient: Recipient | null;
  accountDetails: AccountDetails | null;
  step:
    | 'amount'
    | 'recipient_type'
    | 'find_recipient'
    | 'account_details'
    | 'upload_recipient'
    | 'email_payment'
    | 'review_schnl'
    | 'review'
    | 'confirm';
}
