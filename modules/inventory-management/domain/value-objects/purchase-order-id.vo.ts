import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class PurchaseOrderId extends UuidId {
  private constructor(value: string) {
    super(value, "Purchase Order ID");
  }

  static create(): PurchaseOrderId {
    return new PurchaseOrderId(randomUUID());
  }

  static fromString(id: string): PurchaseOrderId {
    return new PurchaseOrderId(id);
  }
}
