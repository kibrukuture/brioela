import type { CreateVirtualAccountResponse } from '@brioela/shared/validators/banking.validator';
import { CURRENCIES } from '@/components/payments/currencies';

export function getTransferDetails(
  selectedCurrency: string | null,
  accounts: readonly CreateVirtualAccountResponse[] | undefined
) {
  const availableCurrencies = (accounts ?? []).map((a) => String(a.currency));
  const effectiveCurrency =
    selectedCurrency && availableCurrencies.includes(selectedCurrency)
      ? selectedCurrency
      : (availableCurrencies[0] ?? 'EUR');

  const selectedAccount = (accounts ?? []).find((a) => a.currency === effectiveCurrency);

  const meta = CURRENCIES.find((c) => c.code === effectiveCurrency);

  const currencies = availableCurrencies.length ? availableCurrencies : ['EUR', 'USD', 'AED'];
  const currencyOptions = currencies.map((code) => ({
    label: code,
    value: code,
  }));

  const details = {
    code: effectiveCurrency,
    name: meta?.name ?? effectiveCurrency,
    holderName: selectedAccount?.accountBeneficiaryName ?? '—',
    iban: selectedAccount?.iban ?? '',
    swiftBic: selectedAccount?.bic ?? '',
    bankName: selectedAccount?.bankName ?? '—',
    bankAddress: selectedAccount?.bankAddress ?? '—',
    routingNumber: selectedAccount?.routingNumber ?? undefined,
    accountNumber: selectedAccount?.accountNumber ?? undefined,
  };

  return {
    selectedCurrency: effectiveCurrency,
    currencies,
    currencyOptions,
    details,
  };
}
