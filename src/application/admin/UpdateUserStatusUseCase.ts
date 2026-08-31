import UserModel from "../../domain/entities/Users.entity";
import { IUserRepository } from "../../domain/repositories/IUserRepository";

export interface UpdateStatusDTO {
  user_generated_id: string;
  is_active: boolean;
  admin_user_generated_id: string;
}

export class UpdateUserStatusUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(dto: UpdateStatusDTO): Promise<Omit<UserModel, "password">> {
    const targetUser = await this.userRepository.getUserByGeneratedId(
      dto.user_generated_id
    );

    if (!targetUser) {
      const error: any = new Error("User not found");
      error.statusCode = 404;
      error.code = "USER_NOT_FOUND";
      throw error;
    }

    // Admin Self-Protection Check: Cannot deactivate the last active admin
    if (targetUser.role === "ADMIN" && !dto.is_active) {
      const activeAdminsCount = await this.userRepository.countActiveAdmins();
      if (activeAdminsCount <= 1) {
        const error: any = new Error(
          "Operation prohibited: Cannot deactivate the only remaining active administrator account"
        );
        error.statusCode = 403;
        error.code = "LAST_ADMIN_PROTECTION";
        throw error;
      }
    }

    const updatedUser = await this.userRepository.updateUser(
      dto.user_generated_id,
      { is_active: dto.is_active }
    );

    if (!updatedUser) {
      const error: any = new Error("Failed to update user status");
      error.statusCode = 500;
      error.code = "UPDATE_FAILED";
      throw error;
    }

    const { password, ...sanitizedUser } = updatedUser;
    return sanitizedUser;
  }
}
