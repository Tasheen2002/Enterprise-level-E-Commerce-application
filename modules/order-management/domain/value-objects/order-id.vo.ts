import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class OrderId extends UuidId {
  private constructor(value: string) {
    super(value, "Order ID");
  }

  static create(): OrderId {
    return new OrderId(randomUUID());
  }

  static fromString(value: string): OrderId {
    return new OrderId(value);
  }
}
