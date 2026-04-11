import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { ProductId } from "../value-objects/product-id.vo";
import { Slug } from "../value-objects/slug.vo";
import { Price } from "../value-objects/price.vo";
import { DomainValidationError, InvalidOperationError } from "../errors";
import { ProductStatus } from "../enums/product-catalog.enums";

// Re-export so consumers importing from this file still work
export { ProductStatus };

// ── Domain Events ──────────────────────────────────────────────────────

export class ProductCreatedEvent extends DomainEvent {
  constructor(
    public readonly productId: string,
    public readonly title: string,
  ) {
    super(productId, 'Product');
  }
  get eventType(): string { return 'product.created'; }
  getPayload(): Record<string, unknown> {
    return { productId: this.productId, title: this.title };
  }
}

export class ProductUpdatedEvent extends DomainEvent {
  constructor(public readonly productId: string) {
    super(productId, 'Product');
  }
  get eventType(): string { return 'product.updated'; }
  getPayload(): Record<string, unknown> {
    return { productId: this.productId };
  }
}

export class ProductPublishedEvent extends DomainEvent {
  constructor(
    public readonly productId: string,
    public readonly publishedAt: Date,
  ) {
    super(productId, 'Product');
  }
  get eventType(): string { return 'product.published'; }
  getPayload(): Record<string, unknown> {
    return { productId: this.productId, publishedAt: this.publishedAt.toISOString() };
  }
}

export class ProductArchivedEvent extends DomainEvent {
  constructor(public readonly productId: string) {
    super(productId, 'Product');
  }
  get eventType(): string { return 'product.archived'; }
  getPayload(): Record<string, unknown> {
    return { productId: this.productId };
  }
}

export class ProductDeletedEvent extends DomainEvent {
  constructor(public readonly productId: string) {
    super(productId, 'Product');
  }
  get eventType(): string { return 'product.deleted'; }
  getPayload(): Record<string, unknown> {
    return { productId: this.productId };
  }
}

// ── Props & DTO ────────────────────────────────────────────────────────

export interface ProductProps {
  id: ProductId;
  title: string;
  slug: Slug;
  brand: string | null;
  shortDesc: string | null;
  longDescHtml: string | null;
  status: ProductStatus;
  publishAt: Date | null;
  countryOfOrigin: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  price: Price;
  priceSgd: Price | null;
  priceUsd: Price | null;
  compareAtPrice: Price | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDTO {
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

// ── Entity ─────────────────────────────────────────────────────────────

export class Product extends AggregateRoot {
  private props: ProductProps;

  private constructor(props: ProductProps) {
    super();
    this.props = props;
  }

  static create(params: {
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
  }): Product {
    if (!params.title || params.title.trim().length === 0) {
      throw new DomainValidationError("Product title is required");
    }

    const productId = ProductId.create();
    const slug = Slug.create(params.title);
    const now = new Date();

    const product = new Product({
      id: productId,
      title: params.title,
      slug,
      brand: params.brand || null,
      shortDesc: params.shortDesc || null,
      longDescHtml: params.longDescHtml || null,
      status: params.status || ProductStatus.DRAFT,
      publishAt: params.publishAt || null,
      countryOfOrigin: params.countryOfOrigin || null,
      seoTitle: params.seoTitle || null,
      seoDescription: params.seoDescription || null,
      price: Price.create(params.price ?? 0),
      priceSgd: params.priceSgd ? Price.create(params.priceSgd) : null,
      priceUsd: params.priceUsd ? Price.create(params.priceUsd) : null,
      compareAtPrice: params.compareAtPrice ? Price.create(params.compareAtPrice) : null,
      createdAt: now,
      updatedAt: now,
    });

    product.addDomainEvent(
      new ProductCreatedEvent(productId.getValue(), params.title),
    );

    return product;
  }

  static fromPersistence(props: ProductProps): Product {
    return new Product(props);
  }

  // ── Getters ────────────────────────────────────────────────────────

  get id(): ProductId { return this.props.id; }
  get title(): string { return this.props.title; }
  get slug(): Slug { return this.props.slug; }
  get brand(): string | null { return this.props.brand; }
  get shortDesc(): string | null { return this.props.shortDesc; }
  get longDescHtml(): string | null { return this.props.longDescHtml; }
  get status(): ProductStatus { return this.props.status; }
  get publishAt(): Date | null { return this.props.publishAt; }
  get countryOfOrigin(): string | null { return this.props.countryOfOrigin; }
  get seoTitle(): string | null { return this.props.seoTitle; }
  get seoDescription(): string | null { return this.props.seoDescription; }
  get price(): Price { return this.props.price; }
  get priceSgd(): Price | null { return this.props.priceSgd; }
  get priceUsd(): Price | null { return this.props.priceUsd; }
  get compareAtPrice(): Price | null { return this.props.compareAtPrice; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // ── Business Logic ─────────────────────────────────────────────────

  updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim().length === 0) {
      throw new DomainValidationError("Title cannot be empty");
    }

    this.props.title = newTitle.trim();
    this.props.slug = Slug.create(newTitle);
    this.touch();
  }

  updateSlug(newSlug: string): void {
    this.props.slug = Slug.fromString(newSlug);
    this.touch();
  }

  updateBrand(newBrand: string | null): void {
    this.props.brand = newBrand?.trim() || null;
    this.touch();
  }

  updateShortDesc(newShortDesc: string | null): void {
    this.props.shortDesc = newShortDesc?.trim() || null;
    this.touch();
  }

  updateLongDescHtml(newLongDescHtml: string | null): void {
    this.props.longDescHtml = newLongDescHtml?.trim() || null;
    this.touch();
  }

  updateSeoInfo(seoTitle: string | null, seoDescription: string | null): void {
    this.props.seoTitle = seoTitle?.trim() || null;
    this.props.seoDescription = seoDescription?.trim() || null;
    this.touch();
  }

  updateCountryOfOrigin(countryOfOrigin: string | null): void {
    this.props.countryOfOrigin = countryOfOrigin?.trim() || null;
    this.touch();
  }

  updatePrice(newPrice: number): void {
    this.props.price = Price.create(newPrice);
    this.touch();
  }

  updatePriceSgd(newPrice: number | null): void {
    this.props.priceSgd = newPrice !== null ? Price.create(newPrice) : null;
    this.touch();
  }

  updatePriceUsd(newPrice: number | null): void {
    this.props.priceUsd = newPrice !== null ? Price.create(newPrice) : null;
    this.touch();
  }

  updateCompareAtPrice(newCompareAtPrice: number | null): void {
    if (newCompareAtPrice !== null) {
      const comparePrice = Price.create(newCompareAtPrice);
      if (!comparePrice.isGreaterThan(this.props.price)) {
        throw new InvalidOperationError("Compare at price must be greater than regular price");
      }
      this.props.compareAtPrice = comparePrice;
    } else {
      this.props.compareAtPrice = null;
    }
    this.touch();
  }

  publish(): void {
    if (this.props.status === ProductStatus.PUBLISHED) {
      return;
    }

    this.props.status = ProductStatus.PUBLISHED;
    this.props.publishAt = new Date();
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new ProductPublishedEvent(this.props.id.getValue(), this.props.publishAt),
    );
  }

