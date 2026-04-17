export enum GiftCardTransactionTypeEnum {
  ISSUE = "issue",
  REDEEM = "redeem",
  REFUND = "refund",
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
