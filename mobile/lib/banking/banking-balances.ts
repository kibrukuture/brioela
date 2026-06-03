import type { ListBankingBalancesResponse } from '@brioela/shared/validators/banking-balance.validator';
import { atomicToDecimalString, parseAmountAtomic } from '@brioela/shared/utils/money';
import { bankingCurrencyValues } from '@brioela/shared/drizzle/schema/banking-enums.schema';
import type { BankingCurrencyCode } from '@brioela/shared/constants/banking-currency-decimals';
import { CURRENCY_OPTIONS } from '@/lib/banking/currency-options';

export function bankingBalances(
  balancesData: ListBankingBalancesResponse | undefined,
  isVisible: boolean
) {
  const hidden = '***';

  if (!isVisible) {
    return { totalBalance: hidden, byCurrencyCode: {} };
  }

  const balances = balancesData?.balances ?? [];
  const byCurrencyCode: Record<string, string> = {};

  const currencyLookup: Record<string, BankingCurrencyCode> = {};
  for (const value of bankingCurrencyValues) {
    currencyLookup[value] = value;
  }

  for (const row of balances) {
    const upper = row.currency.toUpperCase();

    const currencyCode = currencyLookup[row.currency];

    let decimal = '0.00';
    if (
      typeof currencyCode === 'string' &&
      typeof row.availableAtomic === 'string' &&
      row.availableAtomic.length > 0
    ) {
      try {
        decimal = atomicToDecimalString(parseAmountAtomic(row.availableAtomic), currencyCode);
      } catch {
        decimal = '0.00';
      }
    }

    const meta = CURRENCY_OPTIONS.find((c) => c.code === upper);
    let formatted = `${decimal} ${upper}`;
    if (meta?.symbol) {
      formatted = `${meta.symbol}${decimal}`;
    }

    byCurrencyCode[upper] = formatted;
  }

  // USD is the temporary default for the "Total balance" display.
  const totalBalance = byCurrencyCode.USD ?? '0.00 USD';

  return { totalBalance, byCurrencyCode };
}
