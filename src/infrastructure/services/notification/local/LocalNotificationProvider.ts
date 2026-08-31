import { INotificationProvider } from "../interfaces/INotificationProvider";

export class LocalNotificationProvider implements INotificationProvider {
  async sendNotification(recipient: string, message: string): Promise<boolean> {
    console.log(`[LocalNotificationProvider]: Simulated Notification dispatch...`);
    console.log(`[LocalNotificationProvider]: Target: ${recipient}`);
    console.log(`[LocalNotificationProvider]: Message: "${message}"`);
    return true;
  }
}
