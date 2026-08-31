import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { INotificationProvider } from "../interfaces/INotificationProvider";
import { env } from "../../../config/env";

export class AwsNotificationProvider implements INotificationProvider {
  private snsClient: SNSClient;

  constructor() {
    this.snsClient = new SNSClient({
      region: env.awsRegion,
      credentials: {
        accessKeyId: env.awsAccessKeyId,
        secretAccessKey: env.awsSecretAccessKey,
      },
    });
  }

  async sendNotification(recipient: string, message: string): Promise<boolean> {
    const command = new PublishCommand({
      Message: message,
      PhoneNumber: recipient, // Assumes recipient is a phone number format for SMS
    });

    await this.snsClient.send(command);
    return true;
  }
}
