import { z } from "@schnl/shared/zod";
import {
  validateSchnlTag,
  sanitizeSchnlTag,
} from "@schnl/shared/utils/schnl-tag";

export const setSchnlTagSchema = z.object({
  schnlTag: z
    .string()
    .transform((val) => sanitizeSchnlTag(val))
    .superRefine((val, ctx) => {
      const result = validateSchnlTag(val);
      if (!result.valid) {
        ctx.addIssue({
          code: "custom",
          message: result.error,
        });
      }
    }),
});

export const checkSchnlTagSchema = z.object({
  tag: z
    .string()
    .transform((val) => sanitizeSchnlTag(val))
    .superRefine((val, ctx) => {
      const result = validateSchnlTag(val);
      if (!result.valid) {
        ctx.addIssue({
          code: "custom",
          message: result.error,
        });
      }
    }),
});

export const updatePrivacySchema = z.object({
  isDiscoverable: z.boolean(),
});

export const kycLegalNameSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .regex(
      /^[a-zA-Z\s-]+$/,
      "First name can only contain letters, spaces, and hyphens"
    ),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .regex(
      /^[a-zA-Z\s-]+$/,
      "Last name can only contain letters, spaces, and hyphens"
    ),
});

// Response Schema
export const checkSchnlTagResponseSchema = z.object({
  available: z.boolean(),
  tag: z.string().optional(),
});

export type SetSchnlTagInput = z.infer<typeof setSchnlTagSchema>;
export type CheckSchnlTagInput = z.infer<typeof checkSchnlTagSchema>;
export type UpdatePrivacyInput = z.infer<typeof updatePrivacySchema>;
export type KycLegalNameInput = z.infer<typeof kycLegalNameSchema>;
export type CheckSchnlTagResponse = z.infer<typeof checkSchnlTagResponseSchema>;
