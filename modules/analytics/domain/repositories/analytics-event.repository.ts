import { AnalyticsEvent } from '../entities/analytics-event.entity';

export interface AnalyticsEventRepository {
  /**
   * Save a single analytics event
   */
  save(event: AnalyticsEvent): Promise<void>;

  /**
   * Save multiple analytics events in a batch
   */
  saveMany(events: AnalyticsEvent[]): Promise<void>;

  /**
   * Find events by product ID
   */
  findByProductId(
    productId: string,
    variantId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsEvent[]>;

  /**
   * Find all events for a session
   */
  findBySessionId(sessionId: string, limit?: number): Promise<AnalyticsEvent[]>;

  /**
   * Find events by user ID
   */
  findByUserId(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsEvent[]>;

  /**
   * Find events by guest token
   */
  findByGuestToken(
    guestToken: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsEvent[]>;
}
