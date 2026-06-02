export type SupportedCurrencyCode = "USD" | "EUR" | "AED";

export type SupportedCurrency = {
  code: SupportedCurrencyCode;
  name: string;
  symbol: string;
};

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
] as const;

export type SupportedBankingCurrencyCode = Lowercase<SupportedCurrencyCode>;

export const SUPPORTED_BANKING_CURRENCY_CODES = SUPPORTED_CURRENCIES.map(
  (c) => c.code.toLowerCase() as SupportedBankingCurrencyCode
) as [SupportedBankingCurrencyCode, ...SupportedBankingCurrencyCode[]];

export const SUPPORTED_BANKING_COUNTRY_FLAG_BY_CURRENCY: Record<
  SupportedBankingCurrencyCode,
  "us" | "eu" | "ae"
> = {
  usd: "us",
  eur: "eu",
  aed: "ae",
};
