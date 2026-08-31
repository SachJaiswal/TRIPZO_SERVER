import TripModel from "../../domain/entities/Trip.entity";
import { ITripRepository } from "../../domain/repositories/ITripRepository";
import { ITripUsageRepository } from "../../domain/repositories/ITripUsageRepository";
import { GoogleMapsService } from "../../infrastructure/services/GoogleMapsService";
import { WeatherService } from "../../infrastructure/services/WeatherService";
import { BudgetEngineService } from "../../infrastructure/services/BudgetEngineService";
import { OpenAiPlannerService } from "../../infrastructure/services/OpenAiPlannerService";

export interface RegenerateTripDTO {
  user_generated_id: string;
  trip_id: string;
}

export class RegenerateTripPlanUseCase {
  constructor(
    private tripRepository: ITripRepository,
    private tripUsageRepository: ITripUsageRepository,
    private googleMapsService: GoogleMapsService,
    private weatherService: WeatherService,
    private budgetEngineService: BudgetEngineService,
    private openAiPlannerService: OpenAiPlannerService
  ) {}

  async execute(dto: RegenerateTripDTO): Promise<{ trip: TripModel; generations_count: number; max_allowed: number }> {
    const { user_generated_id, trip_id } = dto;

    const trip = await this.tripRepository.getTripById(trip_id);

    if (!trip) {
      const error: any = new Error("Trip plan not found");
      error.statusCode = 404;
      error.code = "TRIP_NOT_FOUND";
      throw error;
    }

    if (trip.user_generated_id !== user_generated_id) {
      const error: any = new Error("You are not authorized to regenerate this trip");
      error.statusCode = 403;
      error.code = "UNAUTHORIZED_TRIP_ACCESS";
      throw error;
    }

    // Check user generation limit
    const quota = await this.tripUsageRepository.checkCanGenerate(user_generated_id);
    if (!quota.canGenerate) {
      const error: any = new Error(
        `Generation limit of ${quota.usage.max_allowed} trips exceeded for your account.`
      );
      error.statusCode = 429;
      error.code = "GENERATION_LIMIT_EXCEEDED";
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

    // Refresh candidate places and weather
    const [candidateHotels, candidateAttractions, candidateRestaurants, weatherForecast] =
      await Promise.all([
        this.googleMapsService.searchHotels(
          trip.destinationDetails.location,
          trip.preferences.minHotelRating,
          trip.preferences.accommodationPreference
        ),
        this.googleMapsService.searchAttractions(
          trip.destinationDetails.location,
          trip.preferences.interests
        ),
        this.googleMapsService.searchRestaurants(trip.destinationDetails.location),
        this.weatherService.getWeatherForecast(
          trip.destinationDetails.location,
          trip.preferences.startDate,
          trip.preferences.endDate
        ),
      ]);

    const plannerOutput = await this.openAiPlannerService.generateItinerary(
      trip.preferences,
      candidateHotels,
      candidateAttractions,
      candidateRestaurants,
      weatherForecast,
      budgetLimits
    );

    const updatedTrip = await this.tripRepository.updateTrip(trip_id, {
      candidateHotels,
      candidateAttractions,
      candidateRestaurants,
      weatherForecast,
      itinerary: plannerOutput.itinerary,
      budgetBreakdown: plannerOutput.budgetBreakdown,
      generationCount: (trip.generationCount || 1) + 1,
      updated_at: new Date(),
    });

    if (!updatedTrip) {
      const error: any = new Error("Failed to save regenerated trip");
      error.statusCode = 500;
      error.code = "REGENERATE_FAILED";
      throw error;
    }

    const updatedUsage = await this.tripUsageRepository.incrementUsage(user_generated_id);

    return {
      trip: updatedTrip,
      generations_count: updatedUsage.generations_count,
      max_allowed: updatedUsage.max_allowed,
    };
  }
}

export default RegenerateTripPlanUseCase;
