import { IStorageProvider } from '../interfaces/IStorageProvider';
import { LocalStorageProvider } from '../local/LocalStorageProvider';
import { AwsStorageProvider } from '../aws/AwsStorageProvider';
import { AzureStorageProvider } from '../azure/AzureStorageProvider';
import { GcpStorageProvider } from '../gcp/GcpStorageProvider';

export class StorageFactory {
  /**
   * Instantiates the requested storage provider based on the type specified.
   * @param providerType The type of storage provider: 'local', 'aws', 'azure', or 'gcp'.
   */
  static create(providerType: string): IStorageProvider {
    const type = providerType.toLowerCase();
    switch (type) {
      case 'local':
        return new LocalStorageProvider();
      case 'aws':
        return new AwsStorageProvider();
      case 'azure':
        return new AzureStorageProvider();
      case 'gcp':
        return new GcpStorageProvider();
      default:
        throw new Error(`Unsupported storage provider type: "${providerType}"`);
    }
  }
}
