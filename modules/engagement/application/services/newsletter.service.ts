import {
  INewsletterSubscriptionRepository,
  NewsletterSubscriptionQueryOptions,
  NewsletterSubscriptionFilters,
} from "../../domain/repositories/newsletter-subscription.repository";
import {
  NewsletterSubscription,
  SubscriptionDTO,
} from "../../domain/entities/newsletter-subscription.entity";
import {
  SubscriptionId,
  SubscriptionStatus,
} from "../../domain/value-objects";
import { SubscriptionStatusValue } from "../../domain/value-objects/subscription-status.vo";
import {
  NewsletterSubscriptionNotFoundError,
  InvalidOperationError,
} from "../../domain/errors/engagement.errors";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces";

export interface PaginatedSubscriptionResult {
  items: SubscriptionDTO[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export class NewsletterService {
  constructor(
    private readonly subscriptionRepository: INewsletterSubscriptionRepository,
  ) {}

  async subscribe(email: string, source?: string): Promise<SubscriptionDTO> {
    const existing = await this.subscriptionRepository.findByEmail(email);

    if (existing) {
      if (existing.isUnsubscribed()) {
        existing.activate();
        await this.subscriptionRepository.save(existing);
        return NewsletterSubscription.toDTO(existing);
      }

      if (existing.isActive()) {
        return NewsletterSubscription.toDTO(existing);
      }

      throw new InvalidOperationError(
        "Email address has been marked as bounced or spam. Please contact support.",
      );
    }

    // `NewsletterSubscription.create()` always initialises `status` to
    // `ACTIVE` internally — passing it here is redundant and now rejected
    // by the entity's typed factory signature.
    const subscription = NewsletterSubscription.create({ email, source });
    await this.subscriptionRepository.save(subscription);
    return NewsletterSubscription.toDTO(subscription);
  }

  async getSubscription(subscriptionId: string): Promise<SubscriptionDTO | null> {
    const entity = await this.subscriptionRepository.findById(
      SubscriptionId.fromString(subscriptionId),
    );
    return entity ? NewsletterSubscription.toDTO(entity) : null;
  }

  async getSubscriptionByEmail(email: string): Promise<SubscriptionDTO | null> {
    const entity = await this.subscriptionRepository.findByEmail(email);
    return entity ? NewsletterSubscription.toDTO(entity) : null;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findById(
      SubscriptionId.fromString(subscriptionId),
    );
    if (!subscription) throw new NewsletterSubscriptionNotFoundError(subscriptionId);
    subscription.unsubscribe();
    await this.subscriptionRepository.save(subscription);
  }

  async unsubscribeByEmail(email: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findByEmail(email);
    if (!subscription) throw new NewsletterSubscriptionNotFoundError(email);
    subscription.unsubscribe();
    await this.subscriptionRepository.save(subscription);
  }

  async markAsBounced(subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findById(
      SubscriptionId.fromString(subscriptionId),
    );
    if (!subscription) throw new NewsletterSubscriptionNotFoundError(subscriptionId);
    subscription.bounce();
    await this.subscriptionRepository.save(subscription);
  }

  async markAsSpam(subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findById(
      SubscriptionId.fromString(subscriptionId),
    );
    if (!subscription) throw new NewsletterSubscriptionNotFoundError(subscriptionId);
    subscription.markAsSpam();
    await this.subscriptionRepository.save(subscription);
  }

  async reactivate(subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findById(
      SubscriptionId.fromString(subscriptionId),
    );
    if (!subscription) throw new NewsletterSubscriptionNotFoundError(subscriptionId);
    subscription.activate();
    await this.subscriptionRepository.save(subscription);
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    const subscriptionIdVO = SubscriptionId.fromString(subscriptionId);
    const exists = await this.subscriptionRepository.exists(subscriptionIdVO);
    if (!exists) throw new NewsletterSubscriptionNotFoundError(subscriptionId);
    await this.subscriptionRepository.delete(subscriptionIdVO);
  }

  async getSubscriptionsByStatus(
    status: string,
    options?: NewsletterSubscriptionQueryOptions,
  ): Promise<PaginatedSubscriptionResult> {
    const result = await this.subscriptionRepository.findByStatus(
      status as SubscriptionStatusValue,
      options,
    );
    return this.mapPaginated(result);
  }

  async getSubscriptionsBySource(
    source: string,
    options?: NewsletterSubscriptionQueryOptions,
  ): Promise<PaginatedSubscriptionResult> {
    const result = await this.subscriptionRepository.findBySource(source, options);
    return this.mapPaginated(result);
  }

  async getActiveSubscriptions(
    options?: NewsletterSubscriptionQueryOptions,
  ): Promise<PaginatedSubscriptionResult> {
    const result = await this.subscriptionRepository.findActiveSubscriptions(options);
    return this.mapPaginated(result);
  }

  async getUnsubscribed(
    options?: NewsletterSubscriptionQueryOptions,
  ): Promise<PaginatedSubscriptionResult> {
    const result = await this.subscriptionRepository.findUnsubscribed(options);
    return this.mapPaginated(result);
  }

  async getBounced(
    options?: NewsletterSubscriptionQueryOptions,
  ): Promise<PaginatedSubscriptionResult> {
    const result = await this.subscriptionRepository.findBounced(options);
    return this.mapPaginated(result);
  }

  async getSubscriptionsWithFilters(
    filters: NewsletterSubscriptionFilters,
    options?: NewsletterSubscriptionQueryOptions,
  ): Promise<PaginatedSubscriptionResult> {
    const result = await this.subscriptionRepository.findWithFilters(filters, options);
    return this.mapPaginated(result);
  }

  async getAllSubscriptions(
    options?: NewsletterSubscriptionQueryOptions,
  ): Promise<PaginatedSubscriptionResult> {
    const result = await this.subscriptionRepository.findAll(options);
    return this.mapPaginated(result);
  }

  async countSubscriptions(filters?: NewsletterSubscriptionFilters): Promise<number> {
    return this.subscriptionRepository.count(filters);
  }

  async countSubscriptionsByStatus(status: string): Promise<number> {
    return this.subscriptionRepository.countByStatus(status as SubscriptionStatusValue);
  }

  async countSubscriptionsBySource(source: string): Promise<number> {
    return this.subscriptionRepository.countBySource(source);
  }

  async countActiveSubscriptions(): Promise<number> {
    return this.subscriptionRepository.countActive();
  }

  async subscriptionExists(subscriptionId: string): Promise<boolean> {
    return this.subscriptionRepository.exists(SubscriptionId.fromString(subscriptionId));
  }

  async emailExists(email: string): Promise<boolean> {
    return this.subscriptionRepository.existsByEmail(email);
  }

  async isEmailSubscribed(email: string): Promise<boolean> {
    return this.subscriptionRepository.isEmailSubscribed(email);
  }

  private mapPaginated(
    result: PaginatedResult<NewsletterSubscription>,
  ): PaginatedSubscriptionResult {
    return {
      items: result.items.map(NewsletterSubscription.toDTO),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    };
  }
}
