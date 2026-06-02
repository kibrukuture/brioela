import type { CreateVirtualAccountResponse } from '@schnl/shared/validators/banking.validator';
import { createVirtualAccountSchema } from '@schnl/shared/validators/banking.validator';
import { CURRENCY_OPTIONS } from '@/lib/banking/currency-options';
import { formatAccountIdentifier } from '@/lib/banking/format-account-identifier';

export function getVirtualAccountSummary(
  currency: string,
  accounts: CreateVirtualAccountResponse[] | undefined
) {
  const validation = createVirtualAccountSchema.safeParse({ currency: currency.toLowerCase() });
  const normalized = validation.success ? validation.data.currency : null;
  const account = normalized ? accounts?.find((a) => a.currency === normalized) : undefined;
  const currencyMeta = CURRENCY_OPTIONS.find(
    (c) => c.code.toLowerCase() === currency.toLowerCase()
  );

  return {
    code: currency,
    name: currencyMeta?.name ?? currency,
    symbol: currencyMeta?.symbol,
    accountNumber: account
      ? formatAccountIdentifier({
          iban: account.iban,
          accountNumber: account.accountNumber,
          providerId: account.providerId,
        })
      : '—',
    verified: Boolean(account),
  };
}
