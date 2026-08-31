import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { PasswordService } from "../../infrastructure/services/PasswordService";
import { JwtService } from "../../infrastructure/services/JwtService";
import { AuthResponse } from "./RegisterUserUseCase";

export interface LoginDTO {
  email: string;
  password: string;
}

export class LoginUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(dto: LoginDTO): Promise<AuthResponse> {
    if (!dto.email || !dto.password) {
      const error: any = new Error("Email and password are required");
      error.statusCode = 400;
      error.code = "INVALID_INPUT";
      throw error;
    }

    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await this.userRepository.getUserByEmail(normalizedEmail);

    if (!user || !user.password) {
      const error: any = new Error("Invalid email or password");
      error.statusCode = 401;
      error.code = "INVALID_CREDENTIALS";
      throw error;
    }

    // Check account active status
    if (!user.is_active) {
      const error: any = new Error("Account has been deactivated. Please contact support.");
      error.statusCode = 403;
      error.code = "ACCOUNT_INACTIVE";
      throw error;
    }

    // Compare password
    const isPasswordValid = await PasswordService.comparePassword(
      dto.password,
      user.password
    );

    if (!isPasswordValid) {
      const error: any = new Error("Invalid email or password");
      error.statusCode = 401;
      error.code = "INVALID_CREDENTIALS";
      throw error;
    }

    // Generate JWT
    const token = JwtService.signToken({
      user_generated_id: user.user_generated_id,
      email: user.email,
      role: user.role,
    });

    const { password, ...sanitizedUser } = user;

    return {
      token,
      user: sanitizedUser,
    };
  }
}
