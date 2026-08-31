export interface INotificationProvider {
  /**
   * Sends a message payload (like SMS or push notify) to the target recipient.
   * @param recipient Identifier key (email, device token, or phone number).
   * @param message Text payload details.
   * @returns Success boolean indicating dispatch status.
   */
  sendNotification(recipient: string, message: string): Promise<boolean>;
}
