import { BankingCurrency } from "@brioela/shared/drizzle/schema/banking-enums.schema";

export function getBankDetailsTypeForCurrency(
  currency: (typeof BankingCurrency.enumValues)[number]
) {
  switch (currency) {
    case "usd":
      return "ach" as const;
    case "eur":
      return "iban_sepa" as const;
    case "aed":
      return "iban_single" as const;
    default:
      return null;
  }
}
