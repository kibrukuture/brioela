import { create } from 'zustand';
import type { SupportedCurrencyCode, TransferPurpose } from '@brioela/shared/constants';

export type AccountDetailsType = 'ach' | 'iban_sepa' | 'iban_single';

export interface AchAccountDetails {
  type: 'ach';
  fullName: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
}

export interface IbanSepaAccountDetails {
  type: 'iban_sepa';
  fullName: string;
  bankName: string;
  iban: string;
  region: 'inside_europe' | 'outside_europe';
  swift?: string;
}

export interface IbanSingleAccountDetails {
  type: 'iban_single';
  fullName: string;
  bankName: string;
  iban: string;
  swift?: string;
}

export type CurrencyAccountDetails =
  | AchAccountDetails
  | IbanSepaAccountDetails
  | IbanSingleAccountDetails;

interface PaymentFlowState {
  selectedCurrency: SupportedCurrencyCode | null;
  accountDetails: CurrencyAccountDetails | null;

  transferPurpose: TransferPurpose | null;
  saveRecipient: boolean;
  label: string;

  setSelectedCurrency: (currency: SupportedCurrencyCode) => void;
  setAccountDetails: (details: CurrencyAccountDetails) => void;
  setTransferPurpose: (purpose: TransferPurpose | null) => void;
  setSaveRecipient: (save: boolean) => void;
  setLabel: (label: string) => void;
  getAccountDetailsType: () => AccountDetailsType | null;
  isAccountDetailsComplete: () => boolean;
  resetPaymentFlow: () => void;
}

const getAccountDetailsTypeForCurrency = (currency: SupportedCurrencyCode): AccountDetailsType => {
  switch (currency) {
    case 'USD':
      return 'ach';
    case 'EUR':
      return 'iban_sepa';
    case 'AED':
      return 'iban_single';
  }
};

export const usePaymentFlowStore = create<PaymentFlowState>((set, get) => ({
  selectedCurrency: null,
  accountDetails: null,

  transferPurpose: null,
  saveRecipient: false,
  label: '',

  setSelectedCurrency: (currency) => {
    set({
      selectedCurrency: currency,
      accountDetails: null,
      transferPurpose: null,
      saveRecipient: false,
      label: '',
    });
  },

  setAccountDetails: (details) => {
    set({ accountDetails: details });
  },

  setTransferPurpose: (purpose) => {
    set({ transferPurpose: purpose });
  },

  setSaveRecipient: (save) => {
    set({ saveRecipient: save, label: save ? get().label : '' });
  },

  setLabel: (label) => {
    set({ label });
  },

  getAccountDetailsType: () => {
    const currency = get().selectedCurrency;
    if (!currency) return null;
    return getAccountDetailsTypeForCurrency(currency);
  },

  isAccountDetailsComplete: () => {
    const details = get().accountDetails;
    if (!details) return false;

    switch (details.type) {
      case 'ach':
        return (
          details.fullName.trim().length > 0 &&
          details.bankName.trim().length > 0 &&
          details.accountNumber.trim().length > 0 &&
          details.routingNumber.trim().length === 9
        );
      case 'iban_sepa':
        return (
          details.fullName.trim().length > 0 &&
          details.bankName.trim().length > 0 &&
          details.iban.trim().length > 0 &&
          (details.swift?.trim()?.length ?? 0) > 0
        );
      case 'iban_single':
        return (
          details.fullName.trim().length > 0 &&
          details.bankName.trim().length > 0 &&
          details.iban.trim().length > 0
        );
    }
  },

  resetPaymentFlow: () =>
    set({
      selectedCurrency: null,
      accountDetails: null,
      transferPurpose: null,
      saveRecipient: false,
      label: '',
    }),
}));
