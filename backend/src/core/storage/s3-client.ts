import { S3Client } from '@aws-sdk/client-s3';

let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
	if (s3Client) return s3Client;

	// const accountId = process.env.R2_ACCOUNT_ID;
	const accessKeyId = process.env.R2_ACCESS_KEY_ID;
	const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

	s3Client = new S3Client({
		region: 'auto',
		endpoint: process.env.S3_URL,
		credentials: {
			accessKeyId,
			secretAccessKey,
		},
	});

	return s3Client;
}

export function getBucketName(): string {
	return process.env.R2_BUCKET_NAME;
}
