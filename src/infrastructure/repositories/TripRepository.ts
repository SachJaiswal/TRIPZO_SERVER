import { Collection } from "mongodb";
import { getClient } from "../config/database";
import TripModel from "../../domain/entities/Trip.entity";
import {
  ITripRepository,
  TripPaginationOptions,
  PaginatedTripResult,
} from "../../domain/repositories/ITripRepository";

export class TripRepository implements ITripRepository {
  private static async collection(): Promise<Collection<TripModel>> {
    const client = await getClient();
    const dbName = process.env.DB_NAME || "tripzo";
    const col = client.db(dbName).collection<TripModel>("trips");

    // Indexes for fast user queries and unique trip ID
    await col.createIndex({ trip_id: 1 }, { unique: true });
    await col.createIndex({ user_generated_id: 1, created_at: -1 });

    return col;
  }

  async createTrip(trip: TripModel): Promise<TripModel> {
    const col = await TripRepository.collection();
    await col.insertOne(trip);
    return trip;
  }

  async getTripById(trip_id: string): Promise<TripModel | null> {
    const col = await TripRepository.collection();
    return col.findOne({ trip_id });
  }

  async getTripsByUserId(
    user_generated_id: string,
    options: TripPaginationOptions
  ): Promise<PaginatedTripResult> {
    const col = await TripRepository.collection();
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = { user_generated_id };

    if (options.search) {
      const searchRegex = new RegExp(options.search, "i");
      query.$or = [
        { "preferences.destination": searchRegex },
        { "destinationDetails.name": searchRegex },
      ];
    }

    const total = await col.countDocuments(query);
    const trips = await col
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return {
      trips,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateTrip(
    trip_id: string,
    updates: Partial<TripModel>
  ): Promise<TripModel | null> {
    const col = await TripRepository.collection();
    const updateData = {
      ...updates,
      updated_at: new Date(),
    };

    const result = await col.findOneAndUpdate(
      { trip_id },
      { $set: updateData },
      { returnDocument: "after" }
    );

    return result ? (result as unknown as TripModel) : null;
  }

  async deleteTrip(trip_id: string, user_generated_id: string): Promise<boolean> {
    const col = await TripRepository.collection();
    const result = await col.deleteOne({ trip_id, user_generated_id });
    return result.deletedCount > 0;
  }
}

export default TripRepository;
