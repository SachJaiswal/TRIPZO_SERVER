import { TripPreferences, BudgetBreakdown } from "../../domain/entities/Trip.entity";

export interface BudgetLimits {
  targetNightlyHotelRate: number;
  maxHotelPriceLevel: number;
  dailyFoodBudgetPerPerson: number;
  dailyActivityBudgetTotal: number;
  breakdown: BudgetBreakdown;
}

export class BudgetEngineService {
  /**
   * Calculates structural budget allocations, per-night hotel price limits, and daily caps
   */
  calculateBudgetBreakdown(preferences: TripPreferences, daysCount: number): BudgetLimits {
    const total = preferences.totalBudget;
    const numNights = Math.max(1, daysCount - 1);
    const totalGuests = preferences.adults + Math.max(0, preferences.children * 0.5);

    // Standard percentage allocations
    const accommodationAlloc = Math.round(total * 0.4);
    const foodAlloc = Math.round(total * 0.3);
    const activitiesAlloc = Math.round(total * 0.15);
    const transportAlloc = Math.round(total * 0.1);
    const contingencyAlloc = total - (accommodationAlloc + foodAlloc + activitiesAlloc + transportAlloc);

    // Target hotel nightly rate (divided by rooms)
    const targetNightlyHotelRate = Math.round(accommodationAlloc / (numNights * Math.max(1, preferences.rooms)));

    // Estimate hotel price level (0 to 4)
    let maxHotelPriceLevel = 2;
    if (preferences.accommodationPreference === "luxury" || targetNightlyHotelRate > 300) {
      maxHotelPriceLevel = 4;
    } else if (preferences.accommodationPreference === "budget" || targetNightlyHotelRate < 80) {
      maxHotelPriceLevel = 1;
    } else if (preferences.accommodationPreference === "resort" || targetNightlyHotelRate > 180) {
      maxHotelPriceLevel = 3;
    }

    // Daily food budget per adult guest
    const dailyFoodBudgetPerPerson = Math.round(foodAlloc / (Math.max(1, daysCount) * Math.max(1, totalGuests)));

    // Daily activity budget total across all guests
    const dailyActivityBudgetTotal = Math.round(activitiesAlloc / Math.max(1, daysCount));

    const breakdown: BudgetBreakdown = {
      accommodationTotal: accommodationAlloc,
      foodTotal: foodAlloc,
      activitiesTotal: activitiesAlloc,
      transportTotal: transportAlloc,
      contingency: contingencyAlloc,
      totalEstimatedCost: total,
      currency: preferences.currency || "USD",
    };

    return {
      targetNightlyHotelRate,
      maxHotelPriceLevel,
      dailyFoodBudgetPerPerson,
      dailyActivityBudgetTotal,
      breakdown,
    };
  }
}

export default BudgetEngineService;
