import { IQuery } from "@/api/src/shared/application";

export interface OrderEventResult {
  eventId: number;
  orderId: string;
  eventType: string;
  payload: Record<string, any>;
  createdAt: Date;
}

export interface GetOrderEventsQuery extends IQuery {
  orderId: string;
  eventType?: string;
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "eventId";
  sortOrder?: "asc" | "desc";
}
