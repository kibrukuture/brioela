import { bankingTransactionReferenceTypeValues } from "@brioela/shared/drizzle/schema/banking-enums.schema";

export type BankingTransactionReferenceType =
  (typeof bankingTransactionReferenceTypeValues)[number];
