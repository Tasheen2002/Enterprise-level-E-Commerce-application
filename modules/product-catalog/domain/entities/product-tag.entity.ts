import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { DomainValidationError } from '../errors';
import { ProductTagId } from '../value-objects/product-tag-id.vo';

// ── Domain Events ──────────────────────────────────────────────────────

export class TagCreatedEvent extends DomainEvent {
  constructor(
    public readonly tagId: string,
    public readonly tag: string,
  ) {
    super(tagId, 'ProductTag');
  }
  get eventType(): string { return 'tag.created'; }
  getPayload(): Record<string, unknown> {
    return { tagId: this.tagId, tag: this.tag };
  }
}

// ── Props & DTO ────────────────────────────────────────────────────────

export interface ProductTagProps {
  id: ProductTagId;
  tag: string;
  kind: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductTagDTO {
  id: string;
  tag: string;
  kind: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Entity ─────────────────────────────────────────────────────────────

export class ProductTag extends AggregateRoot {
  private static readonly TAG_MAX_LENGTH = 100;
  private static readonly KIND_MAX_LENGTH = 50;

  private constructor(private props: ProductTagProps) {
    super();
    ProductTag.validate(props);
  }

  static create(params: { tag: string; kind?: string | null }): ProductTag {
    const tagId = ProductTagId.create();
    const now = new Date();

    const productTag = new ProductTag({
      id: tagId,
      tag: params.tag.trim(),
      kind: params.kind?.trim() ?? null,
      createdAt: now,
      updatedAt: now,
    });

    productTag.addDomainEvent(new TagCreatedEvent(tagId.getValue(), params.tag.trim()));

    return productTag;
  }

  static fromPersistence(props: ProductTagProps): ProductTag {
    return new ProductTag(props);
  }

  // ── Validation ─────────────────────────────────────────────────────

  // Always-applicable invariants. Run on every construction path.
  private static validate(props: ProductTagProps): void {
    ProductTag.validateTag(props.tag);
    ProductTag.validateKind(props.kind);
  }

  private static validateTag(tag: string): void {
    if (!tag || tag.trim().length === 0) {
      throw new DomainValidationError('Tag cannot be empty');
    }
    if (tag.trim().length > ProductTag.TAG_MAX_LENGTH) {
      throw new DomainValidationError(
        `Tag cannot be longer than ${ProductTag.TAG_MAX_LENGTH} characters`,
      );
    }
  }

  private static validateKind(kind: string | null): void {
    if (kind !== null && kind.trim().length > ProductTag.KIND_MAX_LENGTH) {
      throw new DomainValidationError(
        `Kind cannot be longer than ${ProductTag.KIND_MAX_LENGTH} characters`,
      );
    }
  }

  // ── Getters ────────────────────────────────────────────────────────

  get id(): ProductTagId { return this.props.id; }
  get tag(): string { return this.props.tag; }
  get kind(): string | null { return this.props.kind; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // ── Business Logic ─────────────────────────────────────────────────

  updateTag(newTag: string): void {
    ProductTag.validateTag(newTag);
    this.props.tag = newTag.trim();
    this.markUpdated();
  }

  updateKind(newKind: string | null): void {
    ProductTag.validateKind(newKind);
    this.props.kind = newKind?.trim() ?? null;
    this.markUpdated();
  }

  // ── Query Methods ──────────────────────────────────────────────────

  isCategory(): boolean { return this.props.kind === 'category'; }
  isBrand(): boolean { return this.props.kind === 'brand'; }
  isColor(): boolean { return this.props.kind === 'color'; }
  isMaterial(): boolean { return this.props.kind === 'material'; }
  isSize(): boolean { return this.props.kind === 'size'; }
  isStyle(): boolean { return this.props.kind === 'style'; }
  isGeneral(): boolean { return this.props.kind === null || this.props.kind === 'general'; }

  // ── Internal ───────────────────────────────────────────────────────

  private markUpdated(): void {
    this.props.updatedAt = new Date();
  }

  // ── Serialisation ──────────────────────────────────────────────────

  equals(other: ProductTag): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: ProductTag): ProductTagDTO {
    return {
      id: entity.props.id.getValue(),
      tag: entity.props.tag,
      kind: entity.props.kind,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
