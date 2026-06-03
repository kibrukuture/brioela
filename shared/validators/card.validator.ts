import { z } from "@brioela/shared/zod";
import { BankingCurrency } from "@brioela/shared/drizzle/schema/banking-enums.schema";

export const cardTypeSchema = z.enum(["virtual", "physical"]);
export type CardType = z.infer<typeof cardTypeSchema>;

export const cardStatusSchema = z.enum([
  "pending",
  "active",
  "frozen",
  "cancelled",
]);
export type CardStatus = z.infer<typeof cardStatusSchema>;

export const cardBrandSchema = z.enum(["mastercard", "visa"]);
export type CardBrand = z.infer<typeof cardBrandSchema>;

export const cardSchema = z.object({
  id: z.string().min(1),
  type: cardTypeSchema,
  status: cardStatusSchema,
  brand: cardBrandSchema,
  last4: z.string().min(4).max(4),
  expiryMonth: z.number().int().min(1).max(12),
  expiryYear: z.number().int().min(2000).max(2100),
  currency: z.enum(BankingCurrency.enumValues),
  cardholderFirstName: z.string().min(1).nullable().optional(),
  cardholderLastName: z.string().min(1).nullable().optional(),
  label: z.string().nullable().optional(),
  theme: z.string().nullable().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type Card = z.infer<typeof cardSchema>;

export const listCardsResponseSchema = z.object({
  cards: z.array(cardSchema),
});

export type ListCardsResponse = z.infer<typeof listCardsResponseSchema>;

export const cardIdParamSchema = z.object({
  cardId: z.uuid(),
});

export type CardIdParam = z.infer<typeof cardIdParamSchema>;

export const cardOrderIdParamSchema = z.object({
  orderId: z.uuid(),
});

export type CardOrderIdParam = z.infer<typeof cardOrderIdParamSchema>;

export const setCardLabelSchema = z.object({
  label: z.string().min(1, "label is required").max(32, "label is too long"),
});

export type SetCardLabelInput = z.infer<typeof setCardLabelSchema>;

export const setCardLabelResponseSchema = z.object({
  cardId: z.string().min(1),
  label: z.string().nullable(),
});

export type SetCardLabelResponse = z.infer<typeof setCardLabelResponseSchema>;

export const cardSpendingLimitsSchema = z.object({
  dailyLimitAtomic: z.string().min(1).optional(),
  monthlyLimitAtomic: z.string().min(1).optional(),
});

export type CardSpendingLimitsInput = z.infer<typeof cardSpendingLimitsSchema>;

export const cardSpendingLimitsResponseSchema = z.object({
  cardId: z.string().min(1),
  dailyLimitAtomic: z.string().nullable(),
  monthlyLimitAtomic: z.string().nullable(),
});

export type CardSpendingLimitsResponse = z.infer<
  typeof cardSpendingLimitsResponseSchema
>;

export const freezeCardResponseSchema = z.object({
  cardId: z.string().min(1),
  status: cardStatusSchema,
});

export type FreezeCardResponse = z.infer<typeof freezeCardResponseSchema>;
