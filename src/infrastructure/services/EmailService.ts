import nodemailer from "nodemailer";

export interface SendFeedbackReplyOptions {
  toEmail: string;
  userMessage: string;
  replyMessage: string;
}

export class EmailService {
  private static getTransporter() {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === "true";
    const user = process.env.SMTP_USER || "corbintechsachin@gmail.com";
    const pass = process.env.SMTP_PASS || "szsdxwxceeouwrjk";

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  static async sendFeedbackReply({
    toEmail,
    userMessage,
    replyMessage,
  }: SendFeedbackReplyOptions): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      const fromEmail = process.env.ADMIN_REPLY_EMAIL || process.env.SMTP_USER || "corbintechsachin@gmail.com";

      const htmlContent = `
        <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; background-color: #fffdf5; padding: 2rem; color: #1e293b; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 2px solid #1e293b; border-radius: 16px; box-shadow: 4px 4px 0 #1e293b; padding: 2rem;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 1.5rem;">
              <span style="font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 800; color: #8b5cf6; text-transform: uppercase;">TRIPZO</span>
              <span style="font-size: 0.75rem; font-weight: 700; color: #64748b; background-color: #f1f5f9; padding: 4px 8px; border-radius: 9999px;">SUPPORT</span>
            </div>

            <h2 style="font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-top: 0;">Response to Your Feedback</h2>
            
            <p style="color: #475569; font-size: 0.9375rem;">Hello,</p>
            <p style="color: #475569; font-size: 0.9375rem;">Thank you for sharing your feedback with <strong>Tripzo AI Travel</strong>. Here is our response:</p>

            <div style="background-color: #f8fafc; border-left: 4px solid #8b5cf6; padding: 1rem; border-radius: 8px; margin: 1.25rem 0;">
              <p style="margin: 0; font-size: 0.9375rem; color: #1e293b; white-space: pre-wrap;">${replyMessage}</p>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 1.5rem 0;" />

            <p style="font-size: 0.8125rem; color: #94a3b8; margin: 0;"><strong>Your Original Feedback:</strong></p>
            <p style="font-size: 0.8125rem; color: #64748b; font-style: italic; margin-top: 4px; white-space: pre-wrap;">"${userMessage}"</p>

            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; font-size: 0.75rem; color: #94a3b8; text-align: center;">
              © 2026 Tripzo AI Travel Companion. All rights reserved.
            </div>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"Tripzo Support" <${fromEmail}>`,
        to: toEmail,
        subject: "Response from Tripzo Support Team",
        html: htmlContent,
      });

      return true;
    } catch (error: any) {
      console.error("Failed to send feedback reply email via Nodemailer:", error);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
}
