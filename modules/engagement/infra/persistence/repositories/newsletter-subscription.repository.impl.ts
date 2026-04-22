import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import {
  INewsletterSubscriptionRepository,
  NewsletterSubscriptionQueryOptions,
  NewsletterSubscriptionFilters,
} from "../../../domain/repositories/newsletter-subscription.repository";
import { NewsletterSubscription } from "../../../domain/entities/newsletter-subscription.entity";
import { SubscriptionId, SubscriptionStatus } from "../../../domain/value-objects";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces";

// ============================================================================
// Database Row Interface
// ============================================================================
interface NewsletterSubscriptionDatabaseRow {
  id: string;
  email: string;
  status: string;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Repository Implementation
// ============================================================================
export class NewsletterSubscriptionRepositoryImpl
  extends PrismaRepository<NewsletterSubscription>
  implements INewsletterSubscriptionRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(row: NewsletterSubscriptionDatabaseRow): NewsletterSubscription {
    return NewsletterSubscription.fromPersistence({
      id: SubscriptionId.fromString(row.id),
      email: row.email,
      status: SubscriptionStatus.fromString(row.status),
      source: row.source || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async save(subscription: NewsletterSubscription): Promise<void> {
    await this.prisma.newsletterSubscription.upsert({
      where: { id: subscription.id.getValue() },
      create: {
        id: subscription.id.getValue(),
        email: subscription.email.toLowerCase(),
        status: subscription.status.getValue(),
        source: subscription.source,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      },
      update: {
        status: subscription.status.getValue(),
        source: subscription.source,
      },
    });
    await this.dispatchEvents(subscription);
  }

  async delete(subscriptionId: SubscriptionId): Promise<void> {
    await this.prisma.newsletterSubscription.delete({
      where: { id: subscriptionId.getValue() },
    });
  }

  async findById(
    subscriptionId: SubscriptionId,
  ): Promise<NewsletterSubscription | null> {
    const record = await this.prisma.newsletterSubscription.findUnique({
      where: { id: subscriptionId.getValue() },
    });

    return record ? this.toEntity(record as NewsletterSubscriptionDatabaseRow) : null;
  }

  async findByEmail(email: string): Promise<NewsletterSubscription | null> {
    const record = await this.prisma.newsletterSubscription.findUnique({
      where: { email: email.toLowerCase() },
    });

    return record ? this.toEntity(record as NewsletterSubscriptionDatabaseRow) : null;
  }

  async findByStatus(
    status: string,
    options?: NewsletterSubscriptionQueryOptions,
  ): Promise<PaginatedResult<NewsletterSubscription>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where = { status };

    const [records, total] = await Promise.all([
      this.prisma.newsletterSubscription.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.newsletterSubscription.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as NewsletterSubscriptionDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findBySource(
    source: string,
    options?: NewsletterSubscriptionQueryOptions,
  ): Promise<PaginatedResult<NewsletterSubscription>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where = { source };

    const [records, total] = await Promise.all([
      this.prisma.newsletterSubscription.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.newsletterSubscription.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as NewsletterSubscriptionDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findAll(
    options?: NewsletterSubscriptionQueryOptions,
  ): Promise<PaginatedResult<NewsletterSubscription>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const [records, total] = await Promise.all([
      this.prisma.newsletterSubscription.findMany({
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.newsletterSubscription.count(),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as NewsletterSubscriptionDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findWithFilters(
    filters: NewsletterSubscriptionFilters,
    options?: NewsletterSubscriptionQueryOptions,
  ): Promise<PaginatedResult<NewsletterSubscription>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where: Prisma.NewsletterSubscriptionWhereInput = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.source ? { source: filters.source } : {}),
      ...((filters.startDate || filters.endDate) ? {
        createdAt: {
          ...(filters.startDate ? { gte: filters.startDate } : {}),
          ...(filters.endDate ? { lte: filters.endDate } : {}),
        },
      } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.newsletterSubscription.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.newsletterSubscription.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as NewsletterSubscriptionDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findActiveSubscriptions(
    options?: NewsletterSubscriptionQueryOptions,
  ): Promise<PaginatedResult<NewsletterSubscription>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where = { status: "active" };

    const [records, total] = await Promise.all([
      this.prisma.newsletterSubscription.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.newsletterSubscription.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as NewsletterSubscriptionDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findUnsubscribed(
    options?: NewsletterSubscriptionQueryOptions,
  ): Promise<PaginatedResult<NewsletterSubscription>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where = { status: "unsubscribed" };

    const [records, total] = await Promise.all([
      this.prisma.newsletterSubscription.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.newsletterSubscription.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as NewsletterSubscriptionDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findBounced(
    options?: NewsletterSubscriptionQueryOptions,
  ): Promise<PaginatedResult<NewsletterSubscription>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where = { status: "bounced" };

    const [records, total] = await Promise.all([
      this.prisma.newsletterSubscription.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.newsletterSubscription.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as NewsletterSubscriptionDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async countByStatus(status: string): Promise<number> {
    return await this.prisma.newsletterSubscription.count({
      where: { status },
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

  async count(filters?: NewsletterSubscriptionFilters): Promise<number> {
    const where: Prisma.NewsletterSubscriptionWhereInput = {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.source ? { source: filters.source } : {}),
      ...((filters?.startDate || filters?.endDate) ? {
        createdAt: {
          ...(filters.startDate ? { gte: filters.startDate } : {}),
          ...(filters.endDate ? { lte: filters.endDate } : {}),
        },
      } : {}),
    };

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
