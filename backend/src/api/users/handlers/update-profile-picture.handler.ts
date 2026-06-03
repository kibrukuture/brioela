import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';

import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { uploadFile, deleteFile } from '@/core/storage/services/s3.service';
import { users } from '@schnl/shared/drizzle/schema/user.schema';
import { eq } from '@schnl/shared/drizzle';
import type { UpdateProfilePictureResponse } from '@schnl/shared/validators/profile-picture.validator';
import { PUBLIC_S3_URL } from '@schnl/shared/constants';
const ALLOWED_CONTENT_TYPES = new Set<string>(['image/jpeg', 'image/png', 'image/webp']);

// Optimized avatars should be small. Keep a strict server-side cap anyway.
const MAX_PROFILE_PICTURE_BYTES = 1024 * 1024; // 1mb

/**
 * Parses multipart/form-data profile picture upload, uploads to R2 (S3), and updates users.profilePicture.
 *
 * Expected multipart field:
 * - `file`: the optimized image
 *
 * Returns:
 * - { profilePicture: publicUrl | null }
 */
export async function updateProfilePicture(c: AppContext): Promise<UpdateProfilePictureResponse> {
	const authUser = c.get('user');
	if (!authUser?.id) {
		throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });
	}

	// Hono provides formData parsing on the Request in many runtimes.
	// If your runtime differs, wire it through your existing multipart middleware.
	const contentTypeHeader = c.req.header('content-type') ?? c.req.header('Content-Type');
	if (!contentTypeHeader || !contentTypeHeader.toLowerCase().includes('multipart/form-data')) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: 'Expected multipart/form-data',
		});
	}

	let form: FormData;
	try {
		form = await c.req.formData();
	} catch (error: unknown) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: error instanceof Error ? error.message : 'Failed to parse multipart form data',
		});
	}

	const filePart = form.get('file');
	if (!(filePart instanceof File)) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: 'Missing multipart file field: file',
		});
	}

	const fileType = filePart.type;
	if (!fileType || !ALLOWED_CONTENT_TYPES.has(fileType)) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: `Invalid file type. Allowed: ${Array.from(ALLOWED_CONTENT_TYPES).join(', ')}`,
		});
	}

	// Enforce max size
	const arrayBuffer = await filePart.arrayBuffer();
	if (arrayBuffer.byteLength > MAX_PROFILE_PICTURE_BYTES) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: `Profile picture too large. Max ${MAX_PROFILE_PICTURE_BYTES} bytes`,
		});
	}
	const [user] = await getDb().select().from(users).where(eq(users.id, authUser.id)).limit(1);

	try {
		const oldUrl = user.profilePicture;
		if (oldUrl) {
			// PUBLIC_S3_URL is base like https://file.schnl.com/
			// We need the S3 key (path after base) to delete
			const key = oldUrl.replace(PUBLIC_S3_URL + '/', '');
			if (key) {
				await deleteFile({ filePath: key });
			}
		}
	} catch (e) {}

	// Use the existing S3 helper directly (multipart provides a File already)
	const fileKey = await uploadFile({
		file: filePart,
		userId: authUser.id,
		folder: 'profile-pictures',
	});

	const publicUrl = `${PUBLIC_S3_URL}/${fileKey}`;

	const db = getDb();

	const [updated] = await db
		.update(users)
		.set({
			profilePicture: publicUrl,
			updatedAt: new Date(),
		})
		.where(eq(users.id, authUser.id))
		.returning({
			profilePicture: users.profilePicture,
		});

	if (!updated) {
		throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'User not found' });
	}

	return {
		profilePicture: updated.profilePicture ?? null,
	};
}
