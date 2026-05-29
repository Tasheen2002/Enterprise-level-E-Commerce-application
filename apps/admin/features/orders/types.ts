export interface OrderStatusHistoryEntry {
  id: string;
  orderId: string;
  fromStatus?: string;
  toStatus: string;
  changedAt: string;
  changedBy?: string;
}

export interface OrderEventEntry {
  id: string;
  orderId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}
