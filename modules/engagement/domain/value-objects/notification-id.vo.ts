import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class NotificationId extends UuidId {
  declare private readonly _uuidBrand: void;

  private constructor(value: string) {
    super(value, "NotificationId");
  }

  static create(): NotificationId {
    return new NotificationId(randomUUID());
  }

  static fromString(value: string): NotificationId {
    return new NotificationId(value);
  }
}
