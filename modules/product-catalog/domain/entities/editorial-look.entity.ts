import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { MediaAssetId } from '../value-objects/media-asset-id.vo';
import { ProductId } from '../value-objects/product-id.vo';
import { DomainValidationError } from '../errors';
import { EditorialLookId } from '../value-objects/editorial-look-id.vo';

// ── Domain Events ──────────────────────────────────────────────────────

export class EditorialLookCreatedEvent extends DomainEvent {
  constructor(
    public readonly lookId: string,
    public readonly title: string,
  ) {
    super(lookId, 'EditorialLook');
  }
  get eventType(): string { return 'editorial-look.created'; }
  getPayload(): Record<string, unknown> {
    return { lookId: this.lookId, title: this.title };
  }
}

export class EditorialLookPublishedEvent extends DomainEvent {
  constructor(public readonly lookId: string) {
    super(lookId, 'EditorialLook');
  }
  get eventType(): string { return 'editorial-look.published'; }
  getPayload(): Record<string, unknown> { return { lookId: this.lookId }; }
}

// ── Props & DTO ────────────────────────────────────────────────────────

export interface EditorialLookProps {
  id: EditorialLookId;
  title: string;
  storyHtml: string | null;
  heroAssetId: MediaAssetId | null;
  publishedAt: Date | null;
  // Keyed by the underlying string id so dedup works (VOs use reference equality in JS Set/Map).
  productIds: Map<string, ProductId>;
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

export interface CreateEditorialLookData {
  title: string;
  storyHtml?: string;
  heroAssetId?: string;
  publishedAt?: Date;
  productIds?: string[];
}

// ── Entity ─────────────────────────────────────────────────────────────

export class EditorialLook extends AggregateRoot {
  private static readonly TITLE_MAX_LENGTH = 200;

  private constructor(private props: EditorialLookProps) {
    super();
    EditorialLook.validate(props);
  }

  static create(params: {
    title: string;
    storyHtml?: string | null;
    heroAssetId?: string | null;
    publishedAt?: Date | null;
    productIds?: string[];
  }): EditorialLook {
    const lookId = EditorialLookId.create();
    const now = new Date();

    const productMap = new Map<string, ProductId>();
    for (const idStr of params.productIds ?? []) {
      const pid = ProductId.fromString(idStr);
      productMap.set(pid.getValue(), pid);
    }

    const look = new EditorialLook({
      id: lookId,
      title: params.title.trim(),
      storyHtml: params.storyHtml?.trim() ?? null,
      heroAssetId: params.heroAssetId ? MediaAssetId.fromString(params.heroAssetId) : null,
      publishedAt: params.publishedAt ?? null,
      productIds: productMap,
      createdAt: now,
      updatedAt: now,
    });

    look.addDomainEvent(
      new EditorialLookCreatedEvent(lookId.getValue(), params.title.trim()),
    );

    return look;
  }

  static fromPersistence(props: EditorialLookProps): EditorialLook {
    return new EditorialLook(props);
  }

  // ── Validation ─────────────────────────────────────────────────────

  // Always-applicable invariants. Run on every construction path.
  private static validate(props: EditorialLookProps): void {
    EditorialLook.validateTitle(props.title);
  }

  private static validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new DomainValidationError('Title cannot be empty');
    }
    if (title.trim().length > EditorialLook.TITLE_MAX_LENGTH) {
      throw new DomainValidationError(
        `Title cannot be longer than ${EditorialLook.TITLE_MAX_LENGTH} characters`,
      );
    }
  }

  // ── Getters ────────────────────────────────────────────────────────

  get id(): EditorialLookId { return this.props.id; }
  get title(): string { return this.props.title; }
  get storyHtml(): string | null { return this.props.storyHtml; }
  get heroAssetId(): MediaAssetId | null { return this.props.heroAssetId; }
  get publishedAt(): Date | null { return this.props.publishedAt; }
  get productIds(): ProductId[] { return Array.from(this.props.productIds.values()); }
  get productCount(): number { return this.props.productIds.size; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // ── Business Logic ─────────────────────────────────────────────────

  updateTitle(newTitle: string): void {
    EditorialLook.validateTitle(newTitle);
    this.props.title = newTitle.trim();
    this.markUpdated();
  }

  updateStoryHtml(newStoryHtml: string | null): void {
    this.props.storyHtml = newStoryHtml?.trim() ?? null;
    this.markUpdated();
  }

  setHeroAsset(assetId: string | null): void {
    this.props.heroAssetId = assetId ? MediaAssetId.fromString(assetId) : null;
    this.markUpdated();
  }

  addProduct(productId: string): void {
    const pid = ProductId.fromString(productId);
    if (this.props.productIds.has(pid.getValue())) return;
    this.props.productIds.set(pid.getValue(), pid);
    this.markUpdated();
  }

  removeProduct(productId: string): void {
    const pid = ProductId.fromString(productId);
    if (this.props.productIds.delete(pid.getValue())) {
      this.markUpdated();
    }
  }

  clearProducts(): void {
    if (this.props.productIds.size === 0) return;
    this.props.productIds.clear();
    this.markUpdated();
  }

  setProducts(productIds: string[]): void {
    this.props.productIds.clear();
    for (const idStr of productIds) {
      const pid = ProductId.fromString(idStr);
      this.props.productIds.set(pid.getValue(), pid);
    }
    this.markUpdated();
  }

  publish(): void {
    if (this.isPublished()) {
      return;
    }
    this.props.publishedAt = new Date();
    this.markUpdated();
    this.addDomainEvent(new EditorialLookPublishedEvent(this.props.id.getValue()));
  }

  unpublish(): void {
    if (this.props.publishedAt === null) return;
    this.props.publishedAt = null;
    this.markUpdated();
  }

  schedulePublication(publishDate: Date): void {
    if (publishDate <= new Date()) {
      throw new DomainValidationError('Scheduled publication date must be in the future');
    }
    this.props.publishedAt = publishDate;
    this.markUpdated();
  }

  // ── Query Methods ──────────────────────────────────────────────────

  isPublished(): boolean {
    return this.props.publishedAt !== null && this.props.publishedAt <= new Date();
  }

  isScheduled(): boolean {
    return this.props.publishedAt !== null && this.props.publishedAt > new Date();
  }

  isDraft(): boolean {
    return this.props.publishedAt === null;
  }

  hasHeroImage(): boolean { return this.props.heroAssetId !== null; }

  hasStory(): boolean {
    return this.props.storyHtml !== null && this.props.storyHtml.trim().length > 0;
  }

  hasProducts(): boolean { return this.props.productIds.size > 0; }

  includesProduct(productId: string): boolean {
    return this.props.productIds.has(ProductId.fromString(productId).getValue());
  }

  canBePublished(): boolean {
    return this.props.title.trim().length > 0 && this.hasHeroImage();
  }

  // ── Internal ───────────────────────────────────────────────────────

  private markUpdated(): void {
    this.props.updatedAt = new Date();
  }

  // ── Serialisation ──────────────────────────────────────────────────

  equals(other: EditorialLook): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: EditorialLook): EditorialLookDTO {
    return {
      id: entity.props.id.getValue(),
      title: entity.props.title,
      storyHtml: entity.props.storyHtml,
      heroAssetId: entity.props.heroAssetId?.getValue() ?? null,
      publishedAt: entity.props.publishedAt?.toISOString() ?? null,
      productIds: Array.from(entity.props.productIds.keys()),
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
