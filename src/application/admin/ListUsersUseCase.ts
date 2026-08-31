import UserModel from "../../domain/entities/Users.entity";
import {
  IUserRepository,
  PaginationOptions,
  PaginatedResult,
} from "../../domain/repositories/IUserRepository";

export class ListUsersUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(
    options: PaginationOptions
  ): Promise<PaginatedResult<Omit<UserModel, "password">>> {
    const result = await this.userRepository.getUsers(options);

    const sanitizedUsers = result.users.map((user) => {
      const { password, ...sanitized } = user;
      return sanitized;
    });

    return {
      users: sanitizedUsers,
      pagination: result.pagination,
    };
  }
}
