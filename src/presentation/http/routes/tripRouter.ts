import { Router } from "express";
import { TripController } from "../controllers/TripController";
import { requireAuth } from "../middlewares/authMiddleware";

const tripRouter = Router();

// Protect all trip endpoints with authentication middleware
tripRouter.use(requireAuth);

// Trip Plan Generation & Management Routes
tripRouter.post("/generate", TripController.generateTrip);
tripRouter.get("/", TripController.getUserTrips);
tripRouter.get("/usage", TripController.getUserUsage);
tripRouter.get("/:tripId", TripController.getTripById);
tripRouter.post("/:tripId/customize", TripController.customizeItinerary);
tripRouter.post("/:tripId/regenerate", TripController.regenerateTrip);
tripRouter.delete("/:tripId", TripController.deleteTrip);

export default tripRouter;
