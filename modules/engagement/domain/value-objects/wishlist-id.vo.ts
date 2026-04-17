import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class WishlistId extends UuidId {
  private constructor(value: string) {
    super(value, "WishlistId");
  }

  static create(): WishlistId {
    return new WishlistId(randomUUID());
  }

  static fromString(value: string): WishlistId {
    return new WishlistId(value);
  }
}
