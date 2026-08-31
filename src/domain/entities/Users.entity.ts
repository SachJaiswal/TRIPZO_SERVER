// =====================================================
// USER ROLE
// =====================================================

export type UserRole = "ADMIN" | "USER";

// =====================================================
// AUTH PROVIDER
// =====================================================

export type AuthProvider = "LOCAL" | "GOOGLE";

// =====================================================
// USER ENTITY
// =====================================================

export interface UserEntity {
  user_generated_id: string;

  name: string;

  email: string;

  phone_number?: string;

  password?: string;

  role: UserRole;

  auth_provider: AuthProvider;

  provider_id?: string;

  profile_picture?: string;

  is_email_verified: boolean;

  is_active: boolean;

  created_at: Date;

  updated_at: Date;
}

// =====================================================
// USER MODEL
// =====================================================

class UserModel implements UserEntity {
  user_generated_id: string;

  name: string;

  email: string;

  phone_number?: string;

  password?: string;

  role: UserRole;

  auth_provider: AuthProvider;

  provider_id?: string;

  profile_picture?: string;

  is_email_verified: boolean;

  is_active: boolean;

  created_at: Date;

  updated_at: Date;

  constructor(data: UserEntity) {
    this.user_generated_id = data.user_generated_id;
    this.name = data.name;
    this.email = data.email;
    this.phone_number = data.phone_number;
    this.password = data.password;
    this.role = data.role;
    this.auth_provider = data.auth_provider;
    this.provider_id = data.provider_id;
    this.profile_picture = data.profile_picture;
    this.is_email_verified = data.is_email_verified;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }
}

export default UserModel;
