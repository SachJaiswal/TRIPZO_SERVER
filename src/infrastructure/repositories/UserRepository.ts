import { Collection } from "mongodb";
import { getClient } from "../config/database";
import UserModel from "../../domain/entities/Users.entity";
import {
  IUserRepository,
  PaginationOptions,
  PaginatedResult,
} from "../../domain/repositories/IUserRepository";

export class UserRepository implements IUserRepository {
  private static async collection(): Promise<Collection<UserModel>> {
    const client = await getClient();
    const dbName = process.env.DB_NAME || "tripzo";
    const col = client.db(dbName).collection<UserModel>("users");

    // Initialize unique indexes safely
    await col.createIndex({ email: 1 }, { unique: true });
    await col.createIndex({ user_generated_id: 1 }, { unique: true });
    await col.createIndex({ provider_id: 1 }, { sparse: true });

    return col;
  }

  async createUser(user: UserModel): Promise<UserModel> {
    const col = await UserRepository.collection();
    await col.insertOne(user);
    return user;
  }

  async getUserByEmail(email: string): Promise<UserModel | null> {
    const col = await UserRepository.collection();
    const normalizedEmail = email.toLowerCase().trim();
    return col.findOne({ email: normalizedEmail });
  }

  async getUserByGeneratedId(user_generated_id: string): Promise<UserModel | null> {
    const col = await UserRepository.collection();
    return col.findOne({ user_generated_id });
  }

  async getUserByProviderId(provider_id: string): Promise<UserModel | null> {
    const col = await UserRepository.collection();
    return col.findOne({ provider_id });
  }

  async getUsers(options: PaginationOptions): Promise<PaginatedResult<UserModel>> {
    const col = await UserRepository.collection();
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (options.role) {
      query.role = options.role;
    }

    if (options.status) {
      query.is_active = options.status === "ACTIVE";
    }

    if (options.search) {
      const searchRegex = new RegExp(options.search, "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone_number: searchRegex },
      ];
    }

    const total = await col.countDocuments(query);
    const users = await col
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUser(
    user_generated_id: string,
    data: Partial<UserModel>
  ): Promise<UserModel | null> {
    const col = await UserRepository.collection();
    const updateData = {
      ...data,
      updated_at: new Date(),
    };

    const result = await col.findOneAndUpdate(
      { user_generated_id },
      { $set: updateData },
      { returnDocument: "after" }
    );

    return result ? (result as unknown as UserModel) : null;
  }

  async deleteUser(user_generated_id: string): Promise<boolean> {
    const col = await UserRepository.collection();
    const result = await col.deleteOne({ user_generated_id });
    return result.deletedCount > 0;
  }

  async countActiveAdmins(): Promise<number> {
    const col = await UserRepository.collection();
    return col.countDocuments({ role: "ADMIN", is_active: true });
  }
}

export default UserRepository;
