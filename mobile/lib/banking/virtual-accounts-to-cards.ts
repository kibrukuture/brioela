import type { CreateVirtualAccountResponse } from '@schnl/shared/validators/banking.validator';
import { CURRENCY_OPTIONS } from '@/lib/banking/currency-options';
import { formatAccountIdentifier } from '@/lib/banking/format-account-identifier';

export function virtualAccountsToCards(
  accounts: readonly CreateVirtualAccountResponse[] | undefined
) {
  return (accounts ?? []).map((account) => {
    const currencyCode = account.currency.toUpperCase();
    const currencyMeta = CURRENCY_OPTIONS.find((c) => c.code === currencyCode);

    return {
      id: account.id,
      currency: currencyCode,
      currencyCode,
      flag: currencyMeta?.flag,
      symbol: currencyMeta?.symbol,
      accountNumber: formatAccountIdentifier({
        iban: account.iban,
        accountNumber: account.accountNumber,
        providerId: account.providerId,
      }),
    };
  });
}
