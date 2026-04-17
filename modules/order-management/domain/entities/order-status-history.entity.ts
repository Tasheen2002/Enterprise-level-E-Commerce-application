import { OrderStatus } from "../value-objects";

export interface OrderStatusHistoryProps {
  historyId: number | null;
  orderId: string;
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  changedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderStatusHistoryDTO {
  historyId: number | null;
  orderId: string;
  fromStatus?: string;
  toStatus: string;
  changedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export class OrderStatusHistory {
  private constructor(private props: OrderStatusHistoryProps) {}

  static create(
    params: Omit<
      OrderStatusHistoryProps,
      "historyId" | "createdAt" | "updatedAt"
    >,
  ): OrderStatusHistory {
    return new OrderStatusHistory({
      ...params,
      historyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: OrderStatusHistoryProps): OrderStatusHistory {
    return new OrderStatusHistory(props);
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

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
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
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
