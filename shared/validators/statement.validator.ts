import { z } from "@brioela/shared/zod";

export const generateStatementRequestSchema = z.object({
  startDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid start date format",
    }),
  endDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid end date format",
    }),
});

export type GenerateStatementRequest = z.infer<
  typeof generateStatementRequestSchema
>;

export const generateStatementResponseSchema = z.object({
  fileName: z.string(),
  fileSize: z.number(),
});

export type GenerateStatementResponse = z.infer<
  typeof generateStatementResponseSchema
>;
