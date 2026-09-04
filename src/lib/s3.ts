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
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT || undefined,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return _s3Client;
}

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

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
