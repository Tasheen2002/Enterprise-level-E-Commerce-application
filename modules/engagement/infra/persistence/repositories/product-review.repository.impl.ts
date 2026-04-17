import { PrismaClient } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import {
  IProductReviewRepository,
  ProductReviewQueryOptions,
  ProductReviewFilters,
} from "../../../domain/repositories/product-review.repository";
import { ProductReview } from "../../../domain/entities/product-review.entity";
import {
  ReviewId,
  ReviewStatus,
  Rating,
} from "../../../domain/value-objects";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces";

// ============================================================================
// Database Row Interface
// ============================================================================
interface ProductReviewDatabaseRow {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Repository Implementation
// ============================================================================
export class ProductReviewRepositoryImpl
  extends PrismaRepository<ProductReview>
  implements IProductReviewRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(row: ProductReviewDatabaseRow): ProductReview {
    return ProductReview.fromPersistence({
      id: ReviewId.fromString(row.id),
      productId: row.productId,
      userId: row.userId,
      rating: Rating.create(row.rating),
      title: row.title || undefined,
      body: row.body || undefined,
      status: ReviewStatus.fromString(row.status),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async save(review: ProductReview): Promise<void> {
    await this.prisma.productReview.upsert({
      where: { id: review.id.getValue() },
      create: {
        id: review.id.getValue(),
        productId: review.productId,
        userId: review.userId,
        rating: review.rating.getValue(),
        title: review.title,
        body: review.body,
        status: review.status.getValue(),
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
      update: {
        rating: review.rating.getValue(),
        title: review.title,
        body: review.body,
        status: review.status.getValue(),
        updatedAt: review.updatedAt,
      },
    });
    await this.dispatchEvents(review);
  }

  async delete(reviewId: ReviewId): Promise<void> {
    await this.prisma.productReview.delete({
      where: { id: reviewId.getValue() },
    });
  }

  async findById(reviewId: ReviewId): Promise<ProductReview | null> {
    const record = await this.prisma.productReview.findUnique({
      where: { id: reviewId.getValue() },
    });

    return record ? this.toEntity(record as ProductReviewDatabaseRow) : null;
  }

  async findByProductId(
    productId: string,
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedResult<ProductReview>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where = { productId };

    const [records, total] = await Promise.all([
      this.prisma.productReview.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.productReview.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as ProductReviewDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findByUserId(
    userId: string,
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedResult<ProductReview>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where = { userId };

    const [records, total] = await Promise.all([
      this.prisma.productReview.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.productReview.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as ProductReviewDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findByStatus(
    status: ReviewStatus,
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedResult<ProductReview>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where = { status: status.getValue() };

    const [records, total] = await Promise.all([
      this.prisma.productReview.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.productReview.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as ProductReviewDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findAll(
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedResult<ProductReview>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const [records, total] = await Promise.all([
      this.prisma.productReview.findMany({
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.productReview.count(),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as ProductReviewDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findWithFilters(
    filters: ProductReviewFilters,
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedResult<ProductReview>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where: any = {};
    if (filters.productId) where.productId = filters.productId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.status) where.status = filters.status.getValue();
    if (filters.minRating || filters.maxRating) {
      where.rating = {};
      if (filters.minRating) where.rating.gte = filters.minRating;
      if (filters.maxRating) where.rating.lte = filters.maxRating;
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [records, total] = await Promise.all([
      this.prisma.productReview.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.productReview.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as ProductReviewDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findApprovedByProductId(
    productId: string,
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedResult<ProductReview>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where = { productId, status: "approved" };

    const [records, total] = await Promise.all([
      this.prisma.productReview.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.productReview.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as ProductReviewDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findPendingReviews(
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedResult<ProductReview>> {
    const {
      limit = 50,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where = { status: "pending" };

    const [records, total] = await Promise.all([
      this.prisma.productReview.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.productReview.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record as ProductReviewDatabaseRow)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findByUserIdAndProductId(
    userId: string,
    productId: string,
  ): Promise<ProductReview | null> {
    const record = await this.prisma.productReview.findFirst({
      where: { userId, productId },
    });

    return record ? this.toEntity(record as ProductReviewDatabaseRow) : null;
  }

  async findRecentByProductId(
    productId: string,
    options?: ProductReviewQueryOptions,
  ): Promise<PaginatedResult<ProductReview>> {
    const {
      limit = 10,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    return this.findByProductId(productId, { limit, offset, sortBy, sortOrder });
  }

  async countByProductId(productId: string): Promise<number> {
    return await this.prisma.productReview.count({
      where: { productId },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return await this.prisma.productReview.count({
      where: { userId },
    });
  }

  async countByStatus(status: ReviewStatus): Promise<number> {
    return await this.prisma.productReview.count({
      where: { status: status.getValue() },
    });
  }

  async count(filters?: ProductReviewFilters): Promise<number> {
    const where: any = {};
    if (filters?.productId) where.productId = filters.productId;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.status) where.status = filters.status.getValue();

    return await this.prisma.productReview.count({ where });
  }

  async getAverageRating(productId: string): Promise<number> {
    const aggregation = await this.prisma.productReview.aggregate({
      where: { productId, status: "approved" },
      _avg: { rating: true },
    });

    return aggregation._avg.rating || 0;
  }

  async getRatingDistribution(
    productId: string,
  ): Promise<Record<number, number>> {
    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    const results = await this.prisma.productReview.groupBy({
      by: ["rating"],
      where: { productId, status: "approved" },
      _count: { id: true },
    });

    results.forEach((res) => {
      distribution[res.rating] = res._count.id;
    });

    return distribution;
  }

  async exists(reviewId: ReviewId): Promise<boolean> {
    const count = await this.prisma.productReview.count({
      where: { id: reviewId.getValue() },
    });

    return count > 0;
  }

  async existsByUserIdAndProductId(
    userId: string,
    productId: string,
  ): Promise<boolean> {
    const count = await this.prisma.productReview.count({
      where: { userId, productId },
    });

    return count > 0;
  }
}
