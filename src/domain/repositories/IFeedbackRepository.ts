import { FeedbackEntity, FeedbackStatus } from "../entities/Feedback.entity";

export interface ListFeedbacksParams {
  page: number;
  limit: number;
  status?: FeedbackStatus;
  search?: string;
}

export interface ListFeedbacksResult {
  feedbacks: FeedbackEntity[];
  total: number;
  page: number;
  totalPages: number;
}

export interface IFeedbackRepository {
  create(feedback: Partial<FeedbackEntity>): Promise<FeedbackEntity>;
  findById(feedback_id: string): Promise<FeedbackEntity | null>;
  list(params: ListFeedbacksParams): Promise<ListFeedbacksResult>;
  updateReply(feedback_id: string, reply_message: string): Promise<FeedbackEntity | null>;
}
