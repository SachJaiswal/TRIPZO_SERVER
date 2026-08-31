import { getClient } from "../../infrastructure/config/database";
import TripModel from "../../domain/entities/Trip.entity";

export interface ListAllTripsDTO {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedAdminTripsResult {
  trips: TripModel[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class ListAllTripsAdminUseCase {
  async execute(dto: ListAllTripsDTO): Promise<PaginatedAdminTripsResult> {
    const client = await getClient();
    const dbName = process.env.DB_NAME || "tripzo";
    const col = client.db(dbName).collection<TripModel>("trips");

    const page = Math.max(1, dto.page || 1);
    const limit = Math.max(1, Math.min(100, dto.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (dto.search) {
      const searchRegex = new RegExp(dto.search, "i");
      query.$or = [
        { "preferences.destination": searchRegex },
        { "destinationDetails.name": searchRegex },
        { user_generated_id: searchRegex },
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
}

export default ListAllTripsAdminUseCase;
