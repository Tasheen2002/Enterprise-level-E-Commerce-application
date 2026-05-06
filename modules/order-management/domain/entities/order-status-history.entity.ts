import { OrderStatus } from "../value-objects";
import { DomainValidationError } from "../errors/order-management.errors";


export interface OrderStatusHistoryProps {
  historyId: number | null;
  orderId: string;
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  changedBy?: string;
  changedAt: Date;
}

export interface OrderStatusHistoryDTO {
  historyId: number | null;
  orderId: string;
  fromStatus?: string;
  toStatus: string;
  changedBy?: string;
  changedAt: string;
  isInitialStatus: boolean;
}

export class OrderStatusHistory {
  private constructor(private props: OrderStatusHistoryProps) {
    OrderStatusHistory.validate(props);
  }

  static create(
    params: Omit<OrderStatusHistoryProps, "historyId" | "changedAt">,
  ): OrderStatusHistory {
    return new OrderStatusHistory({
      ...params,
      historyId: null,
      changedAt: new Date(),
    });
  }

  static fromPersistence(props: OrderStatusHistoryProps): OrderStatusHistory {
    return new OrderStatusHistory(props);
  }

  // Always-applicable invariants. Run on every construction path.
  private static validate(props: OrderStatusHistoryProps): void {
    if (!props.orderId || props.orderId.trim().length === 0) {
      throw new DomainValidationError("Order ID is required");
    }
  }

  get historyId(): number | null {
    return this.props.historyId;
  }

  get orderId(): string {
    return this.props.orderId;
  }

  get fromStatus(): OrderStatus | undefined {
    return this.props.fromStatus;
  }

  get toStatus(): OrderStatus {
    return this.props.toStatus;
  }

  get changedBy(): string | undefined {
    return this.props.changedBy;
  }

  get changedAt(): Date {
    return this.props.changedAt;
  }

  isInitialStatus(): boolean {
    return !this.props.fromStatus;
  }

  equals(other: OrderStatusHistory): boolean {
    if (this.props.historyId === null || other.props.historyId === null) {
      return false;
    }
    return this.props.historyId === other.props.historyId;
  }

  static toDTO(entity: OrderStatusHistory): OrderStatusHistoryDTO {
    return {
      historyId: entity.props.historyId,
      orderId: entity.props.orderId,
      fromStatus: entity.props.fromStatus?.getValue(),
      toStatus: entity.props.toStatus.getValue(),
      changedBy: entity.props.changedBy,
      changedAt: entity.props.changedAt.toISOString(),
      isInitialStatus: entity.isInitialStatus(),
    };
  }
}
