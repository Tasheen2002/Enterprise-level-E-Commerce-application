import { CustomerFeedback } from "../entities/customer-feedback.entity.js";
import { FeedbackId } from "../value-objects/index.js";

export interface FeedbackQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "npsScore" | "csatScore";
  sortOrder?: "asc" | "desc";
}

export interface FeedbackFilterOptions {
  userId?: string;
  ticketId?: string;
  orderId?: string;
  npsCategory?: "promoter" | "passive" | "detractor";
  csatCategory?: "positive" | "neutral" | "negative";
  hasNpsScore?: boolean;
  hasCsatScore?: boolean;
  hasComment?: boolean;
  startDate?: Date;
  endDate?: Date;
  minNpsScore?: number;
  maxNpsScore?: number;
  minCsatScore?: number;
  maxCsatScore?: number;
}

export interface ICustomerFeedbackRepository {
  // Basic CRUD
  save(feedback: CustomerFeedback): Promise<void>;
  update(feedback: CustomerFeedback): Promise<void>;
  delete(feedbackId: FeedbackId): Promise<void>;

  // Finders
  findById(feedbackId: FeedbackId): Promise<CustomerFeedback | null>;
  findByUserId(
    userId: string,
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]>;
  findByTicketId(
    ticketId: string,
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]>;
  findByOrderId(
    orderId: string,
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]>;
  findAll(options?: FeedbackQueryOptions): Promise<CustomerFeedback[]>;

  // Advanced queries
  findWithFilters(
    filters: FeedbackFilterOptions,
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]>;
  findPromoters(options?: FeedbackQueryOptions): Promise<CustomerFeedback[]>;
  findPassives(options?: FeedbackQueryOptions): Promise<CustomerFeedback[]>;
  findDetractors(options?: FeedbackQueryOptions): Promise<CustomerFeedback[]>;
  findPositiveCsat(options?: FeedbackQueryOptions): Promise<CustomerFeedback[]>;
  findNegativeCsat(options?: FeedbackQueryOptions): Promise<CustomerFeedback[]>;
  findWithComments(options?: FeedbackQueryOptions): Promise<CustomerFeedback[]>;
  findRecentByUser(userId: string, limit?: number): Promise<CustomerFeedback[]>;

  // NPS Calculations
  calculateNpsScore(filters?: FeedbackFilterOptions): Promise<number>;
  countPromoters(filters?: FeedbackFilterOptions): Promise<number>;
  countPassives(filters?: FeedbackFilterOptions): Promise<number>;
  countDetractors(filters?: FeedbackFilterOptions): Promise<number>;
  getAverageNpsScore(filters?: FeedbackFilterOptions): Promise<number>;

  // CSAT Calculations
  calculateCsatScore(filters?: FeedbackFilterOptions): Promise<number>;
  getAverageCsatScore(filters?: FeedbackFilterOptions): Promise<number>;
  countPositiveCsat(filters?: FeedbackFilterOptions): Promise<number>;
  countNegativeCsat(filters?: FeedbackFilterOptions): Promise<number>;

  // Counts
  countByUserId(userId: string): Promise<number>;
  countByTicketId(ticketId: string): Promise<number>;
  countByOrderId(orderId: string): Promise<number>;
  count(filters?: FeedbackFilterOptions): Promise<number>;

  // Existence checks
  exists(feedbackId: FeedbackId): Promise<boolean>;
  hasFeedbackForTicket(ticketId: string): Promise<boolean>;
  hasFeedbackForOrder(orderId: string): Promise<boolean>;
}
