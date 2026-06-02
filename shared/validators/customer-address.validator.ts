import { z } from "@schnl/shared/zod";

export const customerAddressResponseSchema = z.object({
  address: z
    .object({
      streetLine1: z.string().nullable(),
      city: z.string().nullable(),
      state: z.string().nullable(),
      postalCode: z.string().nullable(),
      country: z.string().nullable(),
    })
    .nullable(),
});

export type CustomerAddressResponse = z.infer<
  typeof customerAddressResponseSchema
>;
