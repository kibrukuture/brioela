import { z } from "@schnl/shared/zod";

/**
 * Response payload for updating a user's public profile picture URL.
 * Note: The upload itself is performed via multipart/form-data at the API layer.
 * This validator is for the JSON response contract only.
 */
export const updateProfilePictureResponseSchema = z.object({
  profilePicture: z.url().nullable(),
});

export type UpdateProfilePictureResponse = z.infer<
  typeof updateProfilePictureResponseSchema
>;
