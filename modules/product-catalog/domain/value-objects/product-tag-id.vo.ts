import { randomUUID } from "crypto";
import { UuidId } from "@/api/src/shared/domain/value-objects/uuid-id.base";

export class ProductTagId extends UuidId {
  private constructor(value: string) {
    super(value, "Product Tag ID");
  }

  static create(): ProductTagId {
    return new ProductTagId(randomUUID());
  }

  static fromString(value: string): ProductTagId {
    return new ProductTagId(value);
  }

  equals(other: ProductTagId | null | undefined): boolean {
    return super.equals(other);
  }
}
