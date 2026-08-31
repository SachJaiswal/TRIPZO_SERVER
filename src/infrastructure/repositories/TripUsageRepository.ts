import { Collection } from "mongodb";
import { getClient } from "../config/database";
import TripUsageModel from "../../domain/entities/TripUsage.entity";
import { ITripUsageRepository } from "../../domain/repositories/ITripUsageRepository";

export class TripUsageRepository implements ITripUsageRepository {
  private static async collection(): Promise<Collection<TripUsageModel>> {
    const client = await getClient();
    const dbName = process.env.DB_NAME || "tripzo";
    const col = client.db(dbName).collection<TripUsageModel>("trip_usage");

    await col.createIndex({ user_generated_id: 1 }, { unique: true });
    return col;
  }

  private get maxAllowedPerUser(): number {
    const envVal = parseInt(process.env.MAX_GENERATIONS_PER_USER || "10", 10);
    return isNaN(envVal) ? 10 : envVal;
  }

  async getUserUsage(user_generated_id: string): Promise<TripUsageModel> {
    const col = await TripUsageRepository.collection();
    let usage = await col.findOne({ user_generated_id });

    if (!usage) {
      const newUsage = new TripUsageModel({
        user_generated_id,
        generations_count: 0,
        max_allowed: this.maxAllowedPerUser,
        last_generated_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });
      await col.insertOne(newUsage);
      return newUsage;
    }

    return usage;
  }

  async incrementUsage(user_generated_id: string): Promise<TripUsageModel> {
    const col = await TripUsageRepository.collection();
    const max = this.maxAllowedPerUser;

    const result = await col.findOneAndUpdate(
      { user_generated_id },
      {
        $inc: { generations_count: 1 },
        $set: {
          max_allowed: max,
          last_generated_at: new Date(),
          updated_at: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    return (
      (result as unknown as TripUsageModel) ||
      new TripUsageModel({
        user_generated_id,
        generations_count: 1,
        max_allowed: max,
        last_generated_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
    );
  }

  async checkCanGenerate(
    user_generated_id: string
  ): Promise<{ canGenerate: boolean; usage: TripUsageModel }> {
    const usage = await this.getUserUsage(user_generated_id);
    const canGenerate = usage.generations_count < usage.max_allowed;
    return { canGenerate, usage };
  }
}

export default TripUsageRepository;
