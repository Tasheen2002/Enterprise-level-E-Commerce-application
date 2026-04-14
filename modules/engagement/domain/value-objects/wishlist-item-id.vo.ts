import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class WishlistItemId extends UuidId {
  private constructor(value: string) {
    super(value, "WishlistItemId");
  }

  static create(): WishlistItemId {
    return new WishlistItemId(randomUUID());
  }

  static fromString(id: string): WishlistItemId {
    return new WishlistItemId(id);
  }
}
