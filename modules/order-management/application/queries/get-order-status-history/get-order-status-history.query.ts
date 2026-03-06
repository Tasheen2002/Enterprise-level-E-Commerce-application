import { IQuery } from "@/api/src/shared/application";

export interface StatusHistoryResult {
  historyId: number;
  orderId: string;
  fromStatus?: string;
  toStatus: string;
  changedAt: Date;
  changedBy?: string;
  isInitialStatus: boolean;
}

export interface GetOrderStatusHistoryQuery extends IQuery {
  orderId: string;
  limit?: number;
  offset?: number;
}
