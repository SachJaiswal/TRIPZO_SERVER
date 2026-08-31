import { Request, Response, NextFunction } from "express";
import { JwtService, JwtPayload } from "../../../infrastructure/services/JwtService";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Authentication token missing or invalid",
        error: {
          code: "UNAUTHORIZED",
        },
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = JwtService.verifyToken(token);

    req.user = decoded;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: "Invalid, expired, or corrupted authentication token",
      error: {
        code: "INVALID_TOKEN",
      },
    });
  }
};
