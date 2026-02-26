import { CategoryId } from "../value-objects/category-id.vo";
import { Slug } from "../value-objects/slug.vo";
import { DomainValidationError, InvalidOperationError } from "../errors";

export class Category {
  private constructor(
    private readonly id: CategoryId,
    private name: string,
    private slug: Slug,
    private parentId: CategoryId | null,
    private position: number | null,
  ) {}

  static create(data: CreateCategoryData): Category {
    const categoryId = CategoryId.create();
    const slug = Slug.create(data.name);

    return new Category(
      categoryId,
      data.name,
      slug,
      data.parentId ? CategoryId.fromString(data.parentId) : null,
      data.position || null,
    );
  }

  static reconstitute(data: CategoryData): Category {
    return new Category(
      CategoryId.fromString(data.id),
      data.name,
      Slug.fromString(data.slug),
      data.parentId ? CategoryId.fromString(data.parentId) : null,
      data.position,
    );
  }

  static fromDatabaseRow(row: CategoryRow): Category {
    return new Category(
      CategoryId.fromString(row.category_id),
      row.name,
      Slug.fromString(row.slug),
      row.parent_id ? CategoryId.fromString(row.parent_id) : null,
      row.position,
    );
  }

  // Getters
  getId(): CategoryId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getSlug(): Slug {
    return this.slug;
  }

  getParentId(): CategoryId | null {
    return this.parentId;
  }

  getPosition(): number | null {
    return this.position;
  }

  // Business logic methods
  updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new DomainValidationError("Category name cannot be empty");
    }

    this.name = newName.trim();
    this.slug = Slug.create(newName);
  }

  updateSlug(newSlug: string): void {
    const slug = Slug.fromString(newSlug);
    this.slug = slug;
  }

  moveToParent(parentId: string | null): void {
    if (parentId) {
      const newParentId = CategoryId.fromString(parentId);

      // Prevent self-referencing
      if (this.id.equals(newParentId)) {
        throw new InvalidOperationError("Category cannot be its own parent");
      }

      this.parentId = newParentId;
    } else {
      this.parentId = null;
    }
  }

  updatePosition(newPosition: number | null): void {
    if (newPosition !== null && newPosition < 0) {
      throw new DomainValidationError("Position cannot be negative");
    }
    this.position = newPosition;
  }

  // Validation methods
  isRootCategory(): boolean {
    return this.parentId === null;
  }

  hasParent(): boolean {
    return this.parentId !== null;
  }

  isChildOf(categoryId: CategoryId): boolean {
    return this.parentId !== null && this.parentId.equals(categoryId);
  }

  // Convert to data for persistence
  toData(): CategoryData {
    return {
      id: this.id.getValue(),
      name: this.name,
      slug: this.slug.getValue(),
      parentId: this.parentId?.getValue() || null,
      position: this.position,
    };
  }

  toDatabaseRow(): CategoryRow {
    return {
      category_id: this.id.getValue(),
      name: this.name,
      slug: this.slug.getValue(),
      parent_id: this.parentId?.getValue() || null,
      position: this.position,
    };
  }

  equals(other: Category): boolean {
    return this.id.equals(other.id);
  }
}

// Supporting types and interfaces
export interface CreateCategoryData {
  name: string;
  parentId?: string;
  position?: number;
}

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  position: number | null;
}

export interface CategoryRow {
  category_id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  position: number | null;
}
