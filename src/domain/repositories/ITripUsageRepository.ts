import TripUsageModel from "../entities/TripUsage.entity";

export interface ITripUsageRepository {
  getUserUsage(user_generated_id: string): Promise<TripUsageModel>;
  incrementUsage(user_generated_id: string): Promise<TripUsageModel>;
  checkCanGenerate(user_generated_id: string): Promise<{ canGenerate: boolean; usage: TripUsageModel }>;
}
