import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { MediaAssetId } from '../value-objects/media-asset-id.vo';
import { ProductId } from '../value-objects/product-id.vo';
import { DomainValidationError } from '../errors';
import { EditorialLookId } from '../value-objects/editorial-look-id.vo';

// Domain Events
export class EditorialLookCreatedEvent extends DomainEvent {
  constructor(public readonly lookId: string, public readonly title: string) {
    super(lookId, 'EditorialLook');
  }
  get eventType(): string { return 'editorial-look.created'; }
  getPayload(): Record<string, unknown> { return { lookId: this.lookId, title: this.title }; }
}

export class EditorialLookUpdatedEvent extends DomainEvent {
  constructor(public readonly lookId: string) {
    super(lookId, 'EditorialLook');
  }
  get eventType(): string { return 'editorial-look.updated'; }
  getPayload(): Record<string, unknown> { return { lookId: this.lookId }; }
}

export class EditorialLookPublishedEvent extends DomainEvent {
  constructor(public readonly lookId: string) {
    super(lookId, 'EditorialLook');
  }
  get eventType(): string { return 'editorial-look.published'; }
  getPayload(): Record<string, unknown> { return { lookId: this.lookId }; }
}

export class EditorialLookDeletedEvent extends DomainEvent {
  constructor(public readonly lookId: string) {
    super(lookId, 'EditorialLook');
  }
  get eventType(): string { return 'editorial-look.deleted'; }
  getPayload(): Record<string, unknown> { return { lookId: this.lookId }; }
}

export interface EditorialLookProps {
  id: EditorialLookId;
  title: string;
  storyHtml: string | null;
  heroAssetId: MediaAssetId | null;
  publishedAt: Date | null;
  productIds: Set<ProductId>;
  createdAt: Date;
  updatedAt: Date;
}

export interface EditorialLookDTO {
  id: string;
  title: string;
  storyHtml: string | null;
  heroAssetId: string | null;
  publishedAt: string | null;
  productIds: string[];
  createdAt: string;
  updatedAt: string;
}

export class EditorialLook extends AggregateRoot {
  private constructor(private props: EditorialLookProps) {
    super();
  }

  static create(params: {
    title: string;
    storyHtml?: string;
    heroAssetId?: string;
    publishedAt?: Date;
    productIds?: string[];
  }): EditorialLook {
    const lookId = EditorialLookId.create();

    const now = new Date();
    const look = new EditorialLook({
      id: lookId,
      title: params.title,
      storyHtml: params.storyHtml || null,
      heroAssetId: params.heroAssetId ? MediaAssetId.fromString(params.heroAssetId) : null,
      publishedAt: params.publishedAt || null,
      productIds: new Set(params.productIds?.map((id) => ProductId.fromString(id)) || []),
      createdAt: now,
      updatedAt: now,
    });

    look.addDomainEvent(new EditorialLookCreatedEvent(lookId.getValue(), params.title));

    return look;
  }

  static fromPersistence(props: EditorialLookProps): EditorialLook {
    return new EditorialLook(props);
  }

  // Getters
  get id(): EditorialLookId {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get storyHtml(): string | null {
    return this.props.storyHtml;
  }

  get heroAssetId(): MediaAssetId | null {
    return this.props.heroAssetId;
  }

  get publishedAt(): Date | null {
    return this.props.publishedAt;
  }

  get productIds(): ProductId[] {
    return Array.from(this.props.productIds);
  }

  get productCount(): number {
    return this.props.productIds.size;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods
  updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim().length === 0) {
      throw new DomainValidationError('Title cannot be empty');
    }

    if (newTitle.trim().length > 200) {
      throw new DomainValidationError('Title cannot be longer than 200 characters');
    }

    this.props.title = newTitle.trim();
    this.props.updatedAt = new Date();
    this.addDomainEvent(new EditorialLookUpdatedEvent(this.props.id.getValue()));
  }

  updateStoryHtml(newStoryHtml: string | null): void {
    this.props.storyHtml = newStoryHtml?.trim() || null;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new EditorialLookUpdatedEvent(this.props.id.getValue()));
  }

  setHeroAsset(assetId: string | null): void {
    this.props.heroAssetId = assetId ? MediaAssetId.fromString(assetId) : null;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new EditorialLookUpdatedEvent(this.props.id.getValue()));
  }

  addProduct(productId: string): void {
    const productIdVo = ProductId.fromString(productId);
    this.props.productIds.add(productIdVo);
    this.props.updatedAt = new Date();
    this.addDomainEvent(new EditorialLookUpdatedEvent(this.props.id.getValue()));
  }

  removeProduct(productId: string): void {
    for (const existing of this.props.productIds) {
      if (existing.equals(ProductId.fromString(productId))) {
        this.props.productIds.delete(existing);
        break;
      }
    }
    this.props.updatedAt = new Date();
    this.addDomainEvent(new EditorialLookUpdatedEvent(this.props.id.getValue()));
  }

  clearProducts(): void {
    this.props.productIds.clear();
    this.props.updatedAt = new Date();
    this.addDomainEvent(new EditorialLookUpdatedEvent(this.props.id.getValue()));
  }

  setProducts(productIds: string[]): void {
    this.props.productIds.clear();
    productIds.forEach((id) => {
      this.props.productIds.add(ProductId.fromString(id));
    });
    this.props.updatedAt = new Date();
    this.addDomainEvent(new EditorialLookUpdatedEvent(this.props.id.getValue()));
  }

  publish(): void {
    if (this.isPublished()) {
      return;
    }

    this.props.publishedAt = new Date();
    this.props.updatedAt = new Date();
    this.addDomainEvent(new EditorialLookPublishedEvent(this.props.id.getValue()));
  }

  unpublish(): void {
    this.props.publishedAt = null;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new EditorialLookUpdatedEvent(this.props.id.getValue()));
  }

  schedulePublication(publishDate: Date): void {
    this.props.publishedAt = publishDate;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new EditorialLookUpdatedEvent(this.props.id.getValue()));
  }

  // Validation methods
  isPublished(): boolean {
    return this.props.publishedAt !== null && this.props.publishedAt <= new Date();
  }

  isScheduled(): boolean {
    return this.props.publishedAt !== null && this.props.publishedAt > new Date();
  }

  isDraft(): boolean {
    return this.props.publishedAt === null;
  }

  hasHeroImage(): boolean {
    return this.props.heroAssetId !== null;
  }

  hasStory(): boolean {
    return this.props.storyHtml !== null && this.props.storyHtml.trim().length > 0;
  }

  hasProducts(): boolean {
    return this.props.productIds.size > 0;
  }

  includesProduct(productId: string): boolean {
    const productIdVo = ProductId.fromString(productId);
    return Array.from(this.props.productIds).some((id) => id.equals(productIdVo));
  }

  canBePublished(): boolean {
    return this.props.title.trim().length > 0 && this.hasHeroImage();
  }

  markAsDeleted(): void {
    this.addDomainEvent(new EditorialLookDeletedEvent(this.props.id.getValue()));
  }

  equals(other: EditorialLook): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: EditorialLook): EditorialLookDTO {
    return {
      id: entity.props.id.getValue(),
      title: entity.props.title,
      storyHtml: entity.props.storyHtml,
      heroAssetId: entity.props.heroAssetId?.getValue() || null,
      publishedAt: entity.props.publishedAt?.toISOString() || null,
      productIds: Array.from(entity.props.productIds).map((id) => id.getValue()),
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}

export interface CreateEditorialLookData {
  title: string;
  storyHtml?: string;
  heroAssetId?: string;
  publishedAt?: Date;
  productIds?: string[];
}
