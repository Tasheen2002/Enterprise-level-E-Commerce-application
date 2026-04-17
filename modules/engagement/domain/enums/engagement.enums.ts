export enum AppointmentTypeEnum {
  STYLIST = "stylist",
  IN_STORE = "in-store",
}

export enum ChannelTypeEnum {
  EMAIL = "email",
  SMS = "sms",
  WHATSAPP = "whatsapp",
  PUSH = "push",
}

export enum ContactTypeEnum {
  EMAIL = "email",
  PHONE = "phone",
}

export enum NotificationStatusEnum {
  PENDING = "pending",
  SCHEDULED = "scheduled",
  SENDING = "sending",
  SENT = "sent",
  FAILED = "failed",
}

export enum NotificationTypeEnum {
  ORDER_CONFIRM = "order_confirm",
  SHIPPED = "shipped",
  RESTOCK = "restock",
  REVIEW_REQUEST = "review_request",
  CARE_GUIDE = "care_guide",
  PROMO = "promo",
}

export enum ReminderStatusEnum {
  PENDING = "pending",
  SENT = "sent",
  UNSUBSCRIBED = "unsubscribed",
}

export enum ReminderTypeEnum {
  RESTOCK = "restock",
  PRICE_DROP = "price_drop",
}

export enum ReviewStatusEnum {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  FLAGGED = "flagged",
}

export enum SubscriptionStatusEnum {
  ACTIVE = "active",
  UNSUBSCRIBED = "unsubscribed",
  BOUNCED = "bounced",
  SPAM = "spam",
}
