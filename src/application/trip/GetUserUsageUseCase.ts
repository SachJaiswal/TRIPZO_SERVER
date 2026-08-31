import TripUsageModel from "../../domain/entities/TripUsage.entity";
import { ITripUsageRepository } from "../../domain/repositories/ITripUsageRepository";

export interface GetUserUsageDTO {
  user_generated_id: string;
}

export class GetUserUsageUseCase {
  constructor(private tripUsageRepository: ITripUsageRepository) {}

  async execute(dto: GetUserUsageDTO): Promise<TripUsageModel> {
    return this.tripUsageRepository.getUserUsage(dto.user_generated_id);
  }
}

export default GetUserUsageUseCase;
