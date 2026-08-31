import { ITripRepository } from "../../domain/repositories/ITripRepository";

export interface DeleteTripDTO {
  user_generated_id: string;
  trip_id: string;
}

export class DeleteTripUseCase {
  constructor(private tripRepository: ITripRepository) {}

  async execute(dto: DeleteTripDTO): Promise<{ success: boolean; message: string }> {
    const trip = await this.tripRepository.getTripById(dto.trip_id);

    if (!trip) {
      const error: any = new Error("Trip plan not found");
      error.statusCode = 404;
      error.code = "TRIP_NOT_FOUND";
      throw error;
    }

    if (trip.user_generated_id !== dto.user_generated_id) {
      const error: any = new Error("You are not authorized to delete this trip plan");
      error.statusCode = 403;
      error.code = "UNAUTHORIZED_TRIP_ACCESS";
      throw error;
    }

    const deleted = await this.tripRepository.deleteTrip(dto.trip_id, dto.user_generated_id);

    if (!deleted) {
      const error: any = new Error("Failed to delete trip plan");
      error.statusCode = 500;
      error.code = "DELETE_TRIP_FAILED";
      throw error;
    }

    return {
      success: true,
      message: "Trip plan deleted successfully",
    };
  }
}

export default DeleteTripUseCase;
