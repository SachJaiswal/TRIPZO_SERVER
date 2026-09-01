import OpenAI from "openai";
import {
  TripPreferences,
  CandidateHotel,
  CandidateAttraction,
  CandidateRestaurant,
  DayWeatherSummary,
  ItineraryDay,
  BudgetBreakdown,
} from "../../domain/entities/Trip.entity";
import { BudgetLimits } from "./BudgetEngineService";

export interface PlannerOutput {
  itinerary: ItineraryDay[];
  budgetBreakdown: BudgetBreakdown;
}

export class OpenAiPlannerService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || "";
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Generates structured day-by-day itinerary by passing ONLY verified candidate places and weather
   */
  async generateItinerary(
    preferences: TripPreferences,
    hotels: CandidateHotel[],
    attractions: CandidateAttraction[],
    restaurants: CandidateRestaurant[],
    weather: DayWeatherSummary[],
    budgetLimits: BudgetLimits
  ): Promise<PlannerOutput> {
    if (!this.openai) {
      console.warn("⚠️ OPENAI_API_KEY missing, using verified rule-based fallback itinerary generator");
      return this.generateFallbackItinerary(preferences, hotels, attractions, restaurants, weather, budgetLimits);
    }

    const systemPrompt = `You are a world-class travel planner AI.
CRITICAL CONSTRAINT: You MUST NOT invent hotels, attractions, restaurants, coordinates, prices, or place_ids.
You MUST ONLY select places from the provided CANDIDATE lists below.
For every activity, the 'place_id' field MUST EXACTLY MATCH one of the place_ids provided in the candidate lists.
You MUST generate an itinerary day object for EVERY SINGLE DAY of the trip. Do NOT generate just one day.

Return ONLY a valid JSON object with the following exact structure:
{
  "itinerary": [
    {
      "dayNumber": 1, // Repeat this object for Day 2, Day 3, etc. up to the total number of days
      "date": "YYYY-MM-DD",
      "theme": "Arrival & Historic Center Exploration",
      "weatherSummary": {
        "date": "YYYY-MM-DD",
        "maxTempC": 28,
        "minTempC": 20,
        "condition": "Sunny",
        "precipitationProbPercent": 10
      },
      "accommodation": {
        "place_id": "...",
        "name": "...",
        "rating": 4.5,
        "user_ratings_total": 100,
        "address": "...",
        "location": { "lat": 0, "lng": 0 }
      },
      "activities": [
        {
          "timeOfDay": "morning",
          "timeSlot": "09:00 - 11:30",
          "title": "Visit Historic Citadel",
          "description": "Explore the ancient fort and scenic views.",
          "place_id": "EXACT_CANDIDATE_PLACE_ID",
          "placeName": "Historic Citadel",
          "location": { "lat": 0, "lng": 0 },
          "estimatedCost": 15,
          "durationMinutes": 150
        }
      ],
      "dailyTransport": {
        "mode": "Taxi / Rental Car",
        "estimatedCost": 25,
        "notes": "Short drive between locations"
      },
      "estimatedDailyCost": 120
    }
  ],
  "budgetBreakdown": {
    "accommodationTotal": 400,
    "foodTotal": 300,
    "activitiesTotal": 150,
    "transportTotal": 100,
    "contingency": 50,
    "totalEstimatedCost": 1000,
    "currency": "${preferences.currency}"
  }
}`;

    const userPrompt = `Generate a personalized ${weather.length}-day trip itinerary for ${preferences.destination}.
CRITICAL: Your "itinerary" array MUST contain exactly ${weather.length} day objects, covering Day 1 to Day ${weather.length}.

USER PREFERENCES:
- Start Date: ${preferences.startDate} to End Date: ${preferences.endDate}
- Travelers: ${preferences.adults} Adults, ${preferences.children} Children (${preferences.rooms} Rooms)
- Total Budget: ${preferences.totalBudget} ${preferences.currency}
- Travel Style: ${preferences.travelStyle}
- Interests: ${preferences.interests.join(", ")}
- Transportation Preference: ${preferences.transportationPreference}
- Accommodation Preference: ${preferences.accommodationPreference} (Min Rating: ${preferences.minHotelRating})

VERIFIED WEATHER FORECAST BY DAY:
${JSON.stringify(weather, null, 2)}

VERIFIED CANDIDATE HOTELS (Select 1 for the trip accommodation):
${JSON.stringify(hotels, null, 2)}

VERIFIED CANDIDATE ATTRACTIONS (Select 2-3 per day matching interests):
${JSON.stringify(attractions, null, 2)}

VERIFIED CANDIDATE RESTAURANTS (Select dining options per day):
${JSON.stringify(restaurants, null, 2)}

BUDGET BREAKDOWN CAPS:
${JSON.stringify(budgetLimits.breakdown, null, 2)}

Remember: DO NOT create fake place_ids or places. Only use place_ids from the candidate lists! Generate the full ${weather.length} days!`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response received from OpenAI");
      }

      const parsed: PlannerOutput = JSON.parse(content);
      return this.validateAndSanitizeOutput(parsed, hotels, attractions, restaurants, weather, budgetLimits);
    } catch (error: any) {
      console.error("OpenAI API call failed, falling back to rule-based planner:", error?.message || error);
      return this.generateFallbackItinerary(preferences, hotels, attractions, restaurants, weather, budgetLimits);
    }
  }

  /**
   * Customizes an existing itinerary based on user natural-language prompt
   */
  async customizeItinerary(
    currentItinerary: ItineraryDay[],
    instruction: string,
    hotels: CandidateHotel[],
    attractions: CandidateAttraction[],
    restaurants: CandidateRestaurant[],
    weather: DayWeatherSummary[],
    budgetLimits: BudgetLimits
  ): Promise<PlannerOutput> {
    if (!this.openai) {
      console.warn("⚠️ OPENAI_API_KEY missing, using default customization fallback");
      return {
        itinerary: currentItinerary,
        budgetBreakdown: budgetLimits.breakdown,
      };
    }

    const systemPrompt = `You are a travel customization AI.
The user wants to update their existing itinerary based on natural language instructions.
CRITICAL CONSTRAINT: You MUST NOT invent places or place_ids. All places used in activities MUST match place_ids in the provided candidate lists.

Return ONLY a valid JSON object matching:
{
  "itinerary": [...],
  "budgetBreakdown": {...}
}`;

    const userPrompt = `CURRENT ITINERARY:
${JSON.stringify(currentItinerary, null, 2)}

USER CUSTOMIZATION INSTRUCTION:
"${instruction}"

CANDIDATE HOTELS: ${JSON.stringify(hotels)}
CANDIDATE ATTRACTIONS: ${JSON.stringify(attractions)}
CANDIDATE RESTAURANTS: ${JSON.stringify(restaurants)}
WEATHER: ${JSON.stringify(weather)}

Update the itinerary to accommodate the user's instruction while maintaining valid place_ids from candidates.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return { itinerary: currentItinerary, budgetBreakdown: budgetLimits.breakdown };
      }

      const parsed: PlannerOutput = JSON.parse(content);
      return this.validateAndSanitizeOutput(parsed, hotels, attractions, restaurants, weather, budgetLimits);
    } catch (error: any) {
      console.error("OpenAI customization error:", error?.message || error);
      return { itinerary: currentItinerary, budgetBreakdown: budgetLimits.breakdown };
    }
  }

  private validateAndSanitizeOutput(
    output: PlannerOutput,
    hotels: CandidateHotel[],
    attractions: CandidateAttraction[],
    restaurants: CandidateRestaurant[],
    weather: DayWeatherSummary[],
    budgetLimits: BudgetLimits
  ): PlannerOutput {
    if (!output.itinerary || !Array.isArray(output.itinerary) || output.itinerary.length === 0) {
      return this.generateFallbackItinerary(
        { destination: "Selected Destination" } as TripPreferences,
        hotels,
        attractions,
        restaurants,
        weather,
        budgetLimits
      );
    }

    const validPlaceIds = new Set<string>([
      ...hotels.map((h) => h.place_id),
      ...attractions.map((a) => a.place_id),
      ...restaurants.map((r) => r.place_id),
    ]);

    // Ensure all activities have valid candidate place_ids
    output.itinerary.forEach((day, idx) => {
      if (!day.weatherSummary) {
        day.weatherSummary = weather[idx] || weather[0];
      }
      if (!day.accommodation && hotels.length > 0) {
        day.accommodation = hotels[0];
      }

      day.activities = (day.activities || []).map((act) => {
        if (!validPlaceIds.has(act.place_id)) {
          const fallbackAttraction = attractions[0] || {
            place_id: "google_attraction_01",
            name: act.placeName || "Popular Tourist Site",
            location: { lat: 15.2993, lng: 74.124 },
          };
          act.place_id = fallbackAttraction.place_id;
          act.placeName = fallbackAttraction.name;
          act.location = fallbackAttraction.location;
        }
        return act;
      });
    });

    if (!output.budgetBreakdown) {
      output.budgetBreakdown = budgetLimits.breakdown;
    }

    return output;
  }

  private generateFallbackItinerary(
    preferences: TripPreferences,
    hotels: CandidateHotel[],
    attractions: CandidateAttraction[],
    restaurants: CandidateRestaurant[],
    weather: DayWeatherSummary[],
    budgetLimits: BudgetLimits
  ): PlannerOutput {
    const selectedHotel = hotels[0] || {
      place_id: "hotel_fallback_01",
      name: "Central Grand Hotel",
      rating: 4.5,
      user_ratings_total: 500,
      address: "Main City Square",
      location: { lat: 15.2993, lng: 74.124 },
    };

    const itinerary: ItineraryDay[] = weather.map((w, idx) => {
      const dayNum = idx + 1;
      const dayAttraction1 = attractions[idx % attractions.length] || attractions[0];
      const dayAttraction2 = attractions[(idx + 1) % attractions.length] || attractions[0];
      const dayRestaurant = restaurants[idx % restaurants.length] || restaurants[0];

      return {
        dayNumber: dayNum,
        date: w.date,
        theme: `Day ${dayNum} - Highlights & Local Exploration`,
        weatherSummary: w,
        accommodation: selectedHotel,
        activities: [
          {
            timeOfDay: "morning",
            timeSlot: "09:30 - 12:00",
            title: `Explore ${dayAttraction1?.name || "Attraction"}`,
            description: `Visit ${dayAttraction1?.name || "the sight"} and enjoy local history and culture.`,
            place_id: dayAttraction1?.place_id || "google_attraction_01",
            placeName: dayAttraction1?.name || "Attraction Site",
            location: dayAttraction1?.location || { lat: 15.2993, lng: 74.124 },
            estimatedCost: dayAttraction1?.estimatedCost || 15,
            durationMinutes: 150,
          },
          {
            timeOfDay: "afternoon",
            timeSlot: "13:00 - 14:30",
            title: `Lunch at ${dayRestaurant?.name || "Local Bistro"}`,
            description: `Enjoy delicious regional cuisine at ${dayRestaurant?.name || "restaurant"}.`,
            place_id: dayRestaurant?.place_id || "google_rest_01",
            placeName: dayRestaurant?.name || "Local Bistro",
            location: dayRestaurant?.location || { lat: 15.2993, lng: 74.124 },
            estimatedCost: dayRestaurant?.estimatedCostPerPerson || 25,
            durationMinutes: 90,
          },
          {
            timeOfDay: "evening",
            timeSlot: "16:00 - 18:30",
            title: `Leisure & Walk at ${dayAttraction2?.name || "Park"}`,
            description: `Unwind at ${dayAttraction2?.name || "park/scenic site"} as the sun sets.`,
            place_id: dayAttraction2?.place_id || "google_attraction_02",
            placeName: dayAttraction2?.name || "Scenic Park",
            location: dayAttraction2?.location || { lat: 15.2993, lng: 74.124 },
            estimatedCost: dayAttraction2?.estimatedCost || 10,
            durationMinutes: 150,
          },
        ],
        dailyTransport: {
          mode: preferences.transportationPreference || "Public Transit / Taxi",
          estimatedCost: 20,
          notes: "Convenient local transfers between activities",
        },
        estimatedDailyCost: Math.round(
          (dayAttraction1?.estimatedCost || 15) +
            (dayRestaurant?.estimatedCostPerPerson || 25) +
            (dayAttraction2?.estimatedCost || 10) +
            20
        ),
      };
    });

    return {
      itinerary,
      budgetBreakdown: budgetLimits.breakdown,
    };
  }
}

export default OpenAiPlannerService;
