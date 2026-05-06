import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { DEFAULT_CURRENCY } from '../../../../packages/core/src/domain/value-objects/currency.constants';
import { ProductId } from "../value-objects/product-id.vo";
import { Slug } from "../value-objects/slug.vo";
import { Money } from "../value-objects/money.vo";
import { DomainValidationError, InvalidOperationError } from "../errors";
import { ProductStatus } from "../value-objects";

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
  price: Money;
  priceSgd: Money | null;
  priceUsd: Money | null;
  compareAtPrice: Money | null;
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
  publishAt: string | null;
  countryOfOrigin: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  price: number;
  currency: string;
  priceSgd: number | null;
  priceUsd: number | null;
  compareAtPrice: number | null;
  createdAt: string;
  updatedAt: string;
}

// ── Entity ─────────────────────────────────────────────────────────────

export class Product extends AggregateRoot {
  private constructor(private props: ProductProps) {
    super();
    Product.validate(props);
  }

  static create(params: {
    title: string;
    brand?: string | null;
    shortDesc?: string | null;
    longDescHtml?: string | null;
    status?: ProductStatus;
    publishAt?: Date;
    countryOfOrigin?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    price?: number;
    currency?: string;
    priceSgd?: number | null;
    priceUsd?: number | null;
    compareAtPrice?: number | null;
  }): Product {
    const productId = ProductId.create();
    const slug = Slug.create(params.title);
    const baseCurrency = params.currency ?? DEFAULT_CURRENCY;
    const now = new Date();

    const product = new Product({
      id: productId,
      title: params.title.trim(),
      slug,
      brand: params.brand ?? null,
      shortDesc: params.shortDesc ?? null,
      longDescHtml: params.longDescHtml ?? null,
      status: params.status ?? ProductStatus.DRAFT,
      publishAt: params.publishAt ?? null,
      countryOfOrigin: params.countryOfOrigin ?? null,
      seoTitle: params.seoTitle ?? null,
      seoDescription: params.seoDescription ?? null,
      price: Money.create(params.price ?? 0, baseCurrency),
      priceSgd: params.priceSgd != null ? Money.create(params.priceSgd, "SGD") : null,
      priceUsd: params.priceUsd != null ? Money.create(params.priceUsd, "USD") : null,
      compareAtPrice:
        params.compareAtPrice != null
          ? Money.create(params.compareAtPrice, baseCurrency)
          : null,
      createdAt: now,
      updatedAt: now,
    });

    product.addDomainEvent(
      new ProductCreatedEvent(productId.getValue(), params.title.trim()),
    );

    return product;
  }

  static fromPersistence(props: ProductProps): Product {
    return new Product(props);
  }

  // ── Validation ─────────────────────────────────────────────────────

  // Always-applicable invariants. Run on every construction path.
  private static validate(props: ProductProps): void {
    Product.validateTitle(props.title);
  }

  private static validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new DomainValidationError("Product title is required");
    }
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
  get price(): Money { return this.props.price; }
  get priceSgd(): Money | null { return this.props.priceSgd; }
  get priceUsd(): Money | null { return this.props.priceUsd; }
  get compareAtPrice(): Money | null { return this.props.compareAtPrice; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // ── Business Logic ─────────────────────────────────────────────────

  updateTitle(newTitle: string): void {
    Product.validateTitle(newTitle);
    this.props.title = newTitle.trim();
    this.props.slug = Slug.create(newTitle);
    this.markUpdated();
  }

  updateSlug(newSlug: string): void {
    this.props.slug = Slug.fromString(newSlug);
    this.markUpdated();
  }

  updateBrand(newBrand: string | null): void {
    this.props.brand = newBrand?.trim() ?? null;
    this.markUpdated();
  }

  updateShortDesc(newShortDesc: string | null): void {
    this.props.shortDesc = newShortDesc?.trim() ?? null;
    this.markUpdated();
  }

  updateLongDescHtml(newLongDescHtml: string | null): void {
    this.props.longDescHtml = newLongDescHtml?.trim() ?? null;
    this.markUpdated();
  }

  updateSeoInfo(seoTitle: string | null, seoDescription: string | null): void {
    this.props.seoTitle = seoTitle?.trim() ?? null;
    this.props.seoDescription = seoDescription?.trim() ?? null;
    this.markUpdated();
  }

  updateCountryOfOrigin(countryOfOrigin: string | null): void {
    this.props.countryOfOrigin = countryOfOrigin?.trim() ?? null;
    this.markUpdated();
  }

  updatePrice(newPrice: number): void {
    this.props.price = Money.create(newPrice, this.props.price.getCurrency());
    this.markUpdated();
  }

  updatePriceSgd(newPrice: number | null): void {
    this.props.priceSgd = newPrice !== null ? Money.create(newPrice, "SGD") : null;
    this.markUpdated();
  }

  updatePriceUsd(newPrice: number | null): void {
    this.props.priceUsd = newPrice !== null ? Money.create(newPrice, "USD") : null;
    this.markUpdated();
  }

  updateCompareAtPrice(newCompareAtPrice: number | null): void {
    if (newCompareAtPrice !== null) {
      const comparePrice = Money.create(newCompareAtPrice, this.props.price.getCurrency());
      if (!comparePrice.isGreaterThan(this.props.price)) {
        throw new InvalidOperationError("Compare at price must be greater than regular price");
      }
      this.props.compareAtPrice = comparePrice;
    } else {
      this.props.compareAtPrice = null;
    }
    this.markUpdated();
  }

  publish(): void {
    if (this.props.status === ProductStatus.PUBLISHED) {
      return;
    }
    this.props.status = ProductStatus.PUBLISHED;
    this.props.publishAt = new Date();
    this.markUpdated();
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
    this.markUpdated();
  }

  archive(): void {
    this.props.status = ProductStatus.ARCHIVED;
    this.markUpdated();
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
    this.markUpdated();
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

  private markUpdated(): void {
    this.props.updatedAt = new Date();
  }

  // ── Serialisation ──────────────────────────────────────────────────

  equals(other: Product): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: Product): ProductDTO {
    return {
      id: entity.props.id.getValue(),
      title: entity.props.title,
      slug: entity.props.slug.getValue(),
      brand: entity.props.brand,
      shortDesc: entity.props.shortDesc,
      longDescHtml: entity.props.longDescHtml,
      status: entity.props.status,
      publishAt: entity.props.publishAt?.toISOString() ?? null,
      countryOfOrigin: entity.props.countryOfOrigin,
      seoTitle: entity.props.seoTitle,
      seoDescription: entity.props.seoDescription,
      price: entity.props.price.getAmount(),
      currency: entity.props.price.getCurrency().getValue(),
      priceSgd: entity.props.priceSgd?.getAmount() ?? null,
      priceUsd: entity.props.priceUsd?.getAmount() ?? null,
      compareAtPrice: entity.props.compareAtPrice?.getAmount() ?? null,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
