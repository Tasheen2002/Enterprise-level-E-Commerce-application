import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class SubscriptionId extends UuidId {
  declare private readonly _uuidBrand: void;

  private constructor(value: string) {
    super(value, "SubscriptionId");
  }

  static create(): SubscriptionId {
    return new SubscriptionId(randomUUID());
  }

  static fromString(value: string): SubscriptionId {
    return new SubscriptionId(value);
  }
}
