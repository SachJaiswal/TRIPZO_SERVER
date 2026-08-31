import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { IStorageProvider } from '../interfaces/IStorageProvider';
import { env } from '../../config/env';

export class AwsStorageProvider implements IStorageProvider {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.bucketName = env.awsBucketName;
    this.region = env.awsRegion;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: env.awsAccessKeyId,
        secretAccessKey: env.awsSecretAccessKey,
      },
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string = ''): Promise<string> {
    if (!this.bucketName) {
      throw new Error('AWS_BUCKET_NAME environment variable is not set');
    }

    const safeFilename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    const key = folder ? `${folder}/${safeFilename}` : safeFilename;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!this.bucketName) {
      throw new Error('AWS_BUCKET_NAME environment variable is not set');
    }

    const urlPattern = new RegExp(`https://${this.bucketName}\\.s3\\.${this.region}\\.amazonaws\\.com/(.+)`);
    const match = fileUrl.match(urlPattern);

    if (match && match[1]) {
      const key = decodeURIComponent(match[1]);
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
    }
  }
}
