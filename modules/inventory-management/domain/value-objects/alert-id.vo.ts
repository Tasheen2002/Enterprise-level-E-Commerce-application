import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class AlertId extends UuidId {
  private constructor(value: string) {
    super(value, "Alert ID");
  }

  static create(): AlertId {
    return new AlertId(randomUUID());
  }

  static fromString(id: string): AlertId {
    return new AlertId(id);
  }
}
