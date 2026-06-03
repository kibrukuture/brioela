import { z } from "@brioela/shared/zod";
import { cardTypeSchema } from "@brioela/shared/validators/card.validator";

export const cardOrderStatusSchema = z.enum([
  "created",
  "processing",
  "preparing",
  "shipped",
  "completed",
  "failed",
]);
export type CardOrderStatus = z.infer<typeof cardOrderStatusSchema>;

export const cardOrderFeeTypeSchema = z.enum([
  "virtual_creation",
  "physical_shipping",
]);
export type CardOrderFeeType = z.infer<typeof cardOrderFeeTypeSchema>;

export const shippingAddressSchema = z.object({
  addressLine1: z.string().trim().min(1, "addressLine1 is required"),
  addressLine2: z.string().trim().optional().nullable(),
  city: z.string().trim().min(1, "city is required"),
  state: z.string().trim().min(1, "state is required"),
  postalCode: z.string().trim().min(1, "postalCode is required"),
  country: z.string().trim().min(2, "country is required"),
});

export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

export const createCardOrderRequestSchema = z
  .object({
    type: cardTypeSchema,
    currency: z.literal("usd"),
    shippingAddress: shippingAddressSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "physical" && !data.shippingAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "shippingAddress is required for physical cards",
        path: ["shippingAddress"],
      });
    }
    if (data.type === "virtual" && data.shippingAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "shippingAddress is not allowed for virtual cards",
        path: ["shippingAddress"],
      });
    }
  });

export type CreateCardOrderRequest = z.infer<
  typeof createCardOrderRequestSchema
>;

export const cardOrderSchema = z.object({
  id: z.string().min(1),
  type: cardTypeSchema,
  status: cardOrderStatusSchema,
  feeType: cardOrderFeeTypeSchema,
  amountAtomic: z.string().min(1),
  currency: z.string().min(1),
  cardId: z.string().min(1).nullable().optional(),
  providerTransferId: z.string().min(1).nullable().optional(),
  providerTxHash: z.string().min(1).nullable().optional(),
  shippingAddress: shippingAddressSchema.nullable().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type CardOrder = z.infer<typeof cardOrderSchema>;

export const createCardOrderResponseSchema = z.object({
  order: cardOrderSchema,
});

export type CreateCardOrderResponse = z.infer<
  typeof createCardOrderResponseSchema
>;

export const getCardOrderResponseSchema = z.object({
  order: cardOrderSchema,
});

export type GetCardOrderResponse = z.infer<typeof getCardOrderResponseSchema>;
