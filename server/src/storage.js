import { S3Client, HeadObjectCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand, GetBucketVersioningCommand } from '@aws-sdk/client-s3';
import { createHash } from 'node:crypto';
import { config } from './config.js';

export function minioOptions(env) {
  const url = new URL(env.MINIO_ENDPOINT);
  if (!['https:', 'http:'].includes(url.protocol) || url.pathname !== '/' || url.username || url.password || url.search || url.hash) throw new Error('MINIO_ENDPOINT must be an S3 origin without a path or credentials.');
  if (!env.MINIO_ACCESS_KEY || !env.MINIO_SECRET_KEY) throw new Error('Configure MINIO_ACCESS_KEY and MINIO_SECRET_KEY in the server environment.');
  return { endpoint: url.origin, forcePathStyle: true, region: env.MINIO_REGION, credentials: { accessKeyId: env.MINIO_ACCESS_KEY, secretAccessKey: env.MINIO_SECRET_KEY }, maxAttempts: 2, requestHandler: { connectionTimeout: 3000, requestTimeout: 10000 }, requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED' };
}
export const mediaKey = filename => {
  if (!/^[a-f0-9-]+\.(webp|pdf|mp4)$/.test(filename)) throw new Error('Invalid media filename.');
  return `media/${filename}`;
};
export const missingObject = error => ['NoSuchKey', 'NotFound', 'NoSuchObject'].includes(error?.name || error?.code);
export const checksum = buffer => createHash('sha256').update(buffer).digest('hex');

export function createStorage(env, injectedClient) {
  let client = injectedClient;
  const connection = () => client ||= new S3Client(minioOptions(env));
  const Bucket = env.MINIO_BUCKET;
  const streamObject = async Key => (await connection().send(new GetObjectCommand({ Bucket, Key }))).Body;
  return {
    async stat(Key) { try { const value = await connection().send(new HeadObjectCommand({ Bucket, Key })); return { size: value.ContentLength, sha256: value.Metadata?.sha256 }; } catch (error) { if (missingObject(error)) return null; throw error; } },
    async put(Key, buffer, mimeType) { await connection().send(new PutObjectCommand({ Bucket, Key, Body: buffer, ContentLength: buffer.length, ContentType: mimeType, Metadata: { sha256: checksum(buffer) }, IfNoneMatch: '*' })); },
    async replace(Key, buffer, mimeType) { await connection().send(new PutObjectCommand({ Bucket, Key, Body: buffer, ContentLength: buffer.length, ContentType: mimeType, Metadata: { sha256: checksum(buffer) } })); },
    stream: streamObject,
    async read(key, limit = 16 * 1024 * 1024) {
      const stream = await streamObject(key);
      const chunks = []; let length = 0;
      try { for await (const chunk of stream) { length += chunk.length; if (length > limit) throw new Error('Stored object exceeds size limit.'); chunks.push(chunk); } }
      finally { stream.destroy(); }
      return Buffer.concat(chunks);
    },
    async remove(Key) { await connection().send(new DeleteObjectCommand({ Bucket, Key })); },
    async check() {
      await connection().send(new HeadBucketCommand({ Bucket }));
      const versioning = await connection().send(new GetBucketVersioningCommand({ Bucket }));
      if (versioning.Status) throw new Error('Use a bucket that has never enabled versioning so replacing images removes the old bytes, not just a delete marker.');
    },
  };
}
export const storage = createStorage(config);
