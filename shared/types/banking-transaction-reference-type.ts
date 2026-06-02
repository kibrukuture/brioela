import { bankingTransactionReferenceTypeValues } from "@schnl/shared/drizzle/schema/banking-enums.schema";

export type BankingTransactionReferenceType =
  (typeof bankingTransactionReferenceTypeValues)[number];
