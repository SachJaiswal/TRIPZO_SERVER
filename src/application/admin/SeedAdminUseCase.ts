import crypto from "crypto";
import UserModel from "../../domain/entities/Users.entity";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { PasswordService } from "../../infrastructure/services/PasswordService";

export class SeedAdminUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(): Promise<void> {
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@tripzo.io").toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@Tripzo2026!";

    const existingAdmin = await this.userRepository.getUserByEmail(adminEmail);

    if (!existingAdmin) {
      const passwordHash = await PasswordService.hashPassword(adminPassword);
      const now = new Date();

      const adminUser = new UserModel({
        user_generated_id: crypto.randomUUID(),
        name: "System Administrator",
        email: adminEmail,
        password: passwordHash,
        role: "ADMIN",
        auth_provider: "LOCAL",
        is_email_verified: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      });

      await this.userRepository.createUser(adminUser);
      console.log(`🔑 Admin bootstrap account initialized: ${adminEmail}`);
    }
  }
}
