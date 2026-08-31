import crypto from "crypto";
import UserModel from "../../domain/entities/Users.entity";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { GoogleAuthService } from "../../infrastructure/services/GoogleAuthService";
import { JwtService } from "../../infrastructure/services/JwtService";
import { AuthResponse } from "./RegisterUserUseCase";

export interface GoogleAuthDTO {
  credential: string;
}

export class GoogleAuthUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(dto: GoogleAuthDTO): Promise<AuthResponse> {
    if (!dto.credential) {
      const error: any = new Error("Google credential is required");
      error.statusCode = 400;
      error.code = "INVALID_INPUT";
      throw error;
    }

    // 1. Verify Google identity
    const googleIdentity = await GoogleAuthService.verifyIdToken(dto.credential);

    // 2. Find user by Google provider ID
    let user = await this.userRepository.getUserByProviderId(googleIdentity.provider_id);

    if (user) {
      // Existing Google user
      if (!user.is_active) {
        const error: any = new Error("Account has been deactivated. Please contact support.");
        error.statusCode = 403;
        error.code = "ACCOUNT_INACTIVE";
        throw error;
      }
    } else {
      // 3. Find user by verified Google email
      const existingEmailUser = await this.userRepository.getUserByEmail(
        googleIdentity.email
      );

      if (existingEmailUser) {
        // Link Google provider to existing compatible account
        if (!existingEmailUser.is_active) {
          const error: any = new Error("Account has been deactivated. Please contact support.");
          error.statusCode = 403;
          error.code = "ACCOUNT_INACTIVE";
          throw error;
        }

        const updatedUser = await this.userRepository.updateUser(
          existingEmailUser.user_generated_id,
          {
            provider_id: googleIdentity.provider_id,
            profile_picture: existingEmailUser.profile_picture || googleIdentity.profile_picture,
            is_email_verified: true,
          }
        );

        user = updatedUser || existingEmailUser;
      } else {
        // 4. Create new User account
        const userGeneratedId = crypto.randomUUID();
        const now = new Date();

        const newUser = new UserModel({
          user_generated_id: userGeneratedId,
          name: googleIdentity.name,
          email: googleIdentity.email,
          role: "USER", // ALWAYS USER for public google signup
          auth_provider: "GOOGLE",
          provider_id: googleIdentity.provider_id,
          profile_picture: googleIdentity.profile_picture,
          is_email_verified: true,
          is_active: true,
          created_at: now,
          updated_at: now,
        });

        user = await this.userRepository.createUser(newUser);
      }
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
