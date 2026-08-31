import { Request, Response } from "express";
import { FeedbackRepository } from "../../../infrastructure/repositories/FeedbackRepository";
import { SubmitFeedbackUseCase } from "../../../application/feedback/SubmitFeedbackUseCase";
import { ListFeedbacksUseCase } from "../../../application/feedback/ListFeedbacksUseCase";
import { ReplyFeedbackUseCase } from "../../../application/feedback/ReplyFeedbackUseCase";

export class FeedbackController {
  private feedbackRepository = new FeedbackRepository();

  // Public: POST /api/v1/feedback
  submitFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, message } = req.body;
      const useCase = new SubmitFeedbackUseCase(this.feedbackRepository);
      const result = await useCase.execute({ email, message });

      res.status(201).json({
        success: true,
        message: "Thank you for your feedback! Our team has received your message.",
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to submit feedback",
      });
    }
  };

  // Admin: GET /api/v1/admin/feedbacks
  listFeedbacks = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const status = req.query.status as any;
      const search = req.query.search as string;

      const useCase = new ListFeedbacksUseCase(this.feedbackRepository);
      const result = await useCase.execute({ page, limit, status, search });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch feedbacks",
      });
    }
  };

  // Admin: POST /api/v1/admin/feedbacks/:id/reply
  replyFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
      const feedback_id = req.params.id;
      const { reply_message } = req.body;

      const useCase = new ReplyFeedbackUseCase(this.feedbackRepository);
      const result = await useCase.execute({ feedback_id, reply_message });

      res.status(200).json({
        success: true,
        message: `Reply email sent successfully to ${result.email}`,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to send email reply",
      });
    }
  };
}
