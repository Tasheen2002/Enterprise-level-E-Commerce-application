import { PrismaClient } from "@prisma/client";
import {
  INewsletterSubscriptionRepository,
  NewsletterSubscriptionQueryOptions,
  NewsletterSubscriptionFilterOptions,
} from "../../../domain/repositories/newsletter-subscription.repository.js";
import { NewsletterSubscription } from "../../../domain/entities/newsletter-subscription.entity.js";
import {
  SubscriptionId,
  SubscriptionStatus,
} from "../../../domain/value-objects/index.js";

export class NewsletterSubscriptionRepositoryImpl
  implements INewsletterSubscriptionRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  private hydrate(record: any): NewsletterSubscription {
    return NewsletterSubscription.fromDatabaseRow({
      subscription_id: record.id,
      email: record.email,
      status: record.status,
      source: record.source,
      created_at: record.createdAt,
    });
  }

  private dehydrate(subscription: NewsletterSubscription): any {
    const row = subscription.toDatabaseRow();
    return {
      id: row.subscription_id,
      email: row.email,
      status: row.status,
      source: row.source,
      createdAt: row.created_at,
    };
  }

  private buildOrderBy(options?: NewsletterSubscriptionQueryOptions): any {
    if (!options?.sortBy) {
      return { createdAt: "desc" };
    }

    return {
      [options.sortBy]: options.sortOrder || "asc",
    };
  }

  async save(subscription: NewsletterSubscription): Promise<void> {
    const data = this.dehydrate(subscription);
    await this.prisma.newsletterSubscription.create({ data });
  }

  async update(subscription: NewsletterSubscription): Promise<void> {
    const data = this.dehydrate(subscription);
    const { id, ...updateData } = data;
    await this.prisma.newsletterSubscription.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(subscriptionId: SubscriptionId): Promise<void> {
    await this.prisma.newsletterSubscription.delete({
      where: { id: subscriptionId.getValue() },
    });
  }

  async findById(
    subscriptionId: SubscriptionId
  ): Promise<NewsletterSubscription | null> {
    const record = await this.prisma.newsletterSubscription.findUnique({
      where: { id: subscriptionId.getValue() },
    });

    return record ? this.hydrate(record) : null;
  }

  async findByEmail(email: string): Promise<NewsletterSubscription | null> {
    const record = await this.prisma.newsletterSubscription.findUnique({
      where: { email: email.toLowerCase() },
    });

    return record ? this.hydrate(record) : null;
  }

  async findByStatus(
    status: SubscriptionStatus,
    options?: NewsletterSubscriptionQueryOptions
  ): Promise<NewsletterSubscription[]> {
    const records = await this.prisma.newsletterSubscription.findMany({
      where: { status: status.getValue() as any },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findBySource(
    source: string,
    options?: NewsletterSubscriptionQueryOptions
  ): Promise<NewsletterSubscription[]> {
    const records = await this.prisma.newsletterSubscription.findMany({
      where: { source },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findAll(
    options?: NewsletterSubscriptionQueryOptions
  ): Promise<NewsletterSubscription[]> {
    const records = await this.prisma.newsletterSubscription.findMany({
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findWithFilters(
    filters: NewsletterSubscriptionFilterOptions,
    options?: NewsletterSubscriptionQueryOptions
  ): Promise<NewsletterSubscription[]> {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status.getValue() as any;
    }

    if (filters.source) {
      where.source = filters.source;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const records = await this.prisma.newsletterSubscription.findMany({
      where,
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findActiveSubscriptions(
    options?: NewsletterSubscriptionQueryOptions
  ): Promise<NewsletterSubscription[]> {
    const records = await this.prisma.newsletterSubscription.findMany({
      where: { status: "active" },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findUnsubscribed(
    options?: NewsletterSubscriptionQueryOptions
  ): Promise<NewsletterSubscription[]> {
    const records = await this.prisma.newsletterSubscription.findMany({
      where: { status: "unsubscribed" },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findBounced(
    options?: NewsletterSubscriptionQueryOptions
  ): Promise<NewsletterSubscription[]> {
    const records = await this.prisma.newsletterSubscription.findMany({
      where: { status: "bounced" },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async countByStatus(status: SubscriptionStatus): Promise<number> {
    return await this.prisma.newsletterSubscription.count({
      where: { status: status.getValue() as any },
    });
  }

  async countBySource(source: string): Promise<number> {
    return await this.prisma.newsletterSubscription.count({
      where: { source },
    });
  }

  async countActive(): Promise<number> {
    return await this.prisma.newsletterSubscription.count({
      where: { status: "active" },
    });
  }

  async count(
    filters?: NewsletterSubscriptionFilterOptions
  ): Promise<number> {
    if (!filters) {
      return await this.prisma.newsletterSubscription.count();
    }

    const where: any = {};

    if (filters.status) {
      where.status = filters.status.getValue() as any;
    }

    if (filters.source) {
      where.source = filters.source;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return await this.prisma.newsletterSubscription.count({ where });
  }

  async exists(subscriptionId: SubscriptionId): Promise<boolean> {
    const count = await this.prisma.newsletterSubscription.count({
      where: { id: subscriptionId.getValue() },
    });

    return count > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.newsletterSubscription.count({
      where: { email: email.toLowerCase() },
    });

    return count > 0;
  }

  async isEmailSubscribed(email: string): Promise<boolean> {
    const count = await this.prisma.newsletterSubscription.count({
      where: {
        email: email.toLowerCase(),
        status: "active",
      },
    });

    return count > 0;
  }
}
