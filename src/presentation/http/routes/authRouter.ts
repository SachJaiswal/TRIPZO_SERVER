import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { requireAuth } from "../middlewares/authMiddleware";

const authRouter = Router();

authRouter.post("/register", AuthController.register);
authRouter.post("/login", AuthController.login);
authRouter.post("/google", AuthController.googleAuth);
authRouter.get("/me", requireAuth, AuthController.me);
authRouter.post("/logout", AuthController.logout);

export default authRouter;
