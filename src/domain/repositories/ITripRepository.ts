import TripModel from "../entities/Trip.entity";

export interface TripPaginationOptions {
  page: number;
  limit: number;
  search?: string;
}

export interface PaginatedTripResult {
  trips: TripModel[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ITripRepository {
  createTrip(trip: TripModel): Promise<TripModel>;
  getTripById(trip_id: string): Promise<TripModel | null>;
  getTripsByUserId(
    user_generated_id: string,
    options: TripPaginationOptions
  ): Promise<PaginatedTripResult>;
  updateTrip(trip_id: string, updates: Partial<TripModel>): Promise<TripModel | null>;
  deleteTrip(trip_id: string, user_generated_id: string): Promise<boolean>;
}
