import { Request, Response, NextFunction } from "express";
import UserRepository from "../../../infrastructure/repositories/UserRepository";
import { RegisterUserUseCase } from "../../../application/auth/RegisterUserUseCase";
import { LoginUserUseCase } from "../../../application/auth/LoginUserUseCase";
import { GoogleAuthUseCase } from "../../../application/auth/GoogleAuthUseCase";
import { GetCurrentUserUseCase } from "../../../application/auth/GetCurrentUserUseCase";

const userRepository = new UserRepository();
const registerUserUseCase = new RegisterUserUseCase(userRepository);
const loginUserUseCase = new LoginUserUseCase(userRepository);
const googleAuthUseCase = new GoogleAuthUseCase(userRepository);
const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await registerUserUseCase.execute({
        name: req.body.name,
        email: req.body.email,
        phone_number: req.body.phone_number,
        password: req.body.password,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await loginUserUseCase.execute({
        email: req.body.email,
        password: req.body.password,
      });

      res.status(200).json({
        success: true,
        message: "User authenticated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await googleAuthUseCase.execute({
        credential: req.body.credential,
      });

      res.status(200).json({
        success: true,
        message: "Google authentication successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Unauthenticated",
          error: { code: "UNAUTHORIZED" },
        });
        return;
      }

      const user = await getCurrentUserUseCase.execute(req.user.user_generated_id);

      res.status(200).json({
        success: true,
        message: "Authenticated user retrieved",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: "Logout successful. Client should clear local token.",
    });
  }
}
