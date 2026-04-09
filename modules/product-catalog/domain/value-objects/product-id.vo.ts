import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class ProductId extends UuidId {
  private constructor(value: string) {
    super(value, "Product ID");
  }

  static create(): ProductId {
    return new ProductId(randomUUID());
  }

  static fromString(value: string): ProductId {
    return new ProductId(value);
  }

  equals(other: ProductId | null | undefined): boolean {
    return super.equals(other);
  }
}
