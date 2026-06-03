import { z } from '@brioela/shared/zod';

/**
 * Creates a generic, type-safe fetcher function.
 * This function will be the foundation for all our data-fetching hooks.
 * * @param schema The Zod schema to validate the API response against.
 * @returns An async function that takes fetch arguments and returns validated, camelCased data.
 */
export function createZodFetcher<T extends z.ZodTypeAny>(schema: T) {
  return async (url: string, fetchOptions?: RequestInit): Promise<z.infer<T>> => {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      // Try to parse the error body for a more specific message from our API
      try {
        const errorBody = await response.json();
        throw new Error(errorBody.error || `API request failed with status ${response.status}`);
      } catch {
        throw new Error(
          `API request failed with status ${response.status} and could not parse error body.`
        );
      }
    }

    // --- Success Case 1: No Content (for DELETE requests) ---
    // A successful DELETE request often returns a 204 status with no body.
    if (response.status === 204) {
      // We return an empty object. The Zod schema for a DELETE response
      // should be z.object({}) to correctly validate this.
      return schema.parse({});
    }

    const data = await response.json();

    const validationResult = schema.safeParse(data);

    if (!validationResult.success) {
      console.error('Zod validation failed:', validationResult.error.flatten());
      throw new Error('API response validation failed. The data shape is incorrect.');
    }

    return validationResult.data;
  };
}
