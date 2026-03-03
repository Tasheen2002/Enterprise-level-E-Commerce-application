import { UuidId } from "@/api/src/shared/domain/value-objects/uuid-id.base";

export class TransactionId extends UuidId {
  private constructor(value: string) {
    super(value, "Transaction ID");
  }

  static create(value: string): TransactionId {
    return new TransactionId(value);
  }

  equals(other: TransactionId | null | undefined): boolean {
    return super.equals(other);
  }
}
