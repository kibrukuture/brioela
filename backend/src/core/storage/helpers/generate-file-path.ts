import { nanoid } from 'nanoid';

export function generateFilePath({ userId, filename, folder }: { userId: string; filename: string; folder?: string }): string {
	const timestamp = Date.now();
	const uniqueId = nanoid();
	const extension = filename.split('.').pop();

	return `${folder}/${userId}/${timestamp}_${uniqueId}.${extension}`;
}
