import { FeedbackEntity } from "../../domain/entities/Feedback.entity";
import { IFeedbackRepository } from "../../domain/repositories/IFeedbackRepository";
import { EmailService } from "../../infrastructure/services/EmailService";

export interface ReplyFeedbackDTO {
  feedback_id: string;
  reply_message: string;
}

export class ReplyFeedbackUseCase {
  constructor(private feedbackRepository: IFeedbackRepository) {}

  async execute(dto: ReplyFeedbackDTO): Promise<FeedbackEntity> {
    if (!dto.feedback_id) {
      throw new Error("Feedback ID is required.");
    }

    if (!dto.reply_message || dto.reply_message.trim().length === 0) {
      throw new Error("Reply message cannot be empty.");
    }

    const feedback = await this.feedbackRepository.findById(dto.feedback_id);
    if (!feedback) {
      throw new Error("Feedback record not found.");
    }

    // 1. Send Nodemailer Email to User
    await EmailService.sendFeedbackReply({
      toEmail: feedback.email,
      userMessage: feedback.message,
      replyMessage: dto.reply_message,
    });

    // 2. Update Status to REPLIED in MongoDB
    const updated = await this.feedbackRepository.updateReply(dto.feedback_id, dto.reply_message);
    if (!updated) {
      throw new Error("Failed to update feedback status.");
    }

    return updated;
  }
}
