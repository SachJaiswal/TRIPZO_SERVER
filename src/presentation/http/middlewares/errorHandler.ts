import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || "INTERNAL_SERVER_ERROR";
  const message = err.message || "An unexpected error occurred on the server";

  console.error(`❌ [${req.method} ${req.url}] Error ${statusCode}:`, err);

  res.status(statusCode).json({
    success: false,
    message,
    error: {
      code: errorCode,
    },
  });
};
