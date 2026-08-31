// =====================================================
// TRIP PREFERENCES INTERFACE
// =====================================================

export interface TripPreferences {
  destination: string;
  startDate: string; // ISO Date String YYYY-MM-DD
  endDate: string; // ISO Date String YYYY-MM-DD
  adults: number;
  children: number;
  rooms: number;
  totalBudget: number;
  currency: string;
  accommodationPreference: string; // e.g. "budget", "mid-range", "luxury", "boutique", "resort"
  minHotelRating: number; // e.g. 1.0 - 5.0
  interests: string[]; // e.g. ["culture", "food", "beach", "shopping", "nature", "history"]
  travelStyle: string; // e.g. "relaxed", "fast-paced", "balanced", "adventure", "family-friendly"
  transportationPreference: string; // e.g. "rental_car", "public_transit", "walking", "taxi_ride_share", "mixed"
}

// =====================================================
// NORMALIZED VERIFIED CANDIDATE PLACES (GOOGLE PLACES)
// =====================================================

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface CandidateHotel {
  place_id: string;
  name: string;
  rating: number;
  user_ratings_total: number;
  address: string;
  location: GeoLocation;
  priceLevel?: number; // 0-4
  photoUrl?: string;
  website?: string;
  estimatedNightlyRate?: number;
}

export interface CandidateAttraction {
  place_id: string;
  name: string;
  rating: number;
  user_ratings_total: number;
  address: string;
  location: GeoLocation;
  types: string[];
  photoUrl?: string;
  estimatedCost?: number;
}

export interface CandidateRestaurant {
  place_id: string;
  name: string;
  rating: number;
  user_ratings_total: number;
  address: string;
  location: GeoLocation;
  priceLevel?: number;
  cuisine?: string[];
  photoUrl?: string;
  estimatedCostPerPerson?: number;
}

// =====================================================
// WEATHER FORECAST / SUMMARY
// =====================================================

export interface DayWeatherSummary {
  date: string; // YYYY-MM-DD
  maxTempC: number;
  minTempC: number;
  condition: string; // e.g. "Clear", "Partly Cloudy", "Rain", "Thunderstorm"
  precipitationProbPercent: number;
}

// =====================================================
// ITINERARY STRUCTURE
// =====================================================

export type TimeOfDay = "morning" | "afternoon" | "evening";

export interface ItineraryActivity {
  timeOfDay: TimeOfDay;
  timeSlot: string; // e.g. "09:00 - 11:30"
  title: string;
  description: string;
  place_id: string; // Must match one of the candidate place_ids
  placeName: string;
  location: GeoLocation;
  estimatedCost: number;
  durationMinutes: number;
  distanceToNextKm?: number;
  travelTimeToNextMins?: number;
}

export interface ItineraryTransport {
  mode: string;
  estimatedCost: number;
  notes?: string;
}

export interface ItineraryDay {
  dayNumber: number;
  date: string;
  theme: string;
  weatherSummary: DayWeatherSummary;
  accommodation?: CandidateHotel;
  activities: ItineraryActivity[];
  dailyTransport?: ItineraryTransport;
  estimatedDailyCost: number;
}

// =====================================================
// BUDGET BREAKDOWN
// =====================================================

export interface BudgetBreakdown {
  accommodationTotal: number;
  foodTotal: number;
  activitiesTotal: number;
  transportTotal: number;
  contingency: number;
  totalEstimatedCost: number;
  currency: string;
}

// =====================================================
// CUSTOMIZATION LOG
// =====================================================

export interface CustomizationLog {
  instruction: string;
  appliedAt: Date;
}

// =====================================================
// TRIP ENTITY & MODEL
// =====================================================

export interface TripEntity {
  trip_id: string;
  user_generated_id: string;
  destinationDetails: {
    name: string;
    formattedAddress: string;
    location: GeoLocation;
    place_id: string;
  };
  preferences: TripPreferences;
  candidateHotels: CandidateHotel[];
  candidateAttractions: CandidateAttraction[];
  candidateRestaurants: CandidateRestaurant[];
  weatherForecast: DayWeatherSummary[];
  itinerary: ItineraryDay[];
  budgetBreakdown: BudgetBreakdown;
  customizationHistory: CustomizationLog[];
  generationCount: number;
  created_at: Date;
  updated_at: Date;
}

export class TripModel implements TripEntity {
  trip_id: string;
  user_generated_id: string;
  destinationDetails: {
    name: string;
    formattedAddress: string;
    location: GeoLocation;
    place_id: string;
  };
  preferences: TripPreferences;
  candidateHotels: CandidateHotel[];
  candidateAttractions: CandidateAttraction[];
  candidateRestaurants: CandidateRestaurant[];
  weatherForecast: DayWeatherSummary[];
  itinerary: ItineraryDay[];
  budgetBreakdown: BudgetBreakdown;
  customizationHistory: CustomizationLog[];
  generationCount: number;
  created_at: Date;
  updated_at: Date;

  constructor(data: TripEntity) {
    this.trip_id = data.trip_id;
    this.user_generated_id = data.user_generated_id;
    this.destinationDetails = data.destinationDetails;
    this.preferences = data.preferences;
    this.candidateHotels = data.candidateHotels;
    this.candidateAttractions = data.candidateAttractions;
    this.candidateRestaurants = data.candidateRestaurants;
    this.weatherForecast = data.weatherForecast;
    this.itinerary = data.itinerary;
    this.budgetBreakdown = data.budgetBreakdown;
    this.customizationHistory = data.customizationHistory || [];
    this.generationCount = data.generationCount || 1;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }
}

export default TripModel;
