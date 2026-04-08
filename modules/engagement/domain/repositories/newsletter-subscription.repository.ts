import { NewsletterSubscription } from "../entities/newsletter-subscription.entity.js";
import {
  SubscriptionId,
  SubscriptionStatus,
} from "../value-objects/index.js";

export interface NewsletterSubscriptionQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "email";
  sortOrder?: "asc" | "desc";
}

export interface NewsletterSubscriptionFilterOptions {
  status?: SubscriptionStatus;
  source?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface INewsletterSubscriptionRepository {
  // Basic CRUD
  save(subscription: NewsletterSubscription): Promise<void>;
  update(subscription: NewsletterSubscription): Promise<void>;
  delete(subscriptionId: SubscriptionId): Promise<void>;

  // Finders
  findById(
    subscriptionId: SubscriptionId
  ): Promise<NewsletterSubscription | null>;
  findByEmail(email: string): Promise<NewsletterSubscription | null>;
  findByStatus(
    status: SubscriptionStatus,
    options?: NewsletterSubscriptionQueryOptions
  ): Promise<NewsletterSubscription[]>;
  findBySource(
    source: string,
    options?: NewsletterSubscriptionQueryOptions
  ): Promise<NewsletterSubscription[]>;
  findAll(
    options?: NewsletterSubscriptionQueryOptions
  ): Promise<NewsletterSubscription[]>;

  // Advanced queries
  findWithFilters(
    filters: NewsletterSubscriptionFilterOptions,
    options?: NewsletterSubscriptionQueryOptions
  ): Promise<NewsletterSubscription[]>;
  findActiveSubscriptions(
    options?: NewsletterSubscriptionQueryOptions
  ): Promise<NewsletterSubscription[]>;
  findUnsubscribed(
    options?: NewsletterSubscriptionQueryOptions
  ): Promise<NewsletterSubscription[]>;
  findBounced(
    options?: NewsletterSubscriptionQueryOptions
  ): Promise<NewsletterSubscription[]>;

  // Counts and statistics
  countByStatus(status: SubscriptionStatus): Promise<number>;
  countBySource(source: string): Promise<number>;
  countActive(): Promise<number>;
  count(filters?: NewsletterSubscriptionFilterOptions): Promise<number>;

  // Existence checks
  exists(subscriptionId: SubscriptionId): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;
  isEmailSubscribed(email: string): Promise<boolean>;
}
