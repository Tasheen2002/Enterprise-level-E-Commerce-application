import { UuidId } from "@/api/src/shared/domain/value-objects/uuid-id.base";

export class ReservationId extends UuidId {
  private constructor(value: string) {
    super(value, "Reservation ID");
  }

  static create(value: string): ReservationId {
    return new ReservationId(value);
  }

  equals(other: ReservationId | null | undefined): boolean {
    return super.equals(other);
  }
}
