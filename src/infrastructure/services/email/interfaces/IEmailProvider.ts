export interface IEmailProvider {
  /**
   * Sends an email to the recipient.
   * @param to Target email address.
   * @param subject Email subject line.
   * @param htmlBody HTML content body.
   * @returns Success boolean indicating status.
   */
  sendEmail(to: string, subject: string, htmlBody: string): Promise<boolean>;
}
