import {
  DomainValidationError,
} from "../errors/user-management.errors";

export enum PaymentMethodType {
  CARD = "card",
  WALLET = "wallet",
  BANK = "bank",
  COD = "cod",
  GIFT_CARD = "gift_card",
}

export namespace PaymentMethodType {
  export function fromString(type: string): PaymentMethodType {
    if (!type || typeof type !== "string") {
      throw new DomainValidationError(
        "Payment method type must be a non-empty string",
      );
    }

    switch (type.toLowerCase()) {
      case "card":
        return PaymentMethodType.CARD;
      case "wallet":
        return PaymentMethodType.WALLET;
      case "bank":
        return PaymentMethodType.BANK;
      case "cod":
        return PaymentMethodType.COD;
      case "gift_card":
        return PaymentMethodType.GIFT_CARD;
      default:
        throw new DomainValidationError(`Invalid payment method type: ${type}`);
    }
  }

  export function toString(type: PaymentMethodType): string {
    return type;
  }

  export function getAllValues(): PaymentMethodType[] {
    return [
      PaymentMethodType.CARD,
      PaymentMethodType.WALLET,
      PaymentMethodType.BANK,
      PaymentMethodType.COD,
      PaymentMethodType.GIFT_CARD,
    ];
  }

  export function getDisplayName(type: PaymentMethodType): string {
    switch (type) {
      case PaymentMethodType.CARD:
        return "Credit/Debit Card";
      case PaymentMethodType.WALLET:
        return "Digital Wallet";
      case PaymentMethodType.BANK:
        return "Bank Transfer";
      case PaymentMethodType.COD:
        return "Cash on Delivery";
      case PaymentMethodType.GIFT_CARD:
        return "Gift Card";
    }
  }
}
