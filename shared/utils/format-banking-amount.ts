import { SUPPORTED_CURRENCIES } from "@brioela/shared/constants/currencies";
import type { BankingCurrencyCode } from "@brioela/shared/constants/banking-currency-decimals";
import {
  atomicToDecimalString,
  parseAmountAtomic,
} from "@brioela/shared/utils/money";

export function formatBankingAmount(params: {
  amountAtomic: bigint | string;
  currency: BankingCurrencyCode;
}): {
  symbol: string;
  currency: BankingCurrencyCode;
  display: string;
} {
  const amountBigint =
    typeof params.amountAtomic === "bigint"
      ? params.amountAtomic
      : parseAmountAtomic(params.amountAtomic);

  const currencyLower = params.currency;
  const upper = currencyLower.toUpperCase();

  const supported = SUPPORTED_CURRENCIES.find((c) => c.code === upper);
  const symbol = supported?.symbol ?? upper;

  const absDecimal = atomicToDecimalString(
    amountBigint < 0n ? -amountBigint : amountBigint,
    currencyLower
  );

  const trimmedDecimal = (() => {
    if (!absDecimal.includes(".")) return absDecimal;
    const withoutTrailingZeros = absDecimal.replace(/0+$/, "");
    return withoutTrailingZeros.endsWith(".")
      ? withoutTrailingZeros.slice(0, -1)
      : withoutTrailingZeros;
  })();

  return {
    symbol,
    currency: currencyLower,
    display: `${symbol}${trimmedDecimal}`,
  };
}
