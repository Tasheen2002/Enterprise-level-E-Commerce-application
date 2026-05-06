import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { CategoryId } from '../value-objects/category-id.vo';
import { Slug } from '../value-objects/slug.vo';
import { DomainValidationError, InvalidOperationError } from '../errors';

// ── Domain Events ──────────────────────────────────────────────────────

export class CategoryCreatedEvent extends DomainEvent {
  constructor(
    public readonly categoryId: string,
    public readonly name: string,
  ) {
    super(categoryId, 'Category');
  }
  get eventType(): string { return 'category.created'; }
  getPayload(): Record<string, unknown> {
    return { categoryId: this.categoryId, name: this.name };
  }
}

// ── Props & DTO ────────────────────────────────────────────────────────

export interface CategoryProps {
  id: CategoryId;
  name: string;
  slug: Slug;
  parentId: CategoryId | null;
  position: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  position: number | null;
  createdAt: string;
  updatedAt: string;
}

// ── Entity ─────────────────────────────────────────────────────────────

export class Category extends AggregateRoot {
  private constructor(private props: CategoryProps) {
    super();
    Category.validate(props);
  }

  static create(params: {
    name: string;
    parentId?: string | null;
    position?: number | null;
  }): Category {
    const categoryId = CategoryId.create();
    const slug = Slug.create(params.name);
    const now = new Date();

    const category = new Category({
      id: categoryId,
      name: params.name.trim(),
      slug,
      parentId: params.parentId ? CategoryId.fromString(params.parentId) : null,
      position: params.position ?? null,
      createdAt: now,
      updatedAt: now,
    });

    category.addDomainEvent(
      new CategoryCreatedEvent(categoryId.getValue(), params.name.trim()),
    );

    return category;
  }

  static fromPersistence(props: CategoryProps): Category {
    return new Category(props);
  }

  // ── Validation ─────────────────────────────────────────────────────

  // Always-applicable invariants. Run on every construction path.
  private static validate(props: CategoryProps): void {
    Category.validateName(props.name);
    Category.validatePosition(props.position);
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new DomainValidationError('Category name cannot be empty');
    }
  }

  private static validatePosition(position: number | null): void {
    if (position !== null && position < 0) {
      throw new DomainValidationError('Position cannot be negative');
    }
  }

  // ── Getters ────────────────────────────────────────────────────────

  get id(): CategoryId { return this.props.id; }
  get name(): string { return this.props.name; }
  get slug(): Slug { return this.props.slug; }
  get parentId(): CategoryId | null { return this.props.parentId; }
  get position(): number | null { return this.props.position; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // ── Business Logic ─────────────────────────────────────────────────

  updateName(newName: string): void {
    Category.validateName(newName);
    this.props.name = newName.trim();
    this.props.slug = Slug.create(newName);
    this.markUpdated();
  }

  updateSlug(newSlug: string): void {
    this.props.slug = Slug.fromString(newSlug);
    this.markUpdated();
  }

  moveToParent(parentId: string | null): void {
    if (parentId) {
      const newParentId = CategoryId.fromString(parentId);
      if (this.props.id.equals(newParentId)) {
        throw new InvalidOperationError('Category cannot be its own parent');
      }
      this.props.parentId = newParentId;
    } else {
      this.props.parentId = null;
    }
    this.markUpdated();
  }

  updatePosition(newPosition: number | null): void {
    Category.validatePosition(newPosition);
    this.props.position = newPosition;
    this.markUpdated();
  }

  // ── Query Methods ──────────────────────────────────────────────────

  isRootCategory(): boolean {
    return this.props.parentId === null;
  }

  hasParent(): boolean {
    return this.props.parentId !== null;
  }

  isChildOf(categoryId: CategoryId): boolean {
    return this.props.parentId !== null && this.props.parentId.equals(categoryId);
  }

  // ── Internal ───────────────────────────────────────────────────────

  private markUpdated(): void {
    this.props.updatedAt = new Date();
  }

  // ── Serialisation ──────────────────────────────────────────────────

  equals(other: Category): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: Category): CategoryDTO {
    return {
      id: entity.props.id.getValue(),
      name: entity.props.name,
      slug: entity.props.slug.getValue(),
      parentId: entity.props.parentId?.getValue() ?? null,
      position: entity.props.position,
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
