import TripModel from "../../domain/entities/Trip.entity";
import { ITripRepository } from "../../domain/repositories/ITripRepository";
import { BudgetEngineService } from "../../infrastructure/services/BudgetEngineService";
import { OpenAiPlannerService } from "../../infrastructure/services/OpenAiPlannerService";

export interface CustomizeTripDTO {
  user_generated_id: string;
  trip_id: string;
  instruction: string;
}

export class CustomizeTripItineraryUseCase {
  constructor(
    private tripRepository: ITripRepository,
    private budgetEngineService: BudgetEngineService,
    private openAiPlannerService: OpenAiPlannerService
  ) {}

  async execute(dto: CustomizeTripDTO): Promise<TripModel> {
    const { user_generated_id, trip_id, instruction } = dto;

    if (!instruction || !instruction.trim()) {
      const error: any = new Error("Customization instruction cannot be empty");
      error.statusCode = 400;
      error.code = "INVALID_INSTRUCTION";
      throw error;
    }

    const trip = await this.tripRepository.getTripById(trip_id);

    if (!trip) {
      const error: any = new Error("Trip plan not found");
      error.statusCode = 404;
      error.code = "TRIP_NOT_FOUND";
      throw error;
    }

    if (trip.user_generated_id !== user_generated_id) {
      const error: any = new Error("You are not authorized to modify this trip plan");
      error.statusCode = 403;
      error.code = "UNAUTHORIZED_TRIP_ACCESS";
      throw error;
    }

    const start = new Date(trip.preferences.startDate);
    const end = new Date(trip.preferences.endDate);
    const daysCount = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    const budgetLimits = this.budgetEngineService.calculateBudgetBreakdown(
      trip.preferences,
      daysCount
    );

    const customized = await this.openAiPlannerService.customizeItinerary(
      trip.itinerary,
      instruction,
      trip.candidateHotels,
      trip.candidateAttractions,
      trip.candidateRestaurants,
      trip.weatherForecast,
      budgetLimits
    );

    const updatedHistory = [
      ...(trip.customizationHistory || []),
      { instruction, appliedAt: new Date() },
    ];

    const updatedTrip = await this.tripRepository.updateTrip(trip_id, {
      itinerary: customized.itinerary,
      budgetBreakdown: customized.budgetBreakdown,
      customizationHistory: updatedHistory,
      updated_at: new Date(),
    });

    if (!updatedTrip) {
      const error: any = new Error("Failed to save customized trip");
      error.statusCode = 500;
      error.code = "CUSTOMIZE_FAILED";
      throw error;
    }

    return updatedTrip;
  }
}

export default CustomizeTripItineraryUseCase;
