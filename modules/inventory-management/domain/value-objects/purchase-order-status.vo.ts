import { DomainValidationError } from "../errors/inventory-management.errors";

export enum PurchaseOrderStatus {
  DRAFT = "draft",
  SENT = "sent",
  PART_RECEIVED = "part_received",
  RECEIVED = "received",
  CANCELLED = "cancelled",
}

export class PurchaseOrderStatusVO {
  private constructor(private readonly value: PurchaseOrderStatus) {}

  static create(value: string): PurchaseOrderStatusVO {
    const normalizedValue = value.toLowerCase();
    if (
      !Object.values(PurchaseOrderStatus).includes(
        normalizedValue as PurchaseOrderStatus,
      )
    ) {
      throw new DomainValidationError(
        `Invalid purchase order status: ${value}. Must be one of: ${Object.values(
          PurchaseOrderStatus,
        ).join(", ")}`,
      );
    }
    return new PurchaseOrderStatusVO(normalizedValue as PurchaseOrderStatus);
  }

  getValue(): PurchaseOrderStatus {
    return this.value;
  }

  equals(other: PurchaseOrderStatusVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  canTransitionTo(newStatus: PurchaseOrderStatusVO): boolean {
    const transitions: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
      [PurchaseOrderStatus.DRAFT]: [
        PurchaseOrderStatus.SENT,
        PurchaseOrderStatus.CANCELLED,
      ],
      [PurchaseOrderStatus.SENT]: [
        PurchaseOrderStatus.PART_RECEIVED,
        PurchaseOrderStatus.RECEIVED,
        PurchaseOrderStatus.CANCELLED,
      ],
      [PurchaseOrderStatus.PART_RECEIVED]: [
        PurchaseOrderStatus.RECEIVED,
        PurchaseOrderStatus.CANCELLED,
      ],
      [PurchaseOrderStatus.RECEIVED]: [PurchaseOrderStatus.CANCELLED],
      [PurchaseOrderStatus.CANCELLED]: [],
    };

    return transitions[this.value].includes(newStatus.getValue());
  }
}
