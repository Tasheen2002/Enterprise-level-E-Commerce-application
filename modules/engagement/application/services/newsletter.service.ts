import {
  INewsletterSubscriptionRepository,
  NewsletterSubscriptionQueryOptions,
  NewsletterSubscriptionFilterOptions,
} from "../../domain/repositories/newsletter-subscription.repository.js";
import { NewsletterSubscription } from "../../domain/entities/newsletter-subscription.entity.js";
import {
  SubscriptionId,
  SubscriptionStatus,
} from "../../domain/value-objects/index.js";
import { IEmailService } from "../../../shared/domain/ports/email.service.port.js";

export class NewsletterService {
  constructor(
    private readonly subscriptionRepository: INewsletterSubscriptionRepository,
    private readonly emailService: IEmailService
  ) {}

  async subscribe(
    email: string,
    source?: string
  ): Promise<NewsletterSubscription> {
    // Check if email is already subscribed
    const existing = await this.subscriptionRepository.findByEmail(email);

    if (existing) {
      // If previously unsubscribed, reactivate
      if (existing.isUnsubscribed()) {
        existing.activate();
        await this.subscriptionRepository.update(existing);

        // Send welcome email on re-subscription too
        this.emailService.sendWelcomeEmail(email).catch((err: unknown) => {
          console.error(
            `[NEWSLETTER] Failed to send welcome email to ${email}`,
            err
          );
        });

        return existing;
      }

      // If already active, just return it
      if (existing.isActive()) {
        return existing;
      }

      // For bounced or spam, create new subscription
      throw new Error(
        "Email address has been marked as bounced or spam. Please contact support."
      );
    }

    const subscription = NewsletterSubscription.create({
      email,
      source,
    });

    await this.subscriptionRepository.save(subscription);

    // Send welcome email asynchronously (fire and forget)
    this.emailService.sendWelcomeEmail(email).catch((err: unknown) => {
      console.error(
        `[NEWSLETTER] Failed to send welcome email to ${email}`,
        err
      );
    });

    return subscription;
  }

  async getSubscription(
    subscriptionId: string
  ): Promise<NewsletterSubscription | null> {
    return await this.subscriptionRepository.findById(
      SubscriptionId.fromString(subscriptionId)
    );
  }

  async getSubscriptionByEmail(
    email: string
  ): Promise<NewsletterSubscription | null> {
    return await this.subscriptionRepository.findByEmail(email);
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findById(
      SubscriptionId.fromString(subscriptionId)
    );

    if (!subscription) {
      throw new Error(`Subscription with ID ${subscriptionId} not found`);
    }

    subscription.unsubscribe();
    await this.subscriptionRepository.update(subscription);
  }

  async unsubscribeByEmail(email: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findByEmail(email);

    if (!subscription) {
      throw new Error(`No subscription found for email: ${email}`);
    }

    subscription.unsubscribe();
    await this.subscriptionRepository.update(subscription);
  }

  async markAsBounced(subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findById(
      SubscriptionId.fromString(subscriptionId)
    );

    if (!subscription) {
      throw new Error(`Subscription with ID ${subscriptionId} not found`);
    }

    subscription.bounce();
    await this.subscriptionRepository.update(subscription);
  }

  async markAsSpam(subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findById(
      SubscriptionId.fromString(subscriptionId)
    );

    if (!subscription) {
      throw new Error(`Subscription with ID ${subscriptionId} not found`);
    }

    subscription.markAsSpam();
    await this.subscriptionRepository.update(subscription);
  }

  async reactivate(subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findById(
      SubscriptionId.fromString(subscriptionId)
    );

    if (!subscription) {
      throw new Error(`Subscription with ID ${subscriptionId} not found`);
    }

    subscription.activate();
    await this.subscriptionRepository.update(subscription);
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    const exists = await this.subscriptionRepository.exists(
      SubscriptionId.fromString(subscriptionId)
    );

    if (!exists) {
      throw new Error(`Subscription with ID ${subscriptionId} not found`);
    }

    await this.subscriptionRepository.delete(
      SubscriptionId.fromString(subscriptionId)
    );
  }

  async getSubscriptionsByStatus(
    status: SubscriptionStatus,
    options?: NewsletterSubscriptionQueryOptions
  ): Promise<NewsletterSubscription[]> {
    return await this.subscriptionRepository.findByStatus(status, options);
  }

  async getSubscriptionsBySource(
    source: string,
    options?: NewsletterSubscriptionQueryOptions
  ): Promise<NewsletterSubscription[]> {
    return await this.subscriptionRepository.findBySource(source, options);
  }

  async getActiveSubscriptions(
    options?: NewsletterSubscriptionQueryOptions
  ): Promise<NewsletterSubscription[]> {
    return await this.subscriptionRepository.findActiveSubscriptions(options);
  }

  async getUnsubscribed(
    options?: NewsletterSubscriptionQueryOptions
  ): Promise<NewsletterSubscription[]> {
    return await this.subscriptionRepository.findUnsubscribed(options);
  }

  async getBounced(
    options?: NewsletterSubscriptionQueryOptions
  ): Promise<NewsletterSubscription[]> {
    return await this.subscriptionRepository.findBounced(options);
  }

  async getSubscriptionsWithFilters(
    filters: NewsletterSubscriptionFilterOptions,
    options?: NewsletterSubscriptionQueryOptions
  ): Promise<NewsletterSubscription[]> {
    return await this.subscriptionRepository.findWithFilters(filters, options);
  }

  async getAllSubscriptions(
    options?: NewsletterSubscriptionQueryOptions
  ): Promise<NewsletterSubscription[]> {
    return await this.subscriptionRepository.findAll(options);
  }

  async countSubscriptions(
    filters?: NewsletterSubscriptionFilterOptions
  ): Promise<number> {
    return await this.subscriptionRepository.count(filters);
  }

  async countSubscriptionsByStatus(
    status: SubscriptionStatus
  ): Promise<number> {
    return await this.subscriptionRepository.countByStatus(status);
  }

  async countSubscriptionsBySource(source: string): Promise<number> {
    return await this.subscriptionRepository.countBySource(source);
  }

  async countActiveSubscriptions(): Promise<number> {
    return await this.subscriptionRepository.countActive();
  }

  async subscriptionExists(subscriptionId: string): Promise<boolean> {
    return await this.subscriptionRepository.exists(
      SubscriptionId.fromString(subscriptionId)
    );
  }

  async emailExists(email: string): Promise<boolean> {
    return await this.subscriptionRepository.existsByEmail(email);
  }

  async isEmailSubscribed(email: string): Promise<boolean> {
    return await this.subscriptionRepository.isEmailSubscribed(email);
  }
}
