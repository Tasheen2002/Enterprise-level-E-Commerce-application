import { AggregateRoot } from '../../../../packages/core/src/domain/aggregate-root';
import { DomainEvent } from '../../../../packages/core/src/domain/events/domain-event';
import { CategoryId } from '../value-objects/category-id.vo';
import { Slug } from '../value-objects/slug.vo';
import { DomainValidationError, InvalidOperationError } from '../errors';

// Domain Events
export class CategoryCreatedEvent extends DomainEvent {
  constructor(public readonly categoryId: string, public readonly name: string) {
    super(categoryId, 'Category');
  }
  get eventType(): string { return 'category.created'; }
  getPayload(): Record<string, unknown> { return { categoryId: this.categoryId, name: this.name }; }
}

export class CategoryUpdatedEvent extends DomainEvent {
  constructor(public readonly categoryId: string) {
    super(categoryId, 'Category');
  }
  get eventType(): string { return 'category.updated'; }
  getPayload(): Record<string, unknown> { return { categoryId: this.categoryId }; }
}

export class CategoryDeletedEvent extends DomainEvent {
  constructor(public readonly categoryId: string) {
    super(categoryId, 'Category');
  }
  get eventType(): string { return 'category.deleted'; }
  getPayload(): Record<string, unknown> { return { categoryId: this.categoryId }; }
}

export interface CategoryProps {
  id: CategoryId;
  name: string;
  slug: Slug;
  parentId: CategoryId | null;
  position: number | null;
}

export class Category extends AggregateRoot {
  private props: CategoryProps;

  private constructor(props: CategoryProps) {
    super();
    this.props = props;
  }

  static create(params: {
    name: string;
    parentId?: string;
    position?: number;
  }): Category {
    const categoryId = CategoryId.create();
    const slug = Slug.create(params.name);

    const category = new Category({
      id: categoryId,
      name: params.name,
      slug,
      parentId: params.parentId ? CategoryId.fromString(params.parentId) : null,
      position: params.position || null,
    });

    category.addDomainEvent(new CategoryCreatedEvent(categoryId.getValue(), params.name));

    return category;
  }

  static fromPersistence(props: CategoryProps): Category {
    return new Category(props);
  }

  // Getters
  get id(): CategoryId {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): Slug {
    return this.props.slug;
  }

  get parentId(): CategoryId | null {
    return this.props.parentId;
  }

  get position(): number | null {
    return this.props.position;
  }

  // Business logic methods
  updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new DomainValidationError('Category name cannot be empty');
    }

    this.props.name = newName.trim();
    this.props.slug = Slug.create(newName);
    this.addDomainEvent(new CategoryUpdatedEvent(this.props.id.getValue()));
  }

  updateSlug(newSlug: string): void {
    const slug = Slug.fromString(newSlug);
    this.props.slug = slug;
    this.addDomainEvent(new CategoryUpdatedEvent(this.props.id.getValue()));
  }

  moveToParent(parentId: string | null): void {
    if (parentId) {
      const newParentId = CategoryId.fromString(parentId);

      // Prevent self-referencing
      if (this.props.id.equals(newParentId)) {
        throw new InvalidOperationError('Category cannot be its own parent');
      }

      this.props.parentId = newParentId;
    } else {
      this.props.parentId = null;
    }
    this.addDomainEvent(new CategoryUpdatedEvent(this.props.id.getValue()));
  }

  updatePosition(newPosition: number | null): void {
    if (newPosition !== null && newPosition < 0) {
      throw new DomainValidationError('Position cannot be negative');
    }
    this.props.position = newPosition;
    this.addDomainEvent(new CategoryUpdatedEvent(this.props.id.getValue()));
  }

  // Validation methods
  isRootCategory(): boolean {
    return this.props.parentId === null;
  }

  hasParent(): boolean {
    return this.props.parentId !== null;
  }

  isChildOf(categoryId: CategoryId): boolean {
    return this.props.parentId !== null && this.props.parentId.equals(categoryId);
  }

  markAsDeleted(): void {
    this.addDomainEvent(new CategoryDeletedEvent(this.props.id.getValue()));
  }

  equals(other: Category): boolean {
    return this.props.id.equals(other.props.id);
  }

  static toDTO(entity: Category): CategoryDTO {
    return {
      id: entity.props.id.getValue(),
      name: entity.props.name,
      slug: entity.props.slug.getValue(),
      parentId: entity.props.parentId?.getValue() || null,
      position: entity.props.position,
    };
  }
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  position: number | null;
}
