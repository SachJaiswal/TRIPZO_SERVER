import crypto from "crypto";
import UserModel from "../../domain/entities/Users.entity";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { PasswordService } from "../../infrastructure/services/PasswordService";
import { JwtService } from "../../infrastructure/services/JwtService";

export interface RegisterDTO {
  name: string;
  email: string;
  phone_number?: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<UserModel, "password">;
}

export class RegisterUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(dto: RegisterDTO): Promise<AuthResponse> {
    // 1. Validation
    if (!dto.name || !dto.name.trim()) {
      throw new Error("Name is required");
    }
    if (!dto.email || !dto.email.trim()) {
      throw new Error("Email is required");
    }
    if (!dto.password || dto.password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // 2. Normalize Email
    const normalizedEmail = dto.email.toLowerCase().trim();

    // 3. Uniqueness Check
    const existingUser = await this.userRepository.getUserByEmail(normalizedEmail);
    if (existingUser) {
      const error: any = new Error("User with this email already exists");
      error.statusCode = 409;
      error.code = "USER_ALREADY_EXISTS";
      throw error;
    }

    // 4. Secure Password Hashing
    const passwordHash = await PasswordService.hashPassword(dto.password);

    // 5. Generate Unpredictable Public ID via Node.js crypto
    const userGeneratedId = crypto.randomUUID();

    // 6. Instantiate User Entity with Strict Public Defaults
    const now = new Date();
    const newUser = new UserModel({
      user_generated_id: userGeneratedId,
      name: dto.name.trim(),
      email: normalizedEmail,
      phone_number: dto.phone_number?.trim(),
      password: passwordHash,
      role: "USER", // ALWAYS USER for public registration
      auth_provider: "LOCAL",
      is_email_verified: false,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    // 7. Persist
    const createdUser = await this.userRepository.createUser(newUser);

    // 8. Generate JWT
    const token = JwtService.signToken({
      user_generated_id: createdUser.user_generated_id,
      email: createdUser.email,
      role: createdUser.role,
    });

    // 9. Return Sanitized Response (without password)
    const { password, ...sanitizedUser } = createdUser;

    return {
      token,
      user: sanitizedUser,
    };
  }
}