  unpublish(): void {
    if (this.props.status === ProductStatus.DRAFT) {
      return;
    }

    this.props.status = ProductStatus.DRAFT;
    this.props.publishAt = null;
    this.touch();
  }

  archive(): void {
    this.props.status = ProductStatus.ARCHIVED;
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new ProductArchivedEvent(this.props.id.getValue()),
    );
  }

  schedulePublication(publishAt: Date): void {
    if (publishAt <= new Date()) {
      throw new InvalidOperationError("Scheduled publication date must be in the future");
    }

    this.props.status = ProductStatus.SCHEDULED;
    this.props.publishAt = publishAt;
    this.touch();
  }

  markDeleted(): void {
    this.addDomainEvent(
      new ProductDeletedEvent(this.props.id.getValue()),
    );
  }

  // ── Validation / Query Methods ─────────────────────────────────────

  isPublished(): boolean {
    return this.props.status === ProductStatus.PUBLISHED;
  }

  isScheduled(): boolean {
    return this.props.status === ProductStatus.SCHEDULED;
  }

  isDraft(): boolean {
    return this.props.status === ProductStatus.DRAFT;
  }

  canBePublished(): boolean {
    return this.props.title.trim().length > 0;
  }

  shouldBePublishedNow(): boolean {
    return (
      this.props.status === ProductStatus.SCHEDULED &&
      this.props.publishAt !== null &&
      this.props.publishAt <= new Date()
    );
  }

  hasDiscount(): boolean {
    return (
      this.props.compareAtPrice !== null &&
      this.props.compareAtPrice.isGreaterThan(this.props.price)
    );
  }

  // ── Internal ───────────────────────────────────────────────────────

  private touch(): void {
    this.props.updatedAt = new Date();
    this.addDomainEvent(new ProductUpdatedEvent(this.props.id.getValue()));
  }

  // ── Serialisation ──────────────────────────────────────────────────

  static toDTO(entity: Product): ProductDTO {
    return {
      id: entity.props.id.getValue(),
      title: entity.props.title,
      slug: entity.props.slug.getValue(),
      brand: entity.props.brand,
      shortDesc: entity.props.shortDesc,
      longDescHtml: entity.props.longDescHtml,
      status: entity.props.status,
      publishAt: entity.props.publishAt,
      countryOfOrigin: entity.props.countryOfOrigin,
      seoTitle: entity.props.seoTitle,
      seoDescription: entity.props.seoDescription,
      price: entity.props.price.getValue(),
      priceSgd: entity.props.priceSgd?.getValue() ?? null,
      priceUsd: entity.props.priceUsd?.getValue() ?? null,
      compareAtPrice: entity.props.compareAtPrice?.getValue() ?? null,
      createdAt: entity.props.createdAt,
      updatedAt: entity.props.updatedAt,
    };
  }

  equals(other: Product): boolean {
    return this.props.id.equals(other.props.id);
  }
}
