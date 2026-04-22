import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class BnplTransactionId extends UuidId {
  private constructor(value: string) {
    super(value, "BNPL Transaction ID");
  }

  static create(): BnplTransactionId {
    return new BnplTransactionId(randomUUID());
  }

  static fromString(value: string): BnplTransactionId {
    return new BnplTransactionId(value);
  }
}