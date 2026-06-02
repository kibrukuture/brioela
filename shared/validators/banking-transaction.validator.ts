import { z } from "@schnl/shared/zod";
import { BankingCurrency } from "@schnl/shared/drizzle/schema/banking-enums.schema";
import { BankingTransactionReferenceType } from "@schnl/shared/drizzle/schema/banking-enums.schema";
import { bankingTransactionCategorySchema } from "./banking-transaction-category.validator";
import { bankingTransactionAttachmentSchema } from "./banking-transaction-attachment.validator";

export const bankingTransactionDisplayMetadataSchema = z.discriminatedUnion(
  "kind",
  [
    z.object({
      kind: z.literal("card_checked"),
      infoMessage: z.string().min(1),
      when: z.string().min(1),
      where: z.string().min(1),
      whichCard: z.object({
        lastFourDigits: z.string().min(1),
        color: z.string().min(1),
      }),
      authorisedVia: z.string().min(1),
      note: z.string().optional().nullable(),
      isRecurringPayment: z.boolean(),
    }),
    z.object({
      kind: z.literal("card_payment"),
      merchantName: z.string().min(1),
      merchantLogo: z.url().optional().nullable(),
      when: z.string().min(1),
      where: z.string().min(1),
      whichCard: z.object({
        lastFourDigits: z.string().min(1),
        color: z.string().min(1),
      }),
      authorisedVia: z.string().min(1),
      note: z.string().optional().nullable(),
      isRecurringPayment: z.boolean(),
      howYouPaid: z.object({
        currency: z.string().min(1),
        currencyFlag: z.string().optional().nullable(),
        amountTaken: z.string().min(1),
      }),
    }),
    z.object({
      kind: z.literal("money_added"),
      recipientName: z.string().min(1),
      youPaid: z.string().min(1),
      wisesFees: z.string().min(1),
      theyWouldReceive: z.string().min(1),
      timeline: z.array(
        z.object({
          id: z.string().min(1),
          date: z.string().min(1),
          time: z.string().min(1),
          title: z.string().min(1),
          description: z.string().optional().nullable(),
          isHighlighted: z.boolean().optional().nullable(),
          note: z.string().optional().nullable(),
        })
      ),
      partnershipLogo: z.string().optional().nullable(),
      partnershipName: z.string().optional().nullable(),
    }),
    z.object({
      kind: z.literal("money_sent"),
      recipientName: z.string().min(1),
      youSent: z.string().min(1),
      wisesFees: z.string().min(1),
      youReceived: z.string().optional().nullable(),
      timeline: z.array(
        z.object({
          id: z.string().min(1),
          date: z.string().min(1),
          time: z.string().min(1),
          title: z.string().min(1),
          description: z.string().optional().nullable(),
          isHighlighted: z.boolean().optional().nullable(),
          note: z.string().optional().nullable(),
        })
      ),
      bankDetails: z
        .object({
          accountHolderName: z.string().min(1),
          iban: z.string().min(1),
          email: z.string().min(1),
          bankName: z.string().min(1),
        })
        .optional()
        .nullable(),
      splitTransactionUsers: z
        .array(
          z.object({
            id: z.string().min(1),
            name: z.string().min(1),
            avatarUrl: z.string().optional().nullable(),
          })
        )
        .optional()
        .nullable(),
    }),
    z.object({
      kind: z.literal("money_received"),
      senderName: z.string().min(1),
      youWereSent: z.string().min(1),
      wisesFees: z.string().min(1),
      youReceived: z.string().min(1),
      receivedOn: z.string().min(1),
      reference: z.string().min(1),
      partnershipLogo: z.string().optional().nullable(),
      partnershipName: z.string().optional().nullable(),
    }),
  ]
);

export type BankingTransactionDisplayMetadata = z.infer<
  typeof bankingTransactionDisplayMetadataSchema
>;

export const listBankingTransactionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
});

export type ListBankingTransactionsQuery = z.infer<
  typeof listBankingTransactionsQuerySchema
>;

export const bankingTransactionListItemSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  type: z.string().min(1),
  direction: z.string().min(1),
  status: z.string().min(1),
  amountAtomic: z.string().min(1),
  currency: z.enum(BankingCurrency.enumValues),
  rail: z.string().optional().nullable(),
  referenceType: z
    .enum(BankingTransactionReferenceType.enumValues)
    .optional()
    .nullable(),
  referenceId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
  settledAt: z.coerce.date().optional().nullable(),
  occurredAt: z.coerce.date().optional().nullable(),
  displayTitle: z.string().optional().nullable(),
  displaySubtitle: z.string().optional().nullable(),
  merchantLogoUrl: z.url().optional().nullable(),
  merchantInitial: z.string().optional().nullable(),
  category: bankingTransactionCategorySchema.optional().nullable(),
  note: z.string().optional().nullable(),
  attachments: z
    .array(bankingTransactionAttachmentSchema)
    .optional()
    .nullable(),
  transactionNumber: z.string().optional().nullable(),
  displayMetadataVersion: z.number().int().optional().nullable(),
  displayMetadata: bankingTransactionDisplayMetadataSchema
    .optional()
    .nullable(),
});

export type BankingTransactionListItem = z.infer<
  typeof bankingTransactionListItemSchema
>;

export const listBankingTransactionsResponseSchema = z.object({
  transactions: z.array(bankingTransactionListItemSchema),
  nextCursor: z.string().optional().nullable(),
});

export type ListBankingTransactionsResponse = z.infer<
  typeof listBankingTransactionsResponseSchema
>;
