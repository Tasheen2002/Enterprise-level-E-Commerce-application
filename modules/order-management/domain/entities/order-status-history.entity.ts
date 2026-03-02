import { OrderStatus } from "../value-objects";

export interface OrderStatusHistoryProps {
  historyId: number;
  orderId: string;
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  changedAt: Date;
  changedBy?: string;
}

export class OrderStatusHistory {
  private historyId: number;
  private orderId: string;
  private fromStatus?: OrderStatus;
  private toStatus: OrderStatus;
  private changedAt: Date;
  private changedBy?: string;

  private constructor(props: OrderStatusHistoryProps) {
    this.historyId = props.historyId;
    this.orderId = props.orderId;
    this.fromStatus = props.fromStatus;
    this.toStatus = props.toStatus;
    this.changedAt = props.changedAt;
    this.changedBy = props.changedBy;
  }

  static create(
    props: Omit<OrderStatusHistoryProps, "historyId" | "changedAt">,
  ): OrderStatusHistory {
    return new OrderStatusHistory({
      historyId: 0, // Will be assigned by database
      orderId: props.orderId,
      fromStatus: props.fromStatus,
      toStatus: props.toStatus,
      changedAt: new Date(),
      changedBy: props.changedBy,
    });
  }

  static reconstitute(props: OrderStatusHistoryProps): OrderStatusHistory {
    return new OrderStatusHistory(props);
  }

  getHistoryId(): number {
    return this.historyId;
  }

  getOrderId(): string {
    return this.orderId;
  }

  getFromStatus(): OrderStatus | undefined {
    return this.fromStatus;
  }

  getToStatus(): OrderStatus {
    return this.toStatus;
  }

  getChangedAt(): Date {
    return this.changedAt;
  }

  getChangedBy(): string | undefined {
    return this.changedBy;
  }

  isInitialStatus(): boolean {
    return !this.fromStatus;
  }

  equals(other: OrderStatusHistory): boolean {
    return this.historyId === other.historyId;
  }

  toSnapshot() {
    return {
      historyId: this.historyId,
      orderId: this.orderId,
      fromStatus: this.fromStatus?.getValue(),
      toStatus: this.toStatus.getValue(),
      changedAt: this.changedAt,
      changedBy: this.changedBy,
      isInitialStatus: this.isInitialStatus(),
    };
  }
}
