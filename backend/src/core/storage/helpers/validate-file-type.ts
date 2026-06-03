import { ALLOWED_FILE_TYPES } from '@schnl/shared/constants';
export function isValidFileType(mimeType: string): boolean {
	return (ALLOWED_FILE_TYPES as readonly string[]).includes(mimeType);
}

export function getFileExtension(filename: string): string {
	return filename.split('.').pop()?.toLowerCase() || '';
}

export function mapMimeTypeToFileType(mimeType: string): 'pdf' | 'image' | 'audio' | 'other' {
	if (mimeType === 'application/pdf') return 'pdf';
	if (mimeType.startsWith('image/')) return 'image';
	if (mimeType.startsWith('audio/')) return 'audio';
	return 'other';
}
