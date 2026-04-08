import { PrismaClient } from "@prisma/client";
import {
  IProductReviewRepository,
  ProductReviewQueryOptions,
  ProductReviewFilterOptions,
} from "../../../domain/repositories/product-review.repository.js";
import { ProductReview } from "../../../domain/entities/product-review.entity.js";
import {
  ReviewId,
  ReviewStatus,
} from "../../../domain/value-objects/index.js";

export class ProductReviewRepositoryImpl implements IProductReviewRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private hydrate(record: any): ProductReview {
    return ProductReview.fromDatabaseRow({
      review_id: record.id,
      product_id: record.productId,
      user_id: record.userId,
      rating: record.rating,
      title: record.title,
      body: record.body,
      status: record.status,
      created_at: record.createdAt,
    });
  }

  private dehydrate(review: ProductReview): any {
    const row = review.toDatabaseRow();
    return {
      id: row.review_id,
      productId: row.product_id,
      userId: row.user_id,
      rating: row.rating,
      title: row.title,
      body: row.body,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  private buildOrderBy(options?: ProductReviewQueryOptions): any {
    if (!options?.sortBy) {
      return { createdAt: "desc" };
    }

    return {
      [options.sortBy]: options.sortOrder || "asc",
    };
  }

  async save(review: ProductReview): Promise<void> {
    const data = this.dehydrate(review);
    await this.prisma.productReview.create({ data });
  }

  async update(review: ProductReview): Promise<void> {
    const data = this.dehydrate(review);
    const { id, ...updateData } = data;
    await this.prisma.productReview.update({
      where: { id },
      data: updateData,
    });
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

    return record ? this.hydrate(record) : null;
  }

  async findByProductId(
    productId: string,
    options?: ProductReviewQueryOptions
  ): Promise<ProductReview[]> {
    const records = await this.prisma.productReview.findMany({
      where: { productId },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByUserId(
    userId: string,
    options?: ProductReviewQueryOptions
  ): Promise<ProductReview[]> {
    const records = await this.prisma.productReview.findMany({
      where: { userId },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByStatus(
    status: ReviewStatus,
    options?: ProductReviewQueryOptions
  ): Promise<ProductReview[]> {
    const records = await this.prisma.productReview.findMany({
      where: { status: status.getValue() as any },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findAll(options?: ProductReviewQueryOptions): Promise<ProductReview[]> {
    const records = await this.prisma.productReview.findMany({
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findWithFilters(
    filters: ProductReviewFilterOptions,
    options?: ProductReviewQueryOptions
  ): Promise<ProductReview[]> {
    const where: any = {};

    if (filters.productId) {
      where.productId = filters.productId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.status) {
      where.status = filters.status.getValue() as any;
    }

    if (filters.minRating !== undefined || filters.maxRating !== undefined) {
      where.rating = {};
      if (filters.minRating !== undefined) {
        where.rating.gte = filters.minRating;
      }
      if (filters.maxRating !== undefined) {
        where.rating.lte = filters.maxRating;
      }
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

    const records = await this.prisma.productReview.findMany({
      where,
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findApprovedByProductId(
    productId: string,
    options?: ProductReviewQueryOptions
  ): Promise<ProductReview[]> {
    const records = await this.prisma.productReview.findMany({
      where: {
        productId,
        status: "approved",
      },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findPendingReviews(
    options?: ProductReviewQueryOptions
  ): Promise<ProductReview[]> {
    const records = await this.prisma.productReview.findMany({
      where: { status: "pending" },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByUserIdAndProductId(
    userId: string,
    productId: string
  ): Promise<ProductReview | null> {
    const record = await this.prisma.productReview.findFirst({
      where: {
        userId,
        productId,
      },
    });

    return record ? this.hydrate(record) : null;
  }

  async findRecentByProductId(
    productId: string,
    limit?: number
  ): Promise<ProductReview[]> {
    const records = await this.prisma.productReview.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      take: limit || 10,
    });

    return records.map((record) => this.hydrate(record));
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
      where: { status: status.getValue() as any },
    });
  }

  async count(filters?: ProductReviewFilterOptions): Promise<number> {
    if (!filters) {
      return await this.prisma.productReview.count();
    }

    const where: any = {};

    if (filters.productId) {
      where.productId = filters.productId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.status) {
      where.status = filters.status.getValue() as any;
    }

    if (filters.minRating !== undefined || filters.maxRating !== undefined) {
      where.rating = {};
      if (filters.minRating !== undefined) {
        where.rating.gte = filters.minRating;
      }
      if (filters.maxRating !== undefined) {
        where.rating.lte = filters.maxRating;
      }
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

    return await this.prisma.productReview.count({ where });
  }

  async getAverageRating(productId: string): Promise<number> {
    const result = await this.prisma.productReview.aggregate({
      where: { productId },
      _avg: {
        rating: true,
      },
    });

    return result._avg.rating || 0;
  }

  async getRatingDistribution(productId: string): Promise<Record<number, number>> {
    const reviews = await this.prisma.productReview.groupBy({
      by: ["rating"],
      where: { productId },
      _count: {
        rating: true,
      },
    });

    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    reviews.forEach((r) => {
      distribution[r.rating] = r._count.rating;
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
    productId: string
  ): Promise<boolean> {
    const count = await this.prisma.productReview.count({
      where: {
        userId,
        productId,
      },
    });

    return count > 0;
  }
}
