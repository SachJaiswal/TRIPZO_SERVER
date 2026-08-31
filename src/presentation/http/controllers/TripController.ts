import { Request, Response, NextFunction } from "express";
import TripRepository from "../../../infrastructure/repositories/TripRepository";
import TripUsageRepository from "../../../infrastructure/repositories/TripUsageRepository";
import GoogleMapsService from "../../../infrastructure/services/GoogleMapsService";
import WeatherService from "../../../infrastructure/services/WeatherService";
import BudgetEngineService from "../../../infrastructure/services/BudgetEngineService";
import OpenAiPlannerService from "../../../infrastructure/services/OpenAiPlannerService";

import GenerateTripPlanUseCase from "../../../application/trip/GenerateTripPlanUseCase";
import CustomizeTripItineraryUseCase from "../../../application/trip/CustomizeTripItineraryUseCase";
import RegenerateTripPlanUseCase from "../../../application/trip/RegenerateTripPlanUseCase";
import GetUserTripsUseCase from "../../../application/trip/GetUserTripsUseCase";
import GetTripByIdUseCase from "../../../application/trip/GetTripByIdUseCase";
import DeleteTripUseCase from "../../../application/trip/DeleteTripUseCase";
import GetUserUsageUseCase from "../../../application/trip/GetUserUsageUseCase";

// Singletons / Dependencies initialization
const tripRepository = new TripRepository();
const tripUsageRepository = new TripUsageRepository();
const googleMapsService = new GoogleMapsService();
const weatherService = new WeatherService();
const budgetEngineService = new BudgetEngineService();
const openAiPlannerService = new OpenAiPlannerService();

const generateTripPlanUseCase = new GenerateTripPlanUseCase(
  tripRepository,
  tripUsageRepository,
  googleMapsService,
  weatherService,
  budgetEngineService,
  openAiPlannerService
);

const customizeTripItineraryUseCase = new CustomizeTripItineraryUseCase(
  tripRepository,
  budgetEngineService,
  openAiPlannerService
);

const regenerateTripPlanUseCase = new RegenerateTripPlanUseCase(
  tripRepository,
  tripUsageRepository,
  googleMapsService,
  weatherService,
  budgetEngineService,
  openAiPlannerService
);

const getUserTripsUseCase = new GetUserTripsUseCase(tripRepository);
const getTripByIdUseCase = new GetTripByIdUseCase(tripRepository);
const deleteTripUseCase = new DeleteTripUseCase(tripRepository);
const getUserUsageUseCase = new GetUserUsageUseCase(tripUsageRepository);

export class TripController {
  /**
   * POST /api/v1/trips/generate
   */
  static async generateTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user_generated_id = req.user!.user_generated_id;
      const preferences = req.body;

      const result = await generateTripPlanUseCase.execute({
        user_generated_id,
        preferences,
      });

      res.status(201).json({
        success: true,
        message: "Travel plan generated successfully",
        data: result.trip,
        usage: {
          generationsCount: result.generations_count,
          maxAllowed: result.max_allowed,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/trips/:tripId/customize
   */
  static async customizeItinerary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user_generated_id = req.user!.user_generated_id;
      const { tripId } = req.params;
      const { instruction } = req.body;

      const updatedTrip = await customizeTripItineraryUseCase.execute({
        user_generated_id,
        trip_id: tripId,
        instruction,
      });

      res.status(200).json({
        success: true,
        message: "Itinerary customized successfully",
        data: updatedTrip,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/trips/:tripId/regenerate
   */
  static async regenerateTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user_generated_id = req.user!.user_generated_id;
      const { tripId } = req.params;

      const result = await regenerateTripPlanUseCase.execute({
        user_generated_id,
        trip_id: tripId,
      });

      res.status(200).json({
        success: true,
        message: "Itinerary regenerated successfully",
        data: result.trip,
        usage: {
          generationsCount: result.generations_count,
          maxAllowed: result.max_allowed,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/trips
   */
  static async getUserTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user_generated_id = req.user!.user_generated_id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = (req.query.search as string) || undefined;

      const result = await getUserTripsUseCase.execute({
        user_generated_id,
        page,
        limit,
        search,
      });

      res.status(200).json({
        success: true,
        message: "User trip plans retrieved successfully",
        data: result.trips,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/trips/usage
   */
  static async getUserUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user_generated_id = req.user!.user_generated_id;

      const usage = await getUserUsageUseCase.execute({
        user_generated_id,
      });

      res.status(200).json({
        success: true,
        message: "User generation usage retrieved successfully",
        data: usage,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/trips/:tripId
   */
  static async getTripById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user_generated_id = req.user!.user_generated_id;
      const { tripId } = req.params;

      const trip = await getTripByIdUseCase.execute({
        user_generated_id,
        trip_id: tripId,
      });

      res.status(200).json({
        success: true,
        message: "Trip plan details retrieved successfully",
        data: trip,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/trips/:tripId
   */
  static async deleteTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user_generated_id = req.user!.user_generated_id;
      const { tripId } = req.params;

      const result = await deleteTripUseCase.execute({
        user_generated_id,
        trip_id: tripId,
      });

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default TripController;
