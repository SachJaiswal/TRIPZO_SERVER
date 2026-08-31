import { Collection } from "mongodb";
import { getClient } from "../config/database";
import { FeedbackEntity } from "../../domain/entities/Feedback.entity";
import {
  IFeedbackRepository,
  ListFeedbacksParams,
  ListFeedbacksResult,
} from "../../domain/repositories/IFeedbackRepository";
import { v4 as uuidv4 } from "uuid";

export class FeedbackRepository implements IFeedbackRepository {
  private static async collection(): Promise<Collection<FeedbackEntity>> {
    const client = await getClient();
    const dbName = process.env.DB_NAME || "tripzo";
    const col = client.db(dbName).collection<FeedbackEntity>("feedbacks");

    // Initialize indexes
    await col.createIndex({ feedback_id: 1 }, { unique: true });
    await col.createIndex({ email: 1 });
    await col.createIndex({ status: 1 });
    await col.createIndex({ created_at: -1 });

    return col;
  }

  async create(data: Partial<FeedbackEntity>): Promise<FeedbackEntity> {
    const col = await FeedbackRepository.collection();
    const now = new Date();
    const feedback: FeedbackEntity = {
      feedback_id: data.feedback_id || uuidv4(),
      email: (data.email || "").toLowerCase().trim(),
      message: (data.message || "").trim(),
      status: "PENDING",
      created_at: now,
      updated_at: now,
    };

    await col.insertOne(feedback as any);
    return feedback;
  }

  async findById(feedback_id: string): Promise<FeedbackEntity | null> {
    const col = await FeedbackRepository.collection();
    return col.findOne({ feedback_id });
  }

  async list(params: ListFeedbacksParams): Promise<ListFeedbacksResult> {
    const col = await FeedbackRepository.collection();
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 10));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (params.status) {
      query.status = params.status;
    }

    if (params.search) {
      const regex = new RegExp(params.search, "i");
      query.$or = [{ email: regex }, { message: regex }];
    }

    const total = await col.countDocuments(query);
    const feedbacks = await col
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return {
      feedbacks,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async updateReply(feedback_id: string, reply_message: string): Promise<FeedbackEntity | null> {
    const col = await FeedbackRepository.collection();
    const now = new Date();

    const result = await col.findOneAndUpdate(
      { feedback_id },
      {
        $set: {
          status: "REPLIED",
          reply_message: reply_message.trim(),
          replied_at: now,
          updated_at: now,
        },
      },
      { returnDocument: "after" }
    );

    return result ? (result as unknown as FeedbackEntity) : null;
  }
}
