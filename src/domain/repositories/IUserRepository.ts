import UserModel, { UserRole } from "../entities/Users.entity";

export interface PaginationOptions {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  status?: "ACTIVE" | "INACTIVE";
}

export interface PaginatedResult<T> {
  users: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface IUserRepository {
  createUser(user: UserModel): Promise<UserModel>;
  getUserByEmail(email: string): Promise<UserModel | null>;
  getUserByGeneratedId(user_generated_id: string): Promise<UserModel | null>;
  getUserByProviderId(provider_id: string): Promise<UserModel | null>;
  getUsers(options: PaginationOptions): Promise<PaginatedResult<UserModel>>;
  updateUser(user_generated_id: string, data: Partial<UserModel>): Promise<UserModel | null>;
  deleteUser(user_generated_id: string): Promise<boolean>;
  countActiveAdmins(): Promise<number>;
}
