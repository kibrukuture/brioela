import { z } from "@schnl/shared/zod";

export const setCommunicationCodeSchema = z.object({
  code: z
    .string()
    .min(3, "Communication code must be at least 3 characters")
    .max(50, "Communication code must not exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9\s\-_.]+$/,
      "Communication code can only contain letters, numbers, spaces, hyphens, underscores, and periods"
    ),
});

export type SetCommunicationCodeInput = z.infer<
  typeof setCommunicationCodeSchema
>;

export const communicationCodeResponseSchema = z.object({
  code: z.string(),
  updatedAt: z.string(),
});

export type CommunicationCodeResponse = z.infer<
  typeof communicationCodeResponseSchema
>;
