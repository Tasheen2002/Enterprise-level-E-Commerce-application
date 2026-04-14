import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id";

export class WishlistItemId extends UuidId {
  static create(): WishlistItemId {
    return new WishlistItemId(WishlistItemId.generateId());
  }

  static fromString(id: string): WishlistItemId {
    return new WishlistItemId(id);
  }
}
