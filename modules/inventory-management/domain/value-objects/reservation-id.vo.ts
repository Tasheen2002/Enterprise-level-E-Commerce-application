import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class ReservationId extends UuidId {
  private constructor(value: string) {
    super(value, "Reservation ID");
  }

  static create(): ReservationId {
    return new ReservationId(randomUUID());
  }

  static fromString(id: string): ReservationId {
    return new ReservationId(id);
  }
}
