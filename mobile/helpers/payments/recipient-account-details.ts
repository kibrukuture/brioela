import type { AccountDetails } from '@/components/payments/payment';

type BankDetails =
  | {
      type: 'ach';
      fullName: string;
      bankName: string;
      accountNumber: string;
      routingNumber: string;
      accountType: 'checking' | 'savings';
    }
  | {
      type: 'iban_sepa';
      fullName: string;
      bankName: string;
      iban: string;
      region: 'inside_europe' | 'outside_europe';
      swift?: string;
    }
  | {
      type: 'iban_single';
      fullName: string;
      bankName: string;
      iban: string;
      swift?: string;
    };

export function recipientAccountDetails(details: BankDetails | null): AccountDetails | null {
  if (!details) return null;

  switch (details.type) {
    case 'ach':
      return {
        region: 'outside_europe',
        fullName: details.fullName,
        bankName: details.bankName,
        accountNumber: details.accountNumber,
        routingNumber: details.routingNumber,
        accountType: details.accountType,
      };
    case 'iban_sepa':
      return {
        region: details.region,
        fullName: details.fullName,
        bankName: details.bankName,
        iban: details.iban,
        swift: details.swift || undefined,
      };
    case 'iban_single':
      return {
        region: 'outside_europe',
        fullName: details.fullName,
        bankName: details.bankName,
        iban: details.iban,
        swift: details.swift || undefined,
      };
  }
}
