import { FeedbackEntity } from "../../domain/entities/Feedback.entity";
import { IFeedbackRepository } from "../../domain/repositories/IFeedbackRepository";

export interface SubmitFeedbackDTO {
  email: string;
  message: string;
}

export class SubmitFeedbackUseCase {
  constructor(private feedbackRepository: IFeedbackRepository) {}

  async execute(dto: SubmitFeedbackDTO): Promise<FeedbackEntity> {
    if (!dto.email || !dto.email.includes("@")) {
      throw new Error("A valid email address is required.");
    }

    if (!dto.message || dto.message.trim().length < 3) {
      throw new Error("Message content must be at least 3 characters long.");
    }

    return this.feedbackRepository.create({
      email: dto.email,
      message: dto.message,
    });
  }
}
