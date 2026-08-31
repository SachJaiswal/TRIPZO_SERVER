import { IEmailProvider } from "../interfaces/IEmailProvider";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { env } from "../../../config/env";

export class AwsEmailProvider implements IEmailProvider {
  private client: SESClient;

  constructor() {
    this.client = new SESClient({
      region: env.awsRegion,
      credentials: {
        accessKeyId: env.awsAccessKeyId,
        secretAccessKey: env.awsSecretAccessKey,
      },
    });
  }

  async sendEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
    console.log(`[AwsEmailProvider]: Sending email to ${to}...`);
    try {
      const command = new SendEmailCommand({
        Destination: { ToAddresses: [to] },
        Message: {
          Body: { Html: { Data: htmlBody } },
          Subject: { Data: subject },
        },
        Source: env.azureCommunicationSenderAddress || "no-reply@example.com",
      });
      await this.client.send(command);
      return true;
    } catch (error) {
      console.error("[AwsEmailProvider] Error sending email:", error);
      return false;
    }
  }
}
