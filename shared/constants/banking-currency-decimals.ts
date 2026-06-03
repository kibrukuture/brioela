import { BankingCurrency } from "@brioela/shared/drizzle/schema/banking-enums.schema";

export type BankingCurrencyCode = (typeof BankingCurrency.enumValues)[number];

export function getBankingCurrencyDecimals(
  currency: BankingCurrencyCode
): number {
  switch (currency) {
    case "usdc":
    case "usdt":
    case "eurc":
      return 6;
    case "eth":
      return 18;
    case "wbtc":
      return 8;
    default:
      return 2;
  }
}
