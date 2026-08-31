import UserModel from "../../domain/entities/Users.entity";
import { IUserRepository } from "../../domain/repositories/IUserRepository";

export class GetCurrentUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(user_generated_id: string): Promise<Omit<UserModel, "password">> {
    const user = await this.userRepository.getUserByGeneratedId(user_generated_id);

    if (!user) {
      const error: any = new Error("User not found");
      error.statusCode = 404;
      error.code = "USER_NOT_FOUND";
      throw error;
    }

    if (!user.is_active) {
      const error: any = new Error("Account has been deactivated");
      error.statusCode = 403;
      error.code = "ACCOUNT_INACTIVE";
      throw error;
    }

    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
