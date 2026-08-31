import crypto from "crypto";
import TripModel, { TripPreferences } from "../../domain/entities/Trip.entity";
import { ITripRepository } from "../../domain/repositories/ITripRepository";
import { ITripUsageRepository } from "../../domain/repositories/ITripUsageRepository";
import { GoogleMapsService } from "../../infrastructure/services/GoogleMapsService";
import { WeatherService } from "../../infrastructure/services/WeatherService";
import { BudgetEngineService } from "../../infrastructure/services/BudgetEngineService";
import { OpenAiPlannerService } from "../../infrastructure/services/OpenAiPlannerService";

export interface GenerateTripDTO {
  user_generated_id: string;
  preferences: TripPreferences;
}

export class GenerateTripPlanUseCase {
  constructor(
    private tripRepository: ITripRepository,
    private tripUsageRepository: ITripUsageRepository,
    private googleMapsService: GoogleMapsService,
    private weatherService: WeatherService,
    private budgetEngineService: BudgetEngineService,
    private openAiPlannerService: OpenAiPlannerService
  ) {}

  async execute(dto: GenerateTripDTO): Promise<{ trip: TripModel; generations_count: number; max_allowed: number }> {
    const { user_generated_id, preferences } = dto;

    this.validatePreferences(preferences);

    // Check generation limit
    const quota = await this.tripUsageRepository.checkCanGenerate(user_generated_id);
    if (!quota.canGenerate) {
      const error: any = new Error(
        `Generation limit of ${quota.usage.max_allowed} trips exceeded for your account.`
      );
      error.statusCode = 429;
      error.code = "GENERATION_LIMIT_EXCEEDED";
      throw error;
    }

    // Days calculation
    const start = new Date(preferences.startDate);
    const end = new Date(preferences.endDate);
    const daysCount = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    // 1. Geocode destination via Google Maps API
    const destDetails = await this.googleMapsService.geocodeDestination(preferences.destination);

    // 2. Compute Budget Allocations & Price Caps
    const budgetLimits = this.budgetEngineService.calculateBudgetBreakdown(preferences, daysCount);

    // 3. Parallel fetch of Real-world Places (Hotels, Attractions, Restaurants) & Weather
    const [candidateHotels, candidateAttractions, candidateRestaurants, weatherForecast] =
      await Promise.all([
        this.googleMapsService.searchHotels(
          destDetails.location,
          preferences.minHotelRating,
          preferences.accommodationPreference
        ),
        this.googleMapsService.searchAttractions(destDetails.location, preferences.interests),
        this.googleMapsService.searchRestaurants(destDetails.location),
        this.weatherService.getWeatherForecast(
          destDetails.location,
          preferences.startDate,
          preferences.endDate
        ),
      ]);

    // 4. OpenAI Reasoning & Itinerary Generation (Strict JSON mode)
    const plannerOutput = await this.openAiPlannerService.generateItinerary(
      preferences,
      candidateHotels,
      candidateAttractions,
      candidateRestaurants,
      weatherForecast,
      budgetLimits
    );

    // 5. Build domain entity
    const trip_id = crypto.randomUUID();
    const trip = new TripModel({
      trip_id,
      user_generated_id,
      destinationDetails: destDetails,
      preferences,
      candidateHotels,
      candidateAttractions,
      candidateRestaurants,
      weatherForecast,
      itinerary: plannerOutput.itinerary,
      budgetBreakdown: plannerOutput.budgetBreakdown,
      customizationHistory: [],
      generationCount: 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 6. Save in DB
    const savedTrip = await this.tripRepository.createTrip(trip);

    // 7. Increment user generation usage
    const updatedUsage = await this.tripUsageRepository.incrementUsage(user_generated_id);

    return {
      trip: savedTrip,
      generations_count: updatedUsage.generations_count,
      max_allowed: updatedUsage.max_allowed,
    };
  }

  private validatePreferences(prefs: TripPreferences): void {
    if (!prefs.destination || typeof prefs.destination !== "string" || !prefs.destination.trim()) {
      const error: any = new Error("Destination is required");
      error.statusCode = 400;
      error.code = "INVALID_DESTINATION";
      throw error;
    }

    if (!prefs.startDate || !prefs.endDate) {
      const error: any = new Error("Start date and end date are required");
      error.statusCode = 400;
      error.code = "INVALID_DATES";
      throw error;
    }

    const start = new Date(prefs.startDate);
    const end = new Date(prefs.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      const error: any = new Error("End date must be on or after start date");
      error.statusCode = 400;
      error.code = "INVALID_DATE_RANGE";
      throw error;
    }

    if (!prefs.totalBudget || prefs.totalBudget <= 0) {
      const error: any = new Error("Total budget must be greater than zero");
      error.statusCode = 400;
      error.code = "INVALID_BUDGET";
      throw error;
    }

    if (!prefs.adults || prefs.adults < 1) {
      prefs.adults = 1;
    }

    if (prefs.children === undefined || prefs.children < 0) {
      prefs.children = 0;
    }

    if (!prefs.rooms || prefs.rooms < 1) {
      prefs.rooms = 1;
    }

    if (!prefs.minHotelRating || prefs.minHotelRating < 1 || prefs.minHotelRating > 5) {
      prefs.minHotelRating = 3.5;
    }

    if (!Array.isArray(prefs.interests)) {
      prefs.interests = ["sightseeing", "food"];
    }
  }
}

export default GenerateTripPlanUseCase;
