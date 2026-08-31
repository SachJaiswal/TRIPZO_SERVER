import { IUserRepository } from "../../domain/repositories/IUserRepository";

export interface DeleteUserDTO {
  user_generated_id: string;
  admin_user_generated_id: string;
}

export class DeleteUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(dto: DeleteUserDTO): Promise<{ success: boolean; message: string }> {
    const targetUser = await this.userRepository.getUserByGeneratedId(
      dto.user_generated_id
    );

    if (!targetUser) {
      const error: any = new Error("User not found");
      error.statusCode = 404;
      error.code = "USER_NOT_FOUND";
      throw error;
    }

    // Admin Self-Protection Check: Cannot delete the last active admin
    if (targetUser.role === "ADMIN") {
      const activeAdminsCount = await this.userRepository.countActiveAdmins();
      if (activeAdminsCount <= 1) {
        const error: any = new Error(
          "Operation prohibited: Cannot delete the only remaining active administrator account"
        );
        error.statusCode = 403;
        error.code = "LAST_ADMIN_PROTECTION";
        throw error;
      }
    }

    const deleted = await this.userRepository.deleteUser(dto.user_generated_id);

    if (!deleted) {
      const error: any = new Error("Failed to delete user");
      error.statusCode = 500;
      error.code = "DELETE_FAILED";
      throw error;
    }

    return {
      success: true,
      message: "User deleted successfully",
    };
  }
}
