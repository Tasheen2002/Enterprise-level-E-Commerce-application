import { randomUUID } from "crypto";
import { UuidId } from "@/api/src/shared/domain/value-objects/uuid-id.base";

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

  equals(other: CartOwnerId | null | undefined): boolean {
    return super.equals(other);
  }
}
