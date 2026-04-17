import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class ReminderId extends UuidId {
  private constructor(value: string) {
    super(value, "ReminderId");
  }

  static create(): ReminderId {
    return new ReminderId(randomUUID());
  }

  static fromString(value: string): ReminderId {
    return new ReminderId(value);
  }
}
