import { describe, it, expect } from "vitest";
import {
  ProductReview,
  ReviewId,
  Rating,
  ReviewStatus,
  DomainValidationError,
  ReviewNotEditableError,
  ReviewSubmittedEvent,
  ReviewStatusChangedEvent
} from "@modules/engagement/domain";

describe("ProductReview Aggregate Root", () => {
  it("should successfully create a pending review and emit ReviewSubmittedEvent", () => {
    const review = ProductReview.create({
      productId: "product-123",
      userId: "user-456",
      rating: Rating.create(5),
      title: "Excellent Product",
      body: "I really loved this bespoke item!"
    });

    expect(review.id).toBeInstanceOf(ReviewId);
    expect(review.productId).toBe("product-123");
    expect(review.userId).toBe("user-456");
    expect(review.rating.getValue()).toBe(5);
    expect(review.title).toBe("Excellent Product");
    expect(review.body).toBe("I really loved this bespoke item!");
    expect(review.status.equals(ReviewStatus.PENDING)).toBe(true);
    expect(review.isPending()).toBe(true);
    expect(review.isApproved()).toBe(false);

    const events = review.domainEvents;
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(ReviewSubmittedEvent);
    expect((events[0] as ReviewSubmittedEvent).rating).toBe(5);
  });

  it("should throw DomainValidationError if productId is empty", () => {
    expect(() => {
      ProductReview.create({
        productId: "   ",
        userId: "user-456",
        rating: Rating.create(5)
      });
    }).toThrow(DomainValidationError);
  });

  it("should throw DomainValidationError if userId is empty", () => {
    expect(() => {
      ProductReview.create({
        productId: "product-123",
        userId: "   ",
        rating: Rating.create(5)
      });
    }).toThrow(DomainValidationError);
  });

  it("should support updating rating, title, and body while pending", () => {
    const review = ProductReview.create({
      productId: "product-123",
      userId: "user-456",
      rating: Rating.create(3),
      title: "Original Title",
      body: "Original Body"
    });

    review.updateRating(4);
    expect(review.rating.getValue()).toBe(4);

    review.updateTitle("New Title");
    expect(review.title).toBe("New Title");

    review.updateBody("New Body");
    expect(review.body).toBe("New Body");
  });

  it("should support moderation states (approve, reject, flag) and emit ReviewStatusChangedEvent", () => {
    const review = ProductReview.create({
      productId: "product-123",
      userId: "user-456",
      rating: Rating.create(4)
    });

    // 1. Approve
    review.clearDomainEvents();
    review.approve();
    expect(review.isApproved()).toBe(true);
    expect(review.status.equals(ReviewStatus.APPROVED)).toBe(true);

    let events = review.domainEvents;
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(ReviewStatusChangedEvent);
    expect((events[0] as ReviewStatusChangedEvent).oldStatus).toBe("pending");
    expect((events[0] as ReviewStatusChangedEvent).newStatus).toBe("approved");

    // 2. Reject
    review.clearDomainEvents();
    review.reject();
    expect(review.isRejected()).toBe(true);
    expect(review.status.equals(ReviewStatus.REJECTED)).toBe(true);

    // 3. Flag
    review.clearDomainEvents();
    review.flag();
    expect(review.isFlagged()).toBe(true);
    expect(review.status.equals(ReviewStatus.FLAGGED)).toBe(true);
  });

  it("should throw ReviewNotEditableError if editing a review that is not pending", () => {
    const review = ProductReview.create({
      productId: "product-123",
      userId: "user-456",
      rating: Rating.create(4)
    });

    review.approve();

    expect(() => review.updateRating(5)).toThrow(ReviewNotEditableError);
    expect(() => review.updateTitle("Oops")).toThrow(ReviewNotEditableError);
    expect(() => review.updateBody("Oops")).toThrow(ReviewNotEditableError);
  });

  it("should support helper methods for rating checks", () => {
    const positiveReview = ProductReview.create({
      productId: "product-123",
      userId: "user-456",
      rating: Rating.create(5)
    });

    const neutralReview = ProductReview.create({
      productId: "product-123",
      userId: "user-456",
      rating: Rating.create(3)
    });

    const negativeReview = ProductReview.create({
      productId: "product-123",
      userId: "user-456",
      rating: Rating.create(1)
    });

    expect(positiveReview.isPositive()).toBe(true);
    expect(positiveReview.isNegative()).toBe(false);

    expect(neutralReview.isPositive()).toBe(false);
    expect(neutralReview.isNegative()).toBe(false);

    expect(negativeReview.isPositive()).toBe(false);
    expect(negativeReview.isNegative()).toBe(true);

    expect(positiveReview.hasContent()).toBe(false);
    positiveReview.updateTitle("Wow");
    expect(positiveReview.hasContent()).toBe(true);
  });
});
