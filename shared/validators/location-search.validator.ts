import { z } from "@brioela/shared/zod";

export const locationSearchRequestSchema = z.object({
  query: z.string().min(1, "query is required"),
  limit: z.number().int().min(1).max(20).optional(),
  countryCodes: z.array(z.string().min(2)).optional(),
});

export type LocationSearchRequest = z.infer<typeof locationSearchRequestSchema>;

export const locationSearchResultSchema = z.object({
  placeId: z.string().min(1),
  displayName: z.string().min(1),
  lat: z.string().min(1),
  lon: z.string().min(1),
  address: z
    .object({
      name: z.string().optional(),
      house_number: z.string().optional(),
      road: z.string().optional(),
      neighbourhood: z.string().optional(),
      city: z.string().optional(),
      town: z.string().optional(),
      village: z.string().optional(),
      state: z.string().optional(),
      postcode: z.string().optional(),
      country: z.string().optional(),
      country_code: z.string().optional(),
    })
    .nullable(),
});

export type LocationSearchResult = z.infer<typeof locationSearchResultSchema>;

export const locationSearchResponseSchema = z.object({
  results: z.array(locationSearchResultSchema),
});

export type LocationSearchResponse = z.infer<
  typeof locationSearchResponseSchema
>;
