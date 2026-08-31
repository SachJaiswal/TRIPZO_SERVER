import { getClient } from "../../infrastructure/config/database";
import TripModel from "../../domain/entities/Trip.entity";
import UserModel from "../../domain/entities/Users.entity";

export interface DestinationStat {
  destination: string;
  count: number;
}

export interface DistributionStat {
  key: string;
  count: number;
}

export interface AdminAnalyticsOverview {
  totalUsers: number;
  activeUsers: number;
  totalTripsGenerated: number;
  totalGenerationsQuotaUsed: number;
  averageBudgetPerTrip: number;
  topDestinations: DestinationStat[];
  travelStyleDistribution: DistributionStat[];
  accommodationDistribution: DistributionStat[];
  currencyBreakdown: DistributionStat[];
  recentTrips: Partial<TripModel>[];
  recentUsers: Partial<UserModel>[];
}

export class AdminAnalyticsUseCase {
  async execute(): Promise<AdminAnalyticsOverview> {
    const client = await getClient();
    const dbName = process.env.DB_NAME || "tripzo";
    const db = client.db(dbName);

    const usersCol = db.collection<UserModel>("users");
    const tripsCol = db.collection<TripModel>("trips");
    const usageCol = db.collection("trip_usage");

    // 1. Parallel basic counts
    const [totalUsers, activeUsers, totalTripsGenerated] = await Promise.all([
      usersCol.countDocuments(),
      usersCol.countDocuments({ is_active: true }),
      tripsCol.countDocuments(),
    ]);

    // 2. Total generation quota used
    const usageAgg = await usageCol
      .aggregate([{ $group: { _id: null, total: { $sum: "$generations_count" } } }])
      .toArray();
    const totalGenerationsQuotaUsed = usageAgg[0]?.total || totalTripsGenerated;

    // 3. Average Budget calculation
    const budgetAgg = await tripsCol
      .aggregate([
        {
          $group: {
            _id: null,
            avgBudget: { $avg: "$preferences.totalBudget" },
          },
        },
      ])
      .toArray();
    const averageBudgetPerTrip = Math.round(budgetAgg[0]?.avgBudget || 0);

    // 4. Top Destinations Ranking
    const destAgg = await tripsCol
      .aggregate([
        {
          $group: {
            _id: "$destinationDetails.name",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ])
      .toArray();

    const topDestinations: DestinationStat[] = destAgg.map((item) => ({
      destination: item._id || "Unknown Region",
      count: item.count,
    }));

    // 5. Travel Style Distribution
    const styleAgg = await tripsCol
      .aggregate([
        {
          $group: {
            _id: "$preferences.travelStyle",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ])
      .toArray();

    const travelStyleDistribution: DistributionStat[] = styleAgg.map((item) => ({
      key: item._id || "relaxed",
      count: item.count,
    }));

    // 6. Accommodation Style Distribution
    const accAgg = await tripsCol
      .aggregate([
        {
          $group: {
            _id: "$preferences.accommodationPreference",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ])
      .toArray();

    const accommodationDistribution: DistributionStat[] = accAgg.map((item) => ({
      key: item._id || "mid-range",
      count: item.count,
    }));

    // 7. Currency Distribution
    const currAgg = await tripsCol
      .aggregate([
        {
          $group: {
            _id: "$preferences.currency",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ])
      .toArray();

    const currencyBreakdown: DistributionStat[] = currAgg.map((item) => ({
      key: item._id || "INR",
      count: item.count,
    }));

    // 8. Top 5 Recent Trips
    const recentTrips = await tripsCol
      .find({})
      .sort({ created_at: -1 })
      .limit(5)
      .project({
        trip_id: 1,
        user_generated_id: 1,
        destinationDetails: 1,
        preferences: 1,
        created_at: 1,
      })
      .toArray();

    // 9. Top 5 Recent Users
    const recentUsers = await usersCol
      .find({})
      .sort({ created_at: -1 })
      .limit(5)
      .project({
        user_generated_id: 1,
        name: 1,
        email: 1,
        role: 1,
        created_at: 1,
        is_active: 1,
      })
      .toArray();

    return {
      totalUsers,
      activeUsers,
      totalTripsGenerated,
      totalGenerationsQuotaUsed,
      averageBudgetPerTrip,
      topDestinations,
      travelStyleDistribution,
      accommodationDistribution,
      currencyBreakdown,
      recentTrips,
      recentUsers,
    };
  }
}

export default AdminAnalyticsUseCase;
