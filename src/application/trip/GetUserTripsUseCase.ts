import { ITripRepository, PaginatedTripResult } from "../../domain/repositories/ITripRepository";

export interface GetUserTripsDTO {
  user_generated_id: string;
  page?: number;
  limit?: number;
  search?: string;
}

export class GetUserTripsUseCase {
  constructor(private tripRepository: ITripRepository) {}

  async execute(dto: GetUserTripsDTO): Promise<PaginatedTripResult> {
    const page = Math.max(1, dto.page || 1);
    const limit = Math.max(1, Math.min(100, dto.limit || 20));

    return this.tripRepository.getTripsByUserId(dto.user_generated_id, {
      page,
      limit,
      search: dto.search,
    });
  }
}

export default GetUserTripsUseCase;
