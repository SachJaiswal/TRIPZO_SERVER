import { Request, Response, NextFunction } from "express";
import { UserRole } from "../../../domain/entities/Users.entity";

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
        error: {
          code: "UNAUTHORIZED",
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions for this resource.",
        error: {
          code: "FORBIDDEN",
        },
      });
      return;
    }

    next();
  };
};
