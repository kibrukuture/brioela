import { z } from "@schnl/shared/zod";
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from "@schnl/shared/constants";
import { QUEUE_ROUTES } from "@schnl/shared/api/queue.routes";

// Runtime array for Zod
const QUEUE_ROUTE_VALUES = Object.values(QUEUE_ROUTES);
// File validation schema
export const fileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: "File size must be less than 10MB",
  })
  .refine((file) => ALLOWED_FILE_TYPES.includes(file.type as any), {
    message: "File type not supported. Allowed: images, PDF, audio files",
  });

// Upload document request schema
export const uploadDocumentSchema = z.object({
  files: z.array(fileSchema).min(1, "At least one file is required"),
  sourceName: z.string().max(100).optional(),
  language: z.string().length(2).optional(), // ISO 639-1 codes (en, es, fr)
  notes: z.string().max(5000).optional(),
  urlPath: z.enum(QUEUE_ROUTE_VALUES),
});

export type UploadDocumentRequest = z.infer<typeof uploadDocumentSchema>;
