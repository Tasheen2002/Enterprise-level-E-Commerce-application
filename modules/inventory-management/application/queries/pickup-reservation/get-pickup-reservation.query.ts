import { IQuery } from "@/api/src/shared/application";

export interface GetPickupReservationQuery extends IQuery {
  reservationId: string;
}

export interface PickupReservationResult {
  reservationId: string;
  orderId: string;
  variantId: string;
  locationId: string;
  qty: number;
  expiresAt: Date;
  isExpired: boolean;
  isActive?: boolean;
  isCancelled?: boolean;
  isFulfilled?: boolean;
}
