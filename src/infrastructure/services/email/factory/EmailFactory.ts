import { IEmailProvider } from "../interfaces/IEmailProvider";
import { LocalEmailProvider } from "../local/LocalEmailProvider";
import { AwsEmailProvider } from "../aws/AwsEmailProvider";
import { AzureEmailProvider } from "../azure/AzureEmailProvider";

export class EmailFactory {
  /**
   * Instantiates the configured email provider based on selection key.
   * @param providerType The type of provider: 'local', 'aws', 'azure'.
   */
  static create(providerType: string): IEmailProvider {
    const type = providerType.toLowerCase();
    switch (type) {
      case "local":
      case "mock":
        return new LocalEmailProvider();
      case "aws":
      case "ses":
        return new AwsEmailProvider();
      case "azure":
        return new AzureEmailProvider();
      default:
        throw new Error(`Unsupported email provider type: "${providerType}"`);
    }
  }
}
