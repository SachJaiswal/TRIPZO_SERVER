import TripModel from "../../domain/entities/Trip.entity";
import { ITripRepository } from "../../domain/repositories/ITripRepository";

export interface GetTripByIdDTO {
  user_generated_id: string;
  trip_id: string;
}

export class GetTripByIdUseCase {
  constructor(private tripRepository: ITripRepository) {}

  async execute(dto: GetTripByIdDTO): Promise<TripModel> {
    const trip = await this.tripRepository.getTripById(dto.trip_id);

    if (!trip) {
      const error: any = new Error("Trip plan not found");
      error.statusCode = 404;
      error.code = "TRIP_NOT_FOUND";
      throw error;
    }

    if (trip.user_generated_id !== dto.user_generated_id) {
      const error: any = new Error("You are not authorized to access this trip plan");
      error.statusCode = 403;
      error.code = "UNAUTHORIZED_TRIP_ACCESS";
      throw error;
    }

    return trip;
  }
}

export default GetTripByIdUseCase;
