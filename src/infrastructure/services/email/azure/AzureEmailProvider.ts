import { IEmailProvider } from "../interfaces/IEmailProvider";
import { EmailClient } from "@azure/communication-email";
import { env } from "../../../config/env";

export class AzureEmailProvider implements IEmailProvider {
  async sendEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
    console.log(`[AzureEmailProvider]: Sending email to ${to}...`);
    try {
      const connectionString = env.azureCommunicationConnectionString;
      if (!connectionString) {
        throw new Error("Azure Communication Connection String is missing");
      }
      const client = new EmailClient(connectionString);
      const emailMessage = {
        senderAddress: env.azureCommunicationSenderAddress,
        content: {
          subject: subject,
          html: htmlBody,
        },
        recipients: {
          to: [{ address: to }],
        },
      };
      
      const poller = await client.beginSend(emailMessage);
      await poller.pollUntilDone();
      return true;
    } catch (error) {
      console.error("[AzureEmailProvider] Error sending email:", error);
      return false;
    }
  }
}
