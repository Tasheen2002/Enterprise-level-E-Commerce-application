import { describe, it, expect } from "vitest";
import { Product } from "@modules/product-catalog/domain/entities/product.entity";
import { ProductStatus } from "@modules/product-catalog/domain/value-objects";
import { DomainValidationError, InvalidOperationError } from "@modules/product-catalog/domain/errors";
import {
  ProductCreatedEvent,
  ProductPublishedEvent,
  ProductArchivedEvent,
} from "@modules/product-catalog/domain/entities/product.entity";

describe("Product Aggregate Root", () => {
  it("should create a product in DRAFT state successfully with valid parameters", () => {
    const product = Product.create({
      title: "Signature Silk Scarf",
      price: 150,
      currency: "GBP",
      brand: "Tasheen",
      shortDesc: "Bespoke silk accessory",
    });

    expect(product.id).toBeDefined();
    expect(product.title).toBe("Signature Silk Scarf");
    expect(product.price.getAmount()).toBe(150);
    expect(product.price.getCurrency().getValue()).toBe("GBP");
    expect(product.brand).toBe("Tasheen");
    expect(product.status).toBe(ProductStatus.DRAFT);
    expect(product.isDraft()).toBe(true);
    expect(product.isPublished()).toBe(false);

    // Verify ProductCreatedEvent is recorded
    const events = product.domainEvents;
    expect(events.length).toBe(1);
    expect(events[0]).toBeInstanceOf(ProductCreatedEvent);
    expect(events[0].eventType).toBe("product.created");
  });

  it("should throw DomainValidationError if product title is empty", () => {
    expect(() =>
      Product.create({
        title: "   ",
        price: 99,
      })
    ).toThrow(DomainValidationError);
  });

  it("should update product title successfully", () => {
    const product = Product.create({ title: "Old Title", price: 100 });
    product.updateTitle("New Title");
    expect(product.title).toBe("New Title");

    expect(() => product.updateTitle("")).toThrow(DomainValidationError);
  });

  it("should enforce compareAtPrice invariants", () => {
    const product = Product.create({ title: "Luxury Coat", price: 500, currency: "USD" });

    // Compare-at price must be higher than current price
    expect(() => product.updateCompareAtPrice(400)).toThrow(InvalidOperationError);

    product.updateCompareAtPrice(600);
    expect(product.compareAtPrice?.getAmount()).toBe(600);
    expect(product.hasDiscount()).toBe(true);

    product.updateCompareAtPrice(null);
    expect(product.compareAtPrice).toBeNull();
    expect(product.hasDiscount()).toBe(false);
  });

  it("should publish a product successfully and record published event", () => {
    const product = Product.create({ title: "Linen Shirt", price: 80 });
    product.clearDomainEvents();

    product.publish();
    expect(product.status).toBe(ProductStatus.PUBLISHED);
    expect(product.isPublished()).toBe(true);
    expect(product.publishAt).not.toBeNull();

    const events = product.domainEvents;
    expect(events.length).toBe(1);
    expect(events[0]).toBeInstanceOf(ProductPublishedEvent);
  });

  it("should unpublish a published product successfully", () => {
    const product = Product.create({ title: "Linen Shirt", price: 80 });
    product.publish();
    expect(product.isPublished()).toBe(true);

    product.unpublish();
    expect(product.status).toBe(ProductStatus.DRAFT);
    expect(product.isDraft()).toBe(true);
    expect(product.publishAt).toBeNull();
  });

  it("should archive a product and record archived event", () => {
    const product = Product.create({ title: "Legacy Boot", price: 200 });
    product.clearDomainEvents();

    product.archive();
    expect(product.status).toBe(ProductStatus.ARCHIVED);

    const events = product.domainEvents;
    expect(events.length).toBe(1);
    expect(events[0]).toBeInstanceOf(ProductArchivedEvent);
  });

  it("should schedule a publication date in the future", () => {
    const product = Product.create({ title: "Pre-order Hat", price: 40 });
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day in future

    product.schedulePublication(futureDate);
    expect(product.status).toBe(ProductStatus.SCHEDULED);
    expect(product.isScheduled()).toBe(true);
    expect(product.publishAt).toEqual(futureDate);

    // Past date should throw
    const pastDate = new Date(Date.now() - 1000);
    expect(() => product.schedulePublication(pastDate)).toThrow(InvalidOperationError);
  });
});
