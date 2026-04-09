import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class CategoryId extends UuidId {
  private constructor(value: string) {
    super(value, "Category ID");
  }

  static create(): CategoryId {
    return new CategoryId(randomUUID());
  }

  static fromString(value: string): CategoryId {
    return new CategoryId(value);
  }

  equals(other: CategoryId | null | undefined): boolean {
    return super.equals(other);
  }
}
