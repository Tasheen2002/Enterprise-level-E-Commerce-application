import { ProductId } from "../value-objects/product-id.vo";
import { Slug } from "../value-objects/slug.vo";
import { Price } from "../value-objects/price.vo";
import { DomainValidationError, InvalidOperationError } from "../errors";
import { AggregateRoot } from "@/api/src/shared/domain/aggregate-root";

export enum ProductStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  SCHEDULED = "scheduled",
  ARCHIVED = "archived",
}

export class Product extends AggregateRoot {
  private constructor(
    private readonly id: ProductId,
    private title: string,
    private slug: Slug,
    private brand: string | null,
    private shortDesc: string | null,
    private longDescHtml: string | null,
    private status: ProductStatus,
    private publishAt: Date | null,
    private countryOfOrigin: string | null,
    private seoTitle: string | null,
    private seoDescription: string | null,
    private price: Price,
    private priceSgd: Price | null,
    private priceUsd: Price | null,
    private compareAtPrice: Price | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {
    super();
  }

  static create(data: CreateProductData): Product {
    // Domain validation - entity protects its own invariants
    if (!data.title || data.title.trim().length === 0) {
      throw new DomainValidationError("Product title is required");
    }

    const productId = ProductId.create();
    const slug = Slug.create(data.title);
    const now = new Date();

    return new Product(
      productId,
      data.title,
      slug,
      data.brand || null,
      data.shortDesc || null,
      data.longDescHtml || null,
      data.status || ProductStatus.DRAFT,
      data.publishAt || null,
      data.countryOfOrigin || null,
      data.seoTitle || null,
      data.seoDescription || null,
      Price.create(data.price ?? 0),
      data.priceSgd ? Price.create(data.priceSgd) : null,
      data.priceUsd ? Price.create(data.priceUsd) : null,
      data.compareAtPrice ? Price.create(data.compareAtPrice) : null,
      now,
      now,
    );
  }

  static reconstitute(data: ProductData): Product {
    const slug = data.slug
      ? Slug.fromString(data.slug)
      : Slug.create(data.title);
    return new Product(
      ProductId.fromString(data.id),
      data.title,
      slug,
      data.brand,
      data.shortDesc,
      data.longDescHtml,
      data.status,
      data.publishAt,
      data.countryOfOrigin,
      data.seoTitle,
      data.seoDescription,
      Price.create(data.price ?? 0),
      data.priceSgd ? Price.create(data.priceSgd) : null,
      data.priceUsd ? Price.create(data.priceUsd) : null,
      data.compareAtPrice ? Price.create(data.compareAtPrice) : null,
      data.createdAt,
      data.updatedAt,
    );
  }

  static fromDatabaseRow(row: ProductRow): Product {
    // If DB slug is null/empty (old products), generate from title as fallback
    const slug = row.slug ? Slug.fromString(row.slug) : Slug.create(row.title);
    return new Product(
      ProductId.fromString(row.product_id),
      row.title,
      slug,
      row.brand,
      row.short_desc,
      row.long_desc_html,
      row.status,
      row.publish_at,
      row.country_of_origin,
      row.seo_title,
      row.seo_description,
      Price.create(parseFloat(row.price?.toString() ?? "0")),
      row.price_sgd ? Price.create(parseFloat(row.price_sgd.toString())) : null,
      row.price_usd ? Price.create(parseFloat(row.price_usd.toString())) : null,
      row.compare_at_price
        ? Price.create(parseFloat(row.compare_at_price.toString()))
        : null,
      row.created_at,
      row.updated_at,
    );
  }

  // Getters
  getId(): ProductId {
    return this.id;
  }

  getTitle(): string {
    return this.title;
  }

  getSlug(): Slug {
    return this.slug;
  }

  getBrand(): string | null {
    return this.brand;
  }

  getShortDesc(): string | null {
    return this.shortDesc;
  }

  getLongDescHtml(): string | null {
    return this.longDescHtml;
  }

  getStatus(): ProductStatus {
    return this.status;
  }

  getPublishAt(): Date | null {
    return this.publishAt;
  }

  getCountryOfOrigin(): string | null {
    return this.countryOfOrigin;
  }

  getSeoTitle(): string | null {
    return this.seoTitle;
  }

  getSeoDescription(): string | null {
    return this.seoDescription;
  }

  getPrice(): Price {
    return this.price;
  }

  getPriceSgd(): Price | null {
    return this.priceSgd;
  }

  getPriceUsd(): Price | null {
    return this.priceUsd;
  }

  getCompareAtPrice(): Price | null {
    return this.compareAtPrice;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Business logic methods
  updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim().length === 0) {
      throw new DomainValidationError("Title cannot be empty");
    }

    this.title = newTitle.trim();
    this.slug = Slug.create(newTitle);
    this.touch();
  }

  updateSlug(newSlug: string): void {
    const slug = Slug.fromString(newSlug);
    this.slug = slug;
    this.touch();
  }

  updateBrand(newBrand: string | null): void {
    this.brand = newBrand?.trim() || null;
    this.touch();
  }

  updateShortDesc(newShortDesc: string | null): void {
    this.shortDesc = newShortDesc?.trim() || null;
    this.touch();
  }

  updateLongDescHtml(newLongDescHtml: string | null): void {
    this.longDescHtml = newLongDescHtml?.trim() || null;
    this.touch();
  }

  updateSeoInfo(seoTitle: string | null, seoDescription: string | null): void {
    this.seoTitle = seoTitle?.trim() || null;
    this.seoDescription = seoDescription?.trim() || null;
    this.touch();
  }

