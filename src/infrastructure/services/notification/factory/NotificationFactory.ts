import { INotificationProvider } from "../interfaces/INotificationProvider";
import { LocalNotificationProvider } from "../local/LocalNotificationProvider";
import { AwsNotificationProvider } from "../aws/AwsNotificationProvider";
import { AzureNotificationProvider } from "../azure/AzureNotificationProvider";

export class NotificationFactory {
  /**
   * Instantiates the configured notification provider based on selection key.
   * @param providerType The type of provider: 'local', 'aws', 'azure'.
   */
  static create(providerType: string): INotificationProvider {
    const type = providerType.toLowerCase();
    switch (type) {
      case "local":
      case "mock":
        return new LocalNotificationProvider();
      case "aws":
      case "sns":
        return new AwsNotificationProvider();
      case "azure":
        return new AzureNotificationProvider();
      default:
        throw new Error(`Unsupported notification provider type: "${providerType}"`);
    }
  }
}
