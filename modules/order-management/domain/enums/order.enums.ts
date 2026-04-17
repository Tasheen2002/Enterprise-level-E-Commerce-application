export enum OrderStatusEnum {
  CREATED = "created",
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PAID = "paid",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  FULFILLED = "fulfilled", // Deprecating in favor of SHIPPED/DELIVERED
  PARTIALLY_RETURNED = "partially_returned",
  REFUNDED = "refunded",
  CANCELLED = "cancelled",
}

export enum OrderSourceEnum {
  WEB = "web",
  MOBILE = "mobile",
}
