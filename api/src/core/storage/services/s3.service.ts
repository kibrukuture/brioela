import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getS3Client, getBucketName } from '@/core/storage/s3-client';
import { generateFilePath } from '@/core/storage/helpers/generate-file-path';

export async function uploadFile({ file, userId, folder }: { file: File; userId: string; folder: string }): Promise<string> {
	const s3Client = getS3Client();
	const bucketName = getBucketName();
	const filePath = generateFilePath({ userId, filename: file.name, folder });

	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	await s3Client.send(
		new PutObjectCommand({
			Bucket: bucketName,
			Key: filePath,
			Body: buffer,
			ContentType: file.type,
		})
	);

	return filePath;
}

export async function uploadJson({ key, data }: { key: string; data: unknown }): Promise<void> {
	const s3Client = getS3Client();
	const bucketName = getBucketName();

	await s3Client.send(
		new PutObjectCommand({
			Bucket: bucketName,
			Key: key,
			Body: JSON.stringify(data),
			ContentType: 'application/json',
		})
	);
}

export async function getObject({ key }: { key: string }): Promise<string | null> {
	const s3Client = getS3Client();
	const bucketName = getBucketName();

	try {
		const response = await s3Client.send(
			new GetObjectCommand({
				Bucket: bucketName,
				Key: key,
			})
		);

		if (!response.Body) {
			return null;
		}

		return await response.Body.transformToString();
	} catch (error) {
		if (error instanceof Error && 'name' in error && error.name === 'NoSuchKey') {
			return null;
		}
		throw error;
	}
}

export async function listObjects({ prefix }: { prefix: string }): Promise<string[]> {
	const s3Client = getS3Client();
	const bucketName = getBucketName();

	const response = await s3Client.send(
		new ListObjectsV2Command({
			Bucket: bucketName,
			Prefix: prefix,
		})
	);

	return response.Contents?.map((obj) => obj.Key).filter((key): key is string => key !== undefined) ?? [];
}

export async function deleteFile({ filePath }: { filePath: string }): Promise<void> {
	const s3Client = getS3Client();
	const bucketName = getBucketName();

	await s3Client.send(
		new DeleteObjectCommand({
			Bucket: bucketName,
			Key: filePath,
		})
	);
}

export async function deleteMultipleFiles({ keys }: { keys: string[] }): Promise<void> {
	const s3Client = getS3Client();
	const bucketName = getBucketName();

	for (const key of keys) {
		await s3Client.send(
			new DeleteObjectCommand({
				Bucket: bucketName,
				Key: key,
			})
		);
	}
}
