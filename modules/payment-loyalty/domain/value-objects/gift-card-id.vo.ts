import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class GiftCardId extends UuidId {
  private constructor(value: string) {
    super(value, "Gift Card ID");
  }

  static create(): GiftCardId {
    return new GiftCardId(randomUUID());
  }

  static fromString(value: string): GiftCardId {
    return new GiftCardId(value);
  }

  equals(other: GiftCardId | null | undefined): boolean {
    return super.equals(other);
  }
}