import { z } from "@brioela/shared/zod";
import {
  BankingCurrency,
  BankingRail,
  HolderType,
} from "@brioela/shared/drizzle/schema/banking-enums.schema";
import { BankingKycStatus } from "@brioela/shared/drizzle/schema/user.schema";

export const alignCustomerSchema = z.object({
  customer_id: z.string().min(1),
  type: z.enum(HolderType.enumValues),

  email: z.email().nullable().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),

  address: z
    .object({
      street_line_1: z.string().nullable().optional(),
      city: z.string().nullable().optional(),
      postal_code: z.string().nullable().optional(),
      country: z.string().nullable().optional(),
      state: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),

  kycs: z
    .object({
      status: z.enum(BankingKycStatus.enumValues),
      sub_status: z.string().nullable().optional(),
      kyc_flow_link: z.url().nullable().optional(),
      status_breakdown: z
        .array(
          z.object({
            status: z.enum(BankingKycStatus.enumValues),
            currency: z
              .string()
              .transform((val) => val.toLowerCase())
              .pipe(z.enum(BankingCurrency.enumValues)),
            payment_rails: z
              .string()
              .transform((val) => val.toLowerCase())
              .pipe(z.enum(BankingRail.enumValues)),
          })
        )
        .optional(),
    })
    .nullable()
    .optional(),
});

export type AlignCustomer = z.infer<typeof alignCustomerSchema>;
