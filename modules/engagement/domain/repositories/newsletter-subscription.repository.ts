import { NewsletterSubscription } from "../entities/newsletter-subscription.entity";
import { SubscriptionId } from "../value-objects";
import { SubscriptionStatusValue } from "../value-objects/subscription-status.vo";
import {
  PaginatedResult,
  PaginationOptions,
} from "../../../../packages/core/src/domain/interfaces";

// ============================================================================
// 2. Filters interface
// ============================================================================
export interface NewsletterSubscriptionFilters {
  status?: SubscriptionStatusValue;
  source?: string;
  startDate?: Date;
  endDate?: Date;
}

// ============================================================================
// 3. Repository Interface
// ============================================================================
export interface INewsletterSubscriptionRepository {
  // Basic CRUD
  save(subscription: NewsletterSubscription): Promise<void>;
  delete(subscriptionId: SubscriptionId): Promise<void>;

  // Finders
  findById(
    subscriptionId: SubscriptionId,
  ): Promise<NewsletterSubscription | null>;
  findByEmail(email: string): Promise<NewsletterSubscription | null>;
  findByStatus(
    status: SubscriptionStatusValue,
    options?: NewsletterSubscriptionQueryOptions,
  ): Promise<PaginatedResult<NewsletterSubscription>>;
  findBySource(
    source: string,
    options?: NewsletterSubscriptionQueryOptions,
  ): Promise<PaginatedResult<NewsletterSubscription>>;
  findAll(
    options?: NewsletterSubscriptionQueryOptions,
  ): Promise<PaginatedResult<NewsletterSubscription>>;

  // Advanced queries
  findWithFilters(
    filters: NewsletterSubscriptionFilters,
    options?: NewsletterSubscriptionQueryOptions,
  ): Promise<PaginatedResult<NewsletterSubscription>>;
  findActiveSubscriptions(
    options?: NewsletterSubscriptionQueryOptions,
  ): Promise<PaginatedResult<NewsletterSubscription>>;
  findUnsubscribed(
    options?: NewsletterSubscriptionQueryOptions,
  ): Promise<PaginatedResult<NewsletterSubscription>>;
  findBounced(
    options?: NewsletterSubscriptionQueryOptions,
  ): Promise<PaginatedResult<NewsletterSubscription>>;

  // Counts and statistics
  countByStatus(status: SubscriptionStatusValue): Promise<number>;
  countBySource(source: string): Promise<number>;
  countActive(): Promise<number>;
  count(filters?: NewsletterSubscriptionFilters): Promise<number>;

  // Existence checks
  exists(subscriptionId: SubscriptionId): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;
  isEmailSubscribed(email: string): Promise<boolean>;
}

// ============================================================================
// 4. Query Options interface
// ============================================================================
export interface NewsletterSubscriptionQueryOptions extends PaginationOptions {
  sortBy?: "createdAt" | "email";
  sortOrder?: "asc" | "desc";
}
