export type FeedbackStatus = "PENDING" | "REPLIED";

export interface FeedbackEntity {
  _id?: string;
  feedback_id: string;
  email: string;
  message: string;
  status: FeedbackStatus;
  reply_message?: string;
  replied_at?: Date;
  created_at: Date;
  updated_at: Date;
}
