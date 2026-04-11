import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { DomainValidationError } from '../errors';
import { ProductTagId } from '../value-objects/product-tag-id.vo';

export { ProductTagId };

// Domain Events
export class TagCreatedEvent extends DomainEvent {
  constructor(public readonly tagId: string, public readonly tag: string) {
    super(tagId, 'ProductTag');
  }
  get eventType(): string { return 'tag.created'; }
  getPayload(): Record<string, unknown> { return { tagId: this.tagId, tag: this.tag }; }
}

export class TagUpdatedEvent extends DomainEvent {
  constructor(public readonly tagId: string) {
    super(tagId, 'ProductTag');
  }
  get eventType(): string { return 'tag.updated'; }
  getPayload(): Record<string, unknown> { return { tagId: this.tagId }; }
}

export class TagDeletedEvent extends DomainEvent {
  constructor(public readonly tagId: string) {
    super(tagId, 'ProductTag');
  }
  get eventType(): string { return 'tag.deleted'; }
  getPayload(): Record<string, unknown> { return { tagId: this.tagId }; }
}

export interface ProductTagProps {
  id: ProductTagId;
  tag: string;
  kind: string | null;
}

export class ProductTag extends AggregateRoot {
  private props: ProductTagProps;

  private constructor(props: ProductTagProps) {
    super();
    this.props = props;
  }

  static create(params: { tag: string; kind?: string }): ProductTag {
    const tagId = ProductTagId.create();

    const productTag = new ProductTag({
      id: tagId,
      tag: params.tag,
      kind: params.kind || null,
    });

    productTag.addDomainEvent(new TagCreatedEvent(tagId.getValue(), params.tag));

    return productTag;
  }

  static fromPersistence(props: ProductTagProps): ProductTag {
    return new ProductTag(props);
  }

  // Getters
  get id(): ProductTagId {
    return this.props.id;
  }

  get tag(): string {
    return this.props.tag;
  }

  get kind(): string | null {
    return this.props.kind;
  }

  // Business logic methods
  updateTag(newTag: string): void {
    if (!newTag || newTag.trim().length === 0) {
      throw new DomainValidationError('Tag cannot be empty');
    }

    if (newTag.trim().length > 100) {
      throw new DomainValidationError('Tag cannot be longer than 100 characters');
    }

    this.props.tag = newTag.trim();
    this.addDomainEvent(new TagUpdatedEvent(this.props.id.getValue()));
  }

  updateKind(newKind: string | null): void {
    if (newKind && newKind.trim().length > 50) {
      throw new DomainValidationError('Kind cannot be longer than 50 characters');
    }

    this.props.kind = newKind?.trim() || null;
    this.addDomainEvent(new TagUpdatedEvent(this.props.id.getValue()));
  }

  // Validation methods
  isCategory(): boolean {
    return this.props.kind === 'category';
  }

  isBrand(): boolean {
    return this.props.kind === 'brand';
  }

  isColor(): boolean {
    return this.props.kind === 'color';
  }

  isMaterial(): boolean {
    return this.props.kind === 'material';
  }

  isSize(): boolean {
    return this.props.kind === 'size';
  }

  isStyle(): boolean {
    return this.props.kind === 'style';
  }

  isGeneral(): boolean {
    return this.props.kind === null || this.props.kind === 'general';
  }

  markAsDeleted(): void {
    this.addDomainEvent(new TagDeletedEvent(this.props.id.getValue()));
  }

  equals(other: ProductTag): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: ProductTag): ProductTagDTO {
    return {
      id: entity.props.id.getValue(),
      tag: entity.props.tag,
      kind: entity.props.kind,
    };
  }
}

export interface ProductTagDTO {
  id: string;
  tag: string;
  kind: string | null;
}
