import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class SupplierId extends UuidId {
  private constructor(value: string) {
    super(value, "Supplier ID");
  }

  static create(): SupplierId {
    return new SupplierId(randomUUID());
  }

  static fromString(id: string): SupplierId {
    return new SupplierId(id);
  }
}
