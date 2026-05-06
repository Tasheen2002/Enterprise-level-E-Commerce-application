import { DomainValidationError } from "../errors/inventory-management.errors";

export enum PurchaseOrderStatus {
  DRAFT = "draft",
  SENT = "sent",
  PART_RECEIVED = "part_received",
  RECEIVED = "received",
  CANCELLED = "cancelled",
}

export class PurchaseOrderStatusVO {
  // Pattern D: shared static instances per allowed value.
  static readonly DRAFT = new PurchaseOrderStatusVO(PurchaseOrderStatus.DRAFT);
  static readonly SENT = new PurchaseOrderStatusVO(PurchaseOrderStatus.SENT);
  static readonly PART_RECEIVED = new PurchaseOrderStatusVO(PurchaseOrderStatus.PART_RECEIVED);
  static readonly RECEIVED = new PurchaseOrderStatusVO(PurchaseOrderStatus.RECEIVED);
  static readonly CANCELLED = new PurchaseOrderStatusVO(PurchaseOrderStatus.CANCELLED);

  private static readonly ALL: ReadonlyArray<PurchaseOrderStatusVO> = [
    PurchaseOrderStatusVO.DRAFT,
    PurchaseOrderStatusVO.SENT,
    PurchaseOrderStatusVO.PART_RECEIVED,
    PurchaseOrderStatusVO.RECEIVED,
    PurchaseOrderStatusVO.CANCELLED,
  ];
  private constructor(private readonly value: PurchaseOrderStatus) {
    if (!Object.values(PurchaseOrderStatus).includes(value)) {
      throw new DomainValidationError(
        `Invalid purchase order status: ${value}. Must be one of: ${Object.values(
          PurchaseOrderStatus,
        ).join(", ")}`,
      );
    }
  }

  static create(value: string): PurchaseOrderStatusVO {
    const normalized = value.toLowerCase();
    return (
      PurchaseOrderStatusVO.ALL.find((s) => s.value === normalized) ??
      new PurchaseOrderStatusVO(normalized as PurchaseOrderStatus)
    );
  }

  static fromString(value: string): PurchaseOrderStatusVO {
    return PurchaseOrderStatusVO.create(value);
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
