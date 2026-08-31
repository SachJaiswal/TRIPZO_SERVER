// =====================================================
// TRIP USAGE ENTITY
// =====================================================

export interface TripUsageEntity {
  user_generated_id: string;
  generations_count: number;
  max_allowed: number;
  last_generated_at: Date;
  created_at: Date;
  updated_at: Date;
}

export class TripUsageModel implements TripUsageEntity {
  user_generated_id: string;
  generations_count: number;
  max_allowed: number;
  last_generated_at: Date;
  created_at: Date;
  updated_at: Date;

  constructor(data: TripUsageEntity) {
    this.user_generated_id = data.user_generated_id;
    this.generations_count = data.generations_count || 0;
    this.max_allowed = data.max_allowed || 10;
    this.last_generated_at = data.last_generated_at || new Date();
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }
}

export default TripUsageModel;
