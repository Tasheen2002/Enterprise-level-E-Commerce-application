import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class CartId extends UuidId {
  private constructor(value: string) {
    super(value, "Cart ID");
  }

  static create(): CartId {
    return new CartId(randomUUID());
  }

  static fromString(value: string): CartId {
    return new CartId(value);
  }
}
