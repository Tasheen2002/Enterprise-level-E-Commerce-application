import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";


export class OrderItemId extends UuidId {
  private constructor(value: string) {
    super(value, "OrderItemId");
  }

  static create(): OrderItemId {
    return new OrderItemId(randomUUID());
  }

  static fromString(value: string): OrderItemId {
    return new OrderItemId(value);
  }
}
