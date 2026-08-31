import { INotificationProvider } from "../interfaces/INotificationProvider";

export class AzureNotificationProvider implements INotificationProvider {
  async sendNotification(recipient: string, message: string): Promise<boolean> {
    console.log(`[AzureNotificationProvider]: Dispatching notification to ${recipient}...`);
    console.log(`[AzureNotificationProvider]: Message payload: "${message}"`);
    return true;
  }
}
