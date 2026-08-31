import { Router } from "express";
import { FeedbackController } from "../controllers/FeedbackController";

const feedbackRouter = Router();
const feedbackController = new FeedbackController();

// Public route to submit feedback from hero-website
feedbackRouter.post("/", feedbackController.submitFeedback);

export default feedbackRouter;
