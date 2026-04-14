import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class CartOwnerId extends UuidId {
  private constructor(value: string) {
    super(value, "Cart Owner ID");
  }

  static create(): CartOwnerId {
    return new CartOwnerId(randomUUID());
  }

  static fromString(value: string): CartOwnerId {
    return new CartOwnerId(value);
  }
}
