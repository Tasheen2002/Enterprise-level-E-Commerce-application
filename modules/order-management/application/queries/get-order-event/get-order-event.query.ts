import { IQuery } from "@/api/src/shared/application";

export interface OrderEventResult {
  eventId: number;
  orderId: string;
  eventType: string;
  payload: Record<string, any>;
  createdAt: Date;
}

export interface GetOrderEventQuery extends IQuery {
  eventId: number;
}
