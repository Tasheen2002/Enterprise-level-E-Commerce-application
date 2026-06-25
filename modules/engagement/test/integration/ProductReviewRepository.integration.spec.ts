import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { ProductReviewRepositoryImpl } from "@modules/engagement/infra/persistence/repositories/product-review.repository.impl";
import { ProductReview } from "@modules/engagement/domain/entities/product-review.entity";
import { Rating } from "@modules/engagement/domain/value-objects";

const prisma = new PrismaClient();

describe("ProductReviewRepositoryImpl Database Integration Tests", () => {
  let repository: ProductReviewRepositoryImpl;
  let productId: string;
  let userId: string;

  beforeAll(() => {
    repository = new ProductReviewRepositoryImpl(prisma);
  });

  beforeEach(async () => {
    // 1. Create a Product
    const pId = randomUUID();
    await prisma.product.create({
      data: {
        id: pId,
        title: "Integration Test Review Product",
        slug: `integration-review-${randomUUID()}`,
        price: 80,
        currency: "USD",
        status: "published"
      }
    });
    productId = pId;

    // 2. Create a User with names (so toEntity can parse reviewerName)
    const uId = randomUUID();
    await prisma.user.create({
      data: {
        id: uId,
        email: `review-user-${randomUUID()}@example.com`,
        role: "CUSTOMER",
        status: "active",
        firstName: "Reviewer",
        lastName: "Smith"
      }
    });
    userId = uId;
  });

  it("should save and retrieve a review successfully", async () => {
    // Arrange
    const review = ProductReview.create({
      productId,
      userId,
      rating: Rating.create(5),
      title: "Splendid",
      body: "Highly recommended."
    });

    // Act
    await repository.save(review);

    // Assert
    const retrieved = await repository.findById(review.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.productId).toBe(productId);
    expect(retrieved!.userId).toBe(userId);
    expect(retrieved!.rating.getValue()).toBe(5);
    expect(retrieved!.title).toBe("Splendid");
    expect(retrieved!.body).toBe("Highly recommended.");
    
    // Access reviewerName via the DTO mapper since there is no public getter
    const dto = ProductReview.toDTO(retrieved!);
    expect(dto.reviewerName).toBe("Reviewer S.");
  });

  it("should support querying reviews by product, user, and status", async () => {
    const review1 = ProductReview.create({
      productId,
      userId,
      rating: Rating.create(5),
      title: "Review 1"
    });
    await repository.save(review1);

    const review2 = ProductReview.create({
      productId,
      userId,
      rating: Rating.create(3),
      title: "Review 2"
    });
    await repository.save(review2);

    // Find by product
    const productRes = await repository.findByProductId(productId);
    expect(productRes.total).toBe(2);

    // Find by user
    const userRes = await repository.findByUserId(userId);
    expect(userRes.total).toBe(2);

    // Find by status
    const statusRes = await repository.findByStatus("pending");
    expect(statusRes.total).toBeGreaterThanOrEqual(2);
  });

  it("should support deleting a review record", async () => {
    const review = ProductReview.create({
      productId,
      userId,
      rating: Rating.create(4)
    });
    await repository.save(review);

    let retrieved = await repository.findById(review.id);
    expect(retrieved).not.toBeNull();

    await repository.delete(review.id);

    retrieved = await repository.findById(review.id);
    expect(retrieved).toBeNull();
  });
});
