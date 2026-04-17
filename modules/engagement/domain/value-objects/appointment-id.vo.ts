import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class AppointmentId extends UuidId {
  private constructor(value: string) {
    super(value, "AppointmentId");
  }

  static create(): AppointmentId {
    return new AppointmentId(randomUUID());
  }

  static fromString(value: string): AppointmentId {
    return new AppointmentId(value);
  }
}
