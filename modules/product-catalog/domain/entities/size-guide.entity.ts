import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { DomainValidationError } from '../errors';
import { SizeGuideId } from '../value-objects/size-guide-id.vo';
import { Region } from '../value-objects';

// ── Domain Events ──────────────────────────────────────────────────────

export class SizeGuideCreatedEvent extends DomainEvent {
  constructor(
    public readonly sizeGuideId: string,
    public readonly title: string,
  ) {
    super(sizeGuideId, 'SizeGuide');
  }
  get eventType(): string { return 'size-guide.created'; }
  getPayload(): Record<string, unknown> {
    return { sizeGuideId: this.sizeGuideId, title: this.title };
  }
}

// ── Props & DTO ────────────────────────────────────────────────────────

export interface SizeGuideProps {
  id: SizeGuideId;
  title: string;
  bodyHtml: string | null;
  region: Region;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SizeGuideDTO {
  id: string;
  title: string;
  bodyHtml: string | null;
  region: Region;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Entity ─────────────────────────────────────────────────────────────

export class SizeGuide extends AggregateRoot {
  private static readonly TITLE_MAX_LENGTH = 200;
  private static readonly CATEGORY_MAX_LENGTH = 100;

  private constructor(private props: SizeGuideProps) {
    super();
    SizeGuide.validate(props);
  }

  static create(params: {
    title: string;
    bodyHtml?: string | null;
    region: Region;
    category?: string | null;
  }): SizeGuide {
    const sizeGuideId = SizeGuideId.create();
    const now = new Date();

    const sizeGuide = new SizeGuide({
      id: sizeGuideId,
      title: params.title.trim(),
      bodyHtml: params.bodyHtml?.trim() ?? null,
      region: params.region,
      category: params.category?.trim() ?? null,
      createdAt: now,
      updatedAt: now,
    });

    sizeGuide.addDomainEvent(
      new SizeGuideCreatedEvent(sizeGuideId.getValue(), params.title.trim()),
    );

    return sizeGuide;
  }

  static fromPersistence(props: SizeGuideProps): SizeGuide {
    return new SizeGuide(props);
  }

  // ── Validation ─────────────────────────────────────────────────────

  // Always-applicable invariants. Run on every construction path.
  private static validate(props: SizeGuideProps): void {
    SizeGuide.validateTitle(props.title);
    SizeGuide.validateCategory(props.category);
  }

  private static validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new DomainValidationError('Title cannot be empty');
    }
    if (title.trim().length > SizeGuide.TITLE_MAX_LENGTH) {
      throw new DomainValidationError(
        `Title cannot be longer than ${SizeGuide.TITLE_MAX_LENGTH} characters`,
      );
    }
  }

  private static validateCategory(category: string | null): void {
    if (category !== null && category.trim().length > SizeGuide.CATEGORY_MAX_LENGTH) {
      throw new DomainValidationError(
        `Category cannot be longer than ${SizeGuide.CATEGORY_MAX_LENGTH} characters`,
      );
    }
  }

  // ── Getters ────────────────────────────────────────────────────────

  get id(): SizeGuideId { return this.props.id; }
  get title(): string { return this.props.title; }
  get bodyHtml(): string | null { return this.props.bodyHtml; }
  get region(): Region { return this.props.region; }
  get category(): string | null { return this.props.category; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // ── Business Logic ─────────────────────────────────────────────────

  updateTitle(newTitle: string): void {
    SizeGuide.validateTitle(newTitle);
    this.props.title = newTitle.trim();
    this.markUpdated();
  }

  updateBodyHtml(newBodyHtml: string | null): void {
    this.props.bodyHtml = newBodyHtml?.trim() ?? null;
    this.markUpdated();
  }

  updateRegion(newRegion: Region): void {
    this.props.region = newRegion;
    this.markUpdated();
  }

  updateCategory(newCategory: string | null): void {
    SizeGuide.validateCategory(newCategory);
    this.props.category = newCategory?.trim() ?? null;
    this.markUpdated();
  }

  // ── Query Methods ──────────────────────────────────────────────────

  isForRegion(region: Region): boolean { return this.props.region === region; }
  isForCategory(category: string): boolean { return this.props.category === category; }
  isGeneral(): boolean { return this.props.category === null; }
  hasContent(): boolean {
    return this.props.bodyHtml !== null && this.props.bodyHtml.trim().length > 0;
  }
  isUK(): boolean { return this.props.region === Region.UK; }
  isUS(): boolean { return this.props.region === Region.US; }
  isEU(): boolean { return this.props.region === Region.EU; }

  // ── Internal ───────────────────────────────────────────────────────

  private markUpdated(): void {
    this.props.updatedAt = new Date();
  }

  // ── Serialisation ──────────────────────────────────────────────────

  equals(other: SizeGuide): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: SizeGuide): SizeGuideDTO {
    return {
      id: entity.props.id.getValue(),
      title: entity.props.title,
      bodyHtml: entity.props.bodyHtml,
      region: entity.props.region,
      category: entity.props.category,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
