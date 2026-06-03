import { z } from "@brioela/shared/zod";

export const bankingTransactionCategoryValues = [
  // Money movement
  "income",
  "deposit",
  "withdrawal",
  "transfer",
  "exchange",

  "refund",
  "chargeback",
  "cashback_rewards",
  "loan_credit",
  "loan_repayment",
  "savings",

  "salary_wages",
  "freelance",
  "gift_received",
  "gift_sent",

  // Spending
  "groceries",
  "restaurants",
  "coffee",
  "fast_food",
  "shopping",
  "clothing",
  "electronics",
  "home",
  "home_improvement",
  "transport",
  "fuel",
  "parking",
  "public_transport",
  "rideshare_taxi",
  "travel",
  "hotel",
  "flights",
  "car_rental",
  "entertainment",
  "sports_fitness",
  "health",
  "pharmacy",
  "education",
  "utilities",
  "internet_phone",
  "rent_mortgage",
  "subscriptions",
  "insurance",
  "fees",
  "bank_fees",
  "card_fees",
  "taxes",
  "charity",
  "cash",

  "pets",
  "family_kids",
  "beauty",
  "personal_care",
  "professional_services",

  "crypto_buy",
  "crypto_sell",
  "crypto_swap",
  "crypto_transfer",
  "crypto_fees",
  "staking_rewards",
  "nft",

  "investment_buy",
  "investment_sell",
  "dividends",
  "interest",
  "other",
] as const;

export const bankingTransactionCategorySchema = z.enum(
  bankingTransactionCategoryValues
);

export type BankingTransactionCategory = z.infer<
  typeof bankingTransactionCategorySchema
>;