  updateCountryOfOrigin(countryOfOrigin: string | null): void {
    this.countryOfOrigin = countryOfOrigin?.trim() || null;
    this.touch();
  }

  updatePrice(newPrice: number): void {
    this.price = Price.create(newPrice);
    this.touch();
  }

  updatePriceSgd(newPrice: number | null): void {
    this.priceSgd = newPrice !== null ? Price.create(newPrice) : null;
    this.touch();
  }

  updatePriceUsd(newPrice: number | null): void {
    this.priceUsd = newPrice !== null ? Price.create(newPrice) : null;
    this.touch();
  }

  updateCompareAtPrice(newCompareAtPrice: number | null): void {
    if (newCompareAtPrice !== null) {
      const comparePrice = Price.create(newCompareAtPrice);
      if (!comparePrice.isGreaterThan(this.price)) {
        throw new InvalidOperationError("Compare at price must be greater than regular price");
      }
      this.compareAtPrice = comparePrice;
    } else {
      this.compareAtPrice = null;
    }
    this.touch();
  }

  publish(): void {
    if (this.status === ProductStatus.PUBLISHED) {
      return;
    }

    this.status = ProductStatus.PUBLISHED;
    this.publishAt = new Date();
    this.touch();
  }

  unpublish(): void {
    if (this.status === ProductStatus.DRAFT) {
      return;
    }

    this.status = ProductStatus.DRAFT;
    this.publishAt = null;
    this.touch();
  }

  archive(): void {
    this.status = ProductStatus.ARCHIVED;
    this.touch();
  }

  schedulePublication(publishAt: Date): void {
    if (publishAt <= new Date()) {
      throw new InvalidOperationError("Scheduled publication date must be in the future");
    }

    this.status = ProductStatus.SCHEDULED;
    this.publishAt = publishAt;
    this.touch();
  }

  // Validation methods
  isPublished(): boolean {
    return this.status === ProductStatus.PUBLISHED;
  }

  isScheduled(): boolean {
    return this.status === ProductStatus.SCHEDULED;
  }

  isDraft(): boolean {
    return this.status === ProductStatus.DRAFT;
  }

  canBePublished(): boolean {
    return this.title.trim().length > 0;
  }

  shouldBePublishedNow(): boolean {
    return (
      this.status === ProductStatus.SCHEDULED &&
      this.publishAt !== null &&
      this.publishAt <= new Date()
    );
  }

  hasDiscount(): boolean {
    return (
      this.compareAtPrice !== null &&
      this.compareAtPrice.isGreaterThan(this.price)
    );
  }

  // Internal methods
  private touch(): void {
    this.updatedAt = new Date();
  }

  // Convert to data for persistence
  toData(): ProductData {
    return {
      id: this.id.getValue(),
      title: this.title,
      slug: this.slug.getValue(),
      brand: this.brand,
      shortDesc: this.shortDesc,
      longDescHtml: this.longDescHtml,
      status: this.status,
      publishAt: this.publishAt,
      countryOfOrigin: this.countryOfOrigin,
      seoTitle: this.seoTitle,
      seoDescription: this.seoDescription,
      price: this.price.getValue(),
      priceSgd: this.priceSgd?.getValue() ?? null,
      priceUsd: this.priceUsd?.getValue() ?? null,
      compareAtPrice: this.compareAtPrice?.getValue() ?? null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  toDatabaseRow(): ProductRow {
    return {
      product_id: this.id.getValue(),
      title: this.title,
      slug: this.slug.getValue(),
      brand: this.brand,
      short_desc: this.shortDesc,
      long_desc_html: this.longDescHtml,
      status: this.status,
      publish_at: this.publishAt,
      country_of_origin: this.countryOfOrigin,
      seo_title: this.seoTitle,
      seo_description: this.seoDescription,
      price: this.price.getValue().toString(),
      price_sgd: this.priceSgd?.getValue().toString() ?? null,
      price_usd: this.priceUsd?.getValue().toString() ?? null,
      compare_at_price: this.compareAtPrice?.getValue().toString() ?? null,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }

  equals(other: Product): boolean {
    return this.id.equals(other.id);
  }
}

// Supporting types and interfaces
export interface CreateProductData {
  title: string;
  brand?: string;
  shortDesc?: string;
  longDescHtml?: string;
  status?: ProductStatus;
  publishAt?: Date;
  countryOfOrigin?: string;
  seoTitle?: string;
  seoDescription?: string;
  price?: number;
  priceSgd?: number;
  priceUsd?: number;
  compareAtPrice?: number;
  categoryIds?: string[];
  tags?: string[];
}

export interface ProductData {
  id: string;
  title: string;
  slug: string;
  brand: string | null;
  shortDesc: string | null;
  longDescHtml: string | null;
  status: ProductStatus;
  publishAt: Date | null;
  countryOfOrigin: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  price: number;
  priceSgd: number | null;
  priceUsd: number | null;
  compareAtPrice: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductRow {
  product_id: string;
  title: string;
  slug: string;
  brand: string | null;
  short_desc: string | null;
  long_desc_html: string | null;
  status: ProductStatus;
  publish_at: Date | null;
  country_of_origin: string | null;
  seo_title: string | null;
  seo_description: string | null;
  price: string;
  price_sgd: string | null;
  price_usd: string | null;
  compare_at_price: string | null;
  created_at: Date;
  updated_at: Date;
}
