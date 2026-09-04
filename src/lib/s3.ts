import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let _s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_s3Client) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        'S3 storage is not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.'
      );
    }

    _s3Client = new S3Client({
      region: process.env.AWS_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT || undefined,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }
  return _s3Client;
}

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

export function getPublicUrl(key: string): string {
  const publicDomain = process.env.S3_PUBLIC_DOMAIN;
  if (publicDomain) {
    return `${publicDomain}/${key}`;
  }
  return `https://${BUCKET_NAME}.r2.cloudflarestorage.com/${key}`;
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  if (!BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME environment variable is not set.');
  }
  const client = getS3Client();
  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn }
  );
}

export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  if (!BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME environment variable is not set.');
  }
  const client = getS3Client();
  await client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
}

export async function getPresignedDownloadUrl(key: string): Promise<string> {
  if (!BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME environment variable is not set.');
  }
  const client = getS3Client();
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
    { expiresIn: 3600 }
  );
}

export async function deleteFromS3(key: string): Promise<void> {
  if (!BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME environment variable is not set.');
  }
  const client = getS3Client();
  await client.send(new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  }));
}
