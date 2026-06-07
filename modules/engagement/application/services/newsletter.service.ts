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
} from "../../domain/value-objects";
import { SubscriptionStatusValue } from "../../domain/value-objects/subscription-status.vo";
import {
  NewsletterSubscriptionNotFoundError,
  InvalidOperationError,
} from "../../domain/errors/engagement.errors";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces";
import { PrismaClient } from "@prisma/client";
import { IEmailService } from "../../../user-management/application/services/iemail.service";

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
    private readonly prisma?: PrismaClient,
    private readonly emailService?: IEmailService,
  ) {}

  async subscribe(email: string, source?: string): Promise<SubscriptionDTO> {
    const existing = await this.subscriptionRepository.findByEmail(email);

    if (existing) {
      if (existing.isUnsubscribed()) {
        existing.activate();
        await this.subscriptionRepository.save(existing);
        await this.generateAndSendWelcomePromo(email);
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
    await this.generateAndSendWelcomePromo(email);
    return NewsletterSubscription.toDTO(subscription);
  }

  private async generateAndSendWelcomePromo(email: string): Promise<void> {
    if (!this.prisma) return;

    // 1. Generate unique coupon code: WELCOME-XXXXXX (6 random letters/numbers)
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "WELCOME-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // 2. Create the promotion record in database
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + 30); // 30-day validity

    try {
      await this.prisma.promotion.create({
        data: {
          code,
          rule: {
            type: "percentage",
            value: 10,
          },
          startsAt,
          endsAt,
          usageLimit: 1,
          status: "active",
        },
      });
      console.log(`[NewsletterService] Created dynamic welcome promo code ${code} for ${email}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[NewsletterService] Failed to create promotion in database:`, msg);
      return;
    }

    // 3. Send welcome email via email service
    if (this.emailService) {
      const subject = "Welcome to Slipperze — 10% OFF Your First Acquisition";
      const text = `Welcome to the Slipperze community! As a gesture of welcome, please enjoy 10% off your next purchase using code: ${code}. Valid for 30 days.`;
      const html = `
        <div style="font-family: serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border: 1px solid #e5e5e5;">
          <h1 style="font-family: serif; font-style: italic; font-weight: normal; color: #1c1917; text-align: center; margin-bottom: 30px;">Slipperze</h1>
          <hr style="border: 0; border-top: 1px solid #e5e5e5; margin-bottom: 30px;" />
          <h2 style="font-family: serif; font-style: italic; font-weight: normal; color: #1c1917; text-align: center; margin-bottom: 20px;">Welcome to the Atelier</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #444; font-family: sans-serif; text-align: center; margin-bottom: 30px;">
            Thank you for subscribing to our curation newsletter. As a gesture of welcome, we invite you to enjoy <strong>10% off</strong> your next acquisition.
          </p>
          <div style="background-color: #f9f8f4; border: 1px dashed #c5a059; padding: 20px; text-align: center; margin-bottom: 30px;">
            <p style="font-family: sans-serif; font-size: 11px; text-transform: uppercase; tracking-widest: 0.1em; color: #666; margin: 0 0 10px 0;">YOUR COUPON CODE</p>
            <p style="font-family: monospace; font-size: 24px; font-weight: bold; color: #1c1917; margin: 0; letter-spacing: 0.05em;">${code}</p>
          </div>
          <p style="font-size: 11px; color: #888; text-align: center; font-family: sans-serif; margin-bottom: 30px;">
            This offer is valid for 30 days from subscription. Excludes already discounted creations.
          </p>
          <hr style="border: 0; border-top: 1px solid #e5e5e5; margin-top: 30px; margin-bottom: 20px;" />
          <p style="font-size: 10px; color: #aaa; text-align: center; font-family: sans-serif; margin: 0;">
            &copy; ${new Date().getFullYear()} Slipperze. All rights reserved.
          </p>
        </div>
      `;

      try {
        await this.emailService.sendEmail({
          to: email,
          subject,
          text,
          html,
        });
        console.log(`[NewsletterService] Welcome email with promo code sent successfully to ${email}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[NewsletterService] Failed to send welcome email to ${email}:`, msg);
      }
    }
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
