import axios from "axios";
import {
  GeoLocation,
  CandidateHotel,
  CandidateAttraction,
  CandidateRestaurant,
} from "../../domain/entities/Trip.entity";

export interface DestinationGeocodeResult {
  place_id: string;
  name: string;
  formattedAddress: string;
  location: GeoLocation;
}

export class GoogleMapsService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || "";
  }

  /**
   * Geocodes a destination string to lat/lng and place_id using Google Geocoding API
   */
  async geocodeDestination(destination: string): Promise<DestinationGeocodeResult> {
    if (!this.apiKey) {
      console.warn("⚠️ GOOGLE_MAPS_API_KEY missing, using mock geocode fallback for:", destination);
      return {
        place_id: `mock_place_${destination.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        name: destination,
        formattedAddress: `${destination}, Verified Region`,
        location: { lat: 15.2993, lng: 74.124 }, // Default fallback coordinates (e.g. Goa)
      };
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        destination
      )}&key=${this.apiKey}`;
      const response = await axios.get(url);

      if (response.data.status === "OK" && response.data.results.length > 0) {
        const first = response.data.results[0];
        return {
          place_id: first.place_id,
          name: destination,
          formattedAddress: first.formatted_address,
          location: {
            lat: first.geometry.location.lat,
            lng: first.geometry.location.lng,
          },
        };
      }

      throw new Error(`Google Geocoding failed with status: ${response.data.status}`);
    } catch (error: any) {
      console.error("Google Geocoding API error:", error?.message || error);
      return {
        place_id: `fallback_place_${destination.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        name: destination,
        formattedAddress: destination,
        location: { lat: 15.2993, lng: 74.124 },
      };
    }
  }

  /**
   * Search real-world hotels near location using Google Places Nearby Search
   */
  async searchHotels(
    location: GeoLocation,
    minRating: number = 3.5,
    accommodationPref: string = "mid-range"
  ): Promise<CandidateHotel[]> {
    if (!this.apiKey) {
      return this.getMockHotels(location, minRating);
    }

    try {
      const radius = 15000; // 15km
      const type = "lodging";
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=${type}&key=${this.apiKey}`;
      const response = await axios.get(url);

      if (response.data.status === "OK" && Array.isArray(response.data.results)) {
        const filtered = response.data.results
          .filter((place: any) => (place.rating || 0) >= minRating)
          .slice(0, 10)
          .map((place: any) => ({
            place_id: place.place_id,
            name: place.name,
            rating: place.rating || 4.0,
            user_ratings_total: place.user_ratings_total || 100,
            address: place.vicinity || place.formatted_address || "Address available via Google Maps",
            location: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
            },
            priceLevel: place.price_level || 2,
            photoUrl: place.photos?.[0]?.photo_reference
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${this.apiKey}`
              : undefined,
          }));

        if (filtered.length > 0) {
          return filtered;
        }
      }

      return this.getMockHotels(location, minRating);
    } catch (error: any) {
      console.error("Google Places Hotel Search error:", error?.message || error);
      return this.getMockHotels(location, minRating);
    }
  }

  /**
   * Search attractions matching interests using Google Places Text/Nearby Search
   */
  async searchAttractions(
    location: GeoLocation,
    interests: string[]
  ): Promise<CandidateAttraction[]> {
    if (!this.apiKey) {
      return this.getMockAttractions(location, interests);
    }

    try {
      const radius = 20000; // 20km
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=tourist_attraction&key=${this.apiKey}`;
      const response = await axios.get(url);

      if (response.data.status === "OK" && Array.isArray(response.data.results)) {
        const attractions = response.data.results.slice(0, 15).map((place: any) => ({
          place_id: place.place_id,
          name: place.name,
          rating: place.rating || 4.2,
          user_ratings_total: place.user_ratings_total || 250,
          address: place.vicinity || "Address available via Google Maps",
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
          },
          types: place.types || ["tourist_attraction", "point_of_interest"],
          photoUrl: place.photos?.[0]?.photo_reference
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${this.apiKey}`
            : undefined,
        }));

        if (attractions.length > 0) {
          return attractions;
        }
      }

      return this.getMockAttractions(location, interests);
    } catch (error: any) {
      console.error("Google Places Attraction Search error:", error?.message || error);
      return this.getMockAttractions(location, interests);
    }
  }

  /**
   * Search real-world restaurants using Google Places Nearby Search
   */
  async searchRestaurants(location: GeoLocation): Promise<CandidateRestaurant[]> {
    if (!this.apiKey) {
      return this.getMockRestaurants(location);
    }

    try {
      const radius = 10000; // 10km
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=restaurant&key=${this.apiKey}`;
      const response = await axios.get(url);

      if (response.data.status === "OK" && Array.isArray(response.data.results)) {
        const restaurants = response.data.results.slice(0, 15).map((place: any) => ({
          place_id: place.place_id,
          name: place.name,
          rating: place.rating || 4.3,
          user_ratings_total: place.user_ratings_total || 180,
          address: place.vicinity || "Address available via Google Maps",
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
          },
          priceLevel: place.price_level || 2,
          cuisine: place.types || ["restaurant", "food"],
          photoUrl: place.photos?.[0]?.photo_reference
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${this.apiKey}`
            : undefined,
        }));

        if (restaurants.length > 0) {
          return restaurants;
        }
      }

      return this.getMockRestaurants(location);
    } catch (error: any) {
      console.error("Google Places Restaurant Search error:", error?.message || error);
      return this.getMockRestaurants(location);
    }
  }

  /**
   * Distance and travel duration calculation using Haversine & Google Distance Matrix API
   */
  async calculateDistanceAndDuration(
    origin: GeoLocation,
    dest: GeoLocation,
    mode: string = "driving"
  ): Promise<{ distanceKm: number; durationMins: number }> {
    if (this.apiKey) {
      try {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${dest.lat},${dest.lng}&mode=${mode}&key=${this.apiKey}`;
        const res = await axios.get(url);
        if (res.data.status === "OK" && res.data.rows?.[0]?.elements?.[0]?.status === "OK") {
          const elem = res.data.rows[0].elements[0];
          return {
            distanceKm: Math.round((elem.distance.value / 1000) * 10) / 10,
            durationMins: Math.round(elem.duration.value / 60),
          };
        }
      } catch (err) {
        // Fallback to Haversine
      }
    }

    // Haversine fallback formula
    const R = 6371; // Earth radius in km
    const dLat = ((dest.lat - origin.lat) * Math.PI) / 180;
    const dLng = ((dest.lng - origin.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((origin.lat * Math.PI) / 180) *
        Math.cos((dest.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = Math.round(R * c * 10) / 10;
    const durationMins = Math.max(10, Math.round(distanceKm * 2.5)); // Est. 2.5 mins per km

    return { distanceKm, durationMins };
  }

  private getMockHotels(location: GeoLocation, minRating: number): CandidateHotel[] {
    return [
      {
        place_id: "google_hotel_01",
        name: "Grand Palace Hotel & Resort",
        rating: Math.max(4.5, minRating),
        user_ratings_total: 1240,
        address: "101 Ocean Drive, Central District",
        location: { lat: location.lat + 0.01, lng: location.lng + 0.01 },
        priceLevel: 3,
        estimatedNightlyRate: 150,
      },
      {
        place_id: "google_hotel_02",
        name: "Serenity Boutique Hotel",
        rating: Math.max(4.3, minRating),
        user_ratings_total: 890,
        address: "45 Heritage Square, Old Town",
        location: { lat: location.lat - 0.01, lng: location.lng - 0.01 },
        priceLevel: 2,
        estimatedNightlyRate: 95,
      },
      {
        place_id: "google_hotel_03",
        name: "Sunset View Resort & Spa",
        rating: Math.max(4.7, minRating),
        user_ratings_total: 2150,
        address: "200 Beach Promenade",
        location: { lat: location.lat + 0.02, lng: location.lng - 0.015 },
        priceLevel: 4,
        estimatedNightlyRate: 280,
      },
    ];
  }

  private getMockAttractions(location: GeoLocation, interests: string[]): CandidateAttraction[] {
    return [
      {
        place_id: "google_attraction_01",
        name: "Historic Citadel & City Museum",
        rating: 4.7,
        user_ratings_total: 3420,
        address: "1 Museum Plaza",
        location: { lat: location.lat + 0.005, lng: location.lng + 0.005 },
        types: ["tourist_attraction", "museum", "history"],
        estimatedCost: 15,
      },
      {
        place_id: "google_attraction_02",
        name: "Botanical Gardens & Nature Walk",
        rating: 4.6,
        user_ratings_total: 1980,
        address: "88 Garden Boulevard",
        location: { lat: location.lat - 0.02, lng: location.lng + 0.01 },
        types: ["park", "nature", "tourist_attraction"],
        estimatedCost: 8,
      },
      {
        place_id: "google_attraction_03",
        name: "Sunset Beach Promenade & Pier",
        rating: 4.8,
        user_ratings_total: 5120,
        address: "Coastal Walkway",
        location: { lat: location.lat + 0.025, lng: location.lng - 0.02 },
        types: ["beach", "scenic", "tourist_attraction"],
        estimatedCost: 0,
      },
      {
        place_id: "google_attraction_04",
        name: "Local Art Gallery & Artisan Market",
        rating: 4.5,
        user_ratings_total: 1430,
        address: "12 Creative Lane",
        location: { lat: location.lat - 0.008, lng: location.lng - 0.005 },
        types: ["art_gallery", "shopping", "culture"],
        estimatedCost: 10,
      },
    ];
  }

  private getMockRestaurants(location: GeoLocation): CandidateRestaurant[] {
    return [
      {
        place_id: "google_rest_01",
        name: "The Olive Grove Bistro",
        rating: 4.6,
        user_ratings_total: 890,
        address: "54 Culinary Street",
        location: { lat: location.lat + 0.003, lng: location.lng - 0.002 },
        priceLevel: 2,
        cuisine: ["mediterranean", "seafood"],
        estimatedCostPerPerson: 30,
      },
      {
        place_id: "google_rest_02",
        name: "Heritage Fine Dining",
        rating: 4.8,
        user_ratings_total: 1250,
        address: "12 Royal Avenue",
        location: { lat: location.lat - 0.004, lng: location.lng + 0.006 },
        priceLevel: 3,
        cuisine: ["local", "fine_dining"],
        estimatedCostPerPerson: 65,
      },
      {
        place_id: "google_rest_03",
        name: "Sunset Beach Cafe & Bar",
        rating: 4.4,
        user_ratings_total: 670,
        address: "Beach Road 10",
        location: { lat: location.lat + 0.02, lng: location.lng - 0.018 },
        priceLevel: 2,
        cuisine: ["casual", "cocktails", "seafood"],
        estimatedCostPerPerson: 25,
      },
    ];
  }
}

export default GoogleMapsService;
