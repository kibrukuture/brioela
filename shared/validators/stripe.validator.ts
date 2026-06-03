import { z } from "@brioela/shared/zod";

export const createBillingPortalSchema = z.object({
  // Add any additional fields if needed, or keep empty if none required
});

export type CreateBillingPortalRequest = z.infer<
  typeof createBillingPortalSchema
>;

export const createTopupIntentSchema = z.object({
  // Amount in minor units (e.g. cents)
  amount: z.number().int().positive(),
  currency: z
    .string()
    .length(3)
    .transform((v) => v.toLowerCase())
    .default("usd"),
});

export type CreateTopupIntentRequest = z.infer<typeof createTopupIntentSchema>;

export const createTopupIntentResponseSchema = z.object({
  paymentIntentClientSecret: z.string().min(1),
  customerId: z.string().min(1),
  ephemeralKeySecret: z.string().min(1),
  defaultBillingDetails: z
    .object({
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      address: z
        .object({
          city: z.string().optional(),
          country: z.string().optional(),
          line1: z.string().optional(),
          line2: z.string().optional(),
          postalCode: z.string().optional(),
          state: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type CreateTopupIntentResponse = z.infer<
  typeof createTopupIntentResponseSchema
>;
