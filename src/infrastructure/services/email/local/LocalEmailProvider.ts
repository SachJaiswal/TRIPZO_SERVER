import { IEmailProvider } from "../interfaces/IEmailProvider";

export class LocalEmailProvider implements IEmailProvider {
  async sendEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
    console.log(`[LocalEmailProvider]: Sending email to ${to}...`);
    console.log(`[LocalEmailProvider]: Subject: "${subject}"`);
    console.log(`[LocalEmailProvider]: Body: "${htmlBody}"`);
    return true;
  }
}
