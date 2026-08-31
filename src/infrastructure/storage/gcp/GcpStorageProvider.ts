import { Storage } from '@google-cloud/storage';
import { IStorageProvider } from '../interfaces/IStorageProvider';
import { env } from '../../config/env';

export class GcpStorageProvider implements IStorageProvider {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    this.bucketName = env.gcpBucketName;
    const projectId = env.gcpProjectId;
    const keyFilename = env.gcpKeyFilePath;

    if (projectId && keyFilename) {
      this.storage = new Storage({ projectId, keyFilename });
    } else {
      this.storage = new Storage();
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string = ''): Promise<string> {
    if (!this.bucketName) {
      throw new Error('GCP_BUCKET_NAME environment variable is not set');
    }

    const safeFilename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    const destination = folder ? `${folder}/${safeFilename}` : safeFilename;

    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(destination);

    await blob.save(file.buffer, {
      contentType: file.mimetype,
      resumable: false,
    });

    return `https://storage.googleapis.com/${this.bucketName}/${destination}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!this.bucketName) {
      throw new Error('GCP_BUCKET_NAME environment variable is not set');
    }

    const urlPattern = new RegExp(`https://storage\\.googleapis\\.com/${this.bucketName}/(.+)`);
    const match = fileUrl.match(urlPattern);

    if (match && match[1]) {
      const destination = decodeURIComponent(match[1]);
      const bucket = this.storage.bucket(this.bucketName);
      await bucket.file(destination).delete({ ignoreNotFound: true });
    }
  }
}
