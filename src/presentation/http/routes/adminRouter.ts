import { Router } from "express";
import { AdminController } from "../controllers/AdminController";
import { FeedbackController } from "../controllers/FeedbackController";
import { requireAuth } from "../middlewares/authMiddleware";
import { requireRole } from "../middlewares/roleMiddleware";

const adminRouter = Router();
const feedbackController = new FeedbackController();

// Apply authentication and ADMIN role requirement across all admin endpoints
adminRouter.use(requireAuth, requireRole("ADMIN"));

// Admin User Management Routes
adminRouter.get("/users", AdminController.listUsers);
adminRouter.get("/users/:user_generated_id", AdminController.getUserDetail);
adminRouter.patch("/users/:user_generated_id/status", AdminController.updateStatus);
adminRouter.delete("/users/:user_generated_id", AdminController.deleteUser);

// Admin Analytics & Trips Tracking Routes
adminRouter.get("/analytics/overview", AdminController.getAnalyticsOverview);
adminRouter.get("/trips", AdminController.listAllTrips);
adminRouter.get("/trips/:tripId", AdminController.getTripDetail);

// Admin Feedback & Email Reply Routes
adminRouter.get("/feedbacks", feedbackController.listFeedbacks);
adminRouter.post("/feedbacks/:id/reply", feedbackController.replyFeedback);

export default adminRouter;
