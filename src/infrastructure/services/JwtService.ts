import jwt from "jsonwebtoken";
import { UserRole } from "../../domain/entities/Users.entity";

export interface JwtPayload {
  user_generated_id: string;
  email: string;
  role: UserRole;
}

export class JwtService {
  private static get secret(): string {
    return process.env.JWT_SECRET || "tripzo_default_jwt_secret_change_me";
  }

  private static get expiresIn(): string {
    return process.env.JWT_EXPIRES_IN || "7d";
  }

  static signToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn as any,
    });
  }

  static verifyToken(token: string): JwtPayload {
    return jwt.verify(token, this.secret) as JwtPayload;
  }
}
