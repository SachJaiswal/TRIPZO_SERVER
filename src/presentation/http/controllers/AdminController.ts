import { Request, Response, NextFunction } from "express";
import UserRepository from "../../../infrastructure/repositories/UserRepository";
import TripRepository from "../../../infrastructure/repositories/TripRepository";
import { ListUsersUseCase } from "../../../application/admin/ListUsersUseCase";
import { GetUserDetailUseCase } from "../../../application/admin/GetUserDetailUseCase";
import { UpdateUserStatusUseCase } from "../../../application/admin/UpdateUserStatusUseCase";
import { DeleteUserUseCase } from "../../../application/admin/DeleteUserUseCase";
import { AdminAnalyticsUseCase } from "../../../application/admin/AdminAnalyticsUseCase";
import { ListAllTripsAdminUseCase } from "../../../application/admin/ListAllTripsAdminUseCase";

const userRepository = new UserRepository();
const tripRepository = new TripRepository();

const listUsersUseCase = new ListUsersUseCase(userRepository);
const getUserDetailUseCase = new GetUserDetailUseCase(userRepository);
const updateUserStatusUseCase = new UpdateUserStatusUseCase(userRepository);
const deleteUserUseCase = new DeleteUserUseCase(userRepository);
const adminAnalyticsUseCase = new AdminAnalyticsUseCase();
const listAllTripsAdminUseCase = new ListAllTripsAdminUseCase();

export class AdminController {
  static async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = (req.query.search as string) || undefined;
      const role = (req.query.role as any) || undefined;
      const status = (req.query.status as any) || undefined;

      const result = await listUsersUseCase.execute({
        page,
        limit,
        search,
        role,
        status,
      });

      res.status(200).json({
        success: true,
        message: "Users retrieved successfully",
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user_generated_id } = req.params;
      const user = await getUserDetailUseCase.execute(user_generated_id);

      res.status(200).json({
        success: true,
        message: "User detail retrieved successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user_generated_id } = req.params;
      const { is_active } = req.body;

      if (typeof is_active !== "boolean") {
        res.status(400).json({
          success: false,
          message: "is_active boolean field is required",
          error: { code: "INVALID_INPUT" },
        });
        return;
      }

      const updatedUser = await updateUserStatusUseCase.execute({
        user_generated_id,
        is_active,
        admin_user_generated_id: req.user!.user_generated_id,
      });

      res.status(200).json({
        success: true,
        message: `User status updated to ${is_active ? "ACTIVE" : "INACTIVE"} successfully`,
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user_generated_id } = req.params;

      const result = await deleteUserUseCase.execute({
        user_generated_id,
        admin_user_generated_id: req.user!.user_generated_id,
      });

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/analytics/overview
   */
  static async getAnalyticsOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await adminAnalyticsUseCase.execute();
      res.status(200).json({
        success: true,
        message: "Admin analytics overview retrieved successfully",
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/trips
   */
  static async listAllTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = (req.query.search as string) || undefined;

      const result = await listAllTripsAdminUseCase.execute({
        page,
        limit,
        search,
      });

      res.status(200).json({
        success: true,
        message: "Global user trips retrieved successfully",
        data: result.trips,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/trips/:tripId
   */
  static async getTripDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tripId } = req.params;
      const trip = await tripRepository.getTripById(tripId);

      if (!trip) {
        res.status(404).json({
          success: false,
          message: "Trip plan not found",
          error: { code: "TRIP_NOT_FOUND" },
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Trip detail retrieved successfully",
        data: trip,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AdminController;
