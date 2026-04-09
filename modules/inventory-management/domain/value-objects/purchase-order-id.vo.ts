import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class PurchaseOrderId extends UuidId {
  private constructor(value: string) {
    super(value, "Purchase Order ID");
  }

  static create(value: string): PurchaseOrderId {
    return new PurchaseOrderId(value);
  }

  equals(other: PurchaseOrderId | null | undefined): boolean {
    return super.equals(other);
  }
}
