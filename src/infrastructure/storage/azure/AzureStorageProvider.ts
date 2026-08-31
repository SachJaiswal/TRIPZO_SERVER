import { BlobServiceClient } from '@azure/storage-blob';
import { IStorageProvider } from '../interfaces/IStorageProvider';
import { env } from '../../config/env';

export class AzureStorageProvider implements IStorageProvider {
  private blobServiceClient: BlobServiceClient | null = null;
  private containerName: string;

  constructor() {
    const connectionString = env.azureStorageConnectionString;
    this.containerName = env.azureStorageContainerName;

    if (connectionString) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    }
  }

  private getClient(): BlobServiceClient {
    if (!this.blobServiceClient) {
      throw new Error(
        'Azure Storage BlobServiceClient is not initialized. Please set AZURE_STORAGE_CONNECTION_STRING.'
      );
    }
    return this.blobServiceClient;
  }

  async uploadFile(file: Express.Multer.File, folder: string = ''): Promise<string> {
    const client = this.getClient();
    if (!this.containerName) {
      throw new Error('AZURE_STORAGE_CONTAINER_NAME environment variable is not set');
    }

    const containerClient = client.getContainerClient(this.containerName);
    const safeFilename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    const blobName = folder ? `${folder}/${safeFilename}` : safeFilename;

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    return blockBlobClient.url;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const client = this.getClient();
    if (!this.containerName) {
      throw new Error('AZURE_STORAGE_CONTAINER_NAME environment variable is not set');
    }

    const containerClient = client.getContainerClient(this.containerName);

    const urlPattern = new RegExp(`https://[^/]+\\.blob\\.core\\.windows\\.net/${this.containerName}/(.+)`);
    const match = fileUrl.match(urlPattern);

    if (match && match[1]) {
      const blobName = decodeURIComponent(match[1]);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.deleteIfExists();
    }
  }
}
