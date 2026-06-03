import { z } from "@brioela/shared/zod";
import { sanitizeSchnlTag } from "@brioela/shared/utils/schnl-tag";

export const userSearchRequestSchema = z.object({
  query: z
    .string()
    .min(1)
    .transform((val) => val.trim()),
  limit: z.number().int().min(1).max(5).optional(),
  offset: z.number().int().min(0).optional(),
});

export const userSearchResultSchema = z.object({
  id: z.string(),
  schnlTag: z.string(),
  name: z.string(),
  profilePicture: z.string().nullable().optional(),
});

export const userSearchResponseSchema = z.object({
  results: z.array(userSearchResultSchema),
});

export type UserSearchRequest = z.infer<typeof userSearchRequestSchema>;
export type UserSearchResult = z.infer<typeof userSearchResultSchema>;
export type UserSearchResponse = z.infer<typeof userSearchResponseSchema>;

export function normalizeUserSearchQuery(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("@")) {
    return sanitizeSchnlTag(trimmed);
  }
  return trimmed;
}
