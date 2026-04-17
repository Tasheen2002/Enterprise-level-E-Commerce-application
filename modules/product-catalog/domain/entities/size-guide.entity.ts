import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { DomainValidationError } from '../errors';
import { SizeGuideId } from '../value-objects/size-guide-id.vo';
import { Region } from '../enums/product-catalog.enums';

// Domain Events
export class SizeGuideCreatedEvent extends DomainEvent {
  constructor(public readonly sizeGuideId: string, public readonly title: string) {
    super(sizeGuideId, 'SizeGuide');
  }
  get eventType(): string { return 'size-guide.created'; }
  getPayload(): Record<string, unknown> { return { sizeGuideId: this.sizeGuideId, title: this.title }; }
}

export class SizeGuideUpdatedEvent extends DomainEvent {
  constructor(public readonly sizeGuideId: string) {
    super(sizeGuideId, 'SizeGuide');
  }
  get eventType(): string { return 'size-guide.updated'; }
  getPayload(): Record<string, unknown> { return { sizeGuideId: this.sizeGuideId }; }
}

export class SizeGuideDeletedEvent extends DomainEvent {
  constructor(public readonly sizeGuideId: string) {
    super(sizeGuideId, 'SizeGuide');
  }
  get eventType(): string { return 'size-guide.deleted'; }
  getPayload(): Record<string, unknown> { return { sizeGuideId: this.sizeGuideId }; }
}

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

export class SizeGuide extends AggregateRoot {
  private constructor(private props: SizeGuideProps) {
    super();
  }

  static create(params: {
    title: string;
    bodyHtml?: string;
    region: Region;
    category?: string;
  }): SizeGuide {
    const sizeGuideId = SizeGuideId.create();

    const now = new Date();
    const sizeGuide = new SizeGuide({
      id: sizeGuideId,
      title: params.title,
      bodyHtml: params.bodyHtml || null,
      region: params.region,
      category: params.category || null,
      createdAt: now,
      updatedAt: now,
    });

    sizeGuide.addDomainEvent(new SizeGuideCreatedEvent(sizeGuideId.getValue(), params.title));

    return sizeGuide;
  }

  static fromPersistence(props: SizeGuideProps): SizeGuide {
    return new SizeGuide(props);
  }

  // Getters
  get id(): SizeGuideId {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get bodyHtml(): string | null {
    return this.props.bodyHtml;
  }

  get region(): Region {
    return this.props.region;
  }

  get category(): string | null {
    return this.props.category;
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
    this.addDomainEvent(new SizeGuideUpdatedEvent(this.props.id.getValue()));
  }

  updateBodyHtml(newBodyHtml: string | null): void {
    this.props.bodyHtml = newBodyHtml?.trim() || null;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new SizeGuideUpdatedEvent(this.props.id.getValue()));
  }

  updateRegion(newRegion: Region): void {
    this.props.region = newRegion;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new SizeGuideUpdatedEvent(this.props.id.getValue()));
  }

  updateCategory(newCategory: string | null): void {
    if (newCategory && newCategory.trim().length > 100) {
      throw new DomainValidationError('Category cannot be longer than 100 characters');
    }

    this.props.category = newCategory?.trim() || null;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new SizeGuideUpdatedEvent(this.props.id.getValue()));
  }

  // Validation methods
  isForRegion(region: Region): boolean {
    return this.props.region === region;
  }

  isForCategory(category: string): boolean {
    return this.props.category === category;
  }

  isGeneral(): boolean {
    return this.props.category === null;
  }

  hasContent(): boolean {
    return this.props.bodyHtml !== null && this.props.bodyHtml.trim().length > 0;
  }

  // Helper methods for regions
  isUK(): boolean {
    return this.props.region === Region.UK;
  }

  isUS(): boolean {
    return this.props.region === Region.US;
  }

  isEU(): boolean {
    return this.props.region === Region.EU;
  }

  markAsDeleted(): void {
    this.addDomainEvent(new SizeGuideDeletedEvent(this.props.id.getValue()));
  }

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
