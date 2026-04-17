export enum GiftCardTransactionTypeEnum {
  ISSUE = "issue",
  REDEEM = "redeem",
  REFUND = "refund",
}

export enum GiftCardStatusEnum {
  ACTIVE = "active",
  REDEEMED = "redeemed",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

export enum PaymentIntentStatusEnum {
  REQUIRES_ACTION = "requires_action",
  AUTHORIZED = "authorized",
  CAPTURED = "captured",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum PaymentTransactionTypeEnum {
  AUTH = "auth",
  CAPTURE = "capture",
  REFUND = "refund",
  VOID = "void",
}

export enum BnplStatusEnum {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  FAILED = "failed",
}

export enum BnplProviderEnum {
  KOKO = "koko",
  MINTPAY = "mintpay",
}

export enum PromotionStatusEnum {
  ACTIVE = "active",
  INACTIVE = "inactive",
  EXPIRED = "expired",
  SCHEDULED = "scheduled",
}
