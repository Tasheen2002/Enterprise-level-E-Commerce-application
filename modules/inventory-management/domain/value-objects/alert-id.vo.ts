import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class AlertId extends UuidId {
  private constructor(value: string) {
    super(value, "Alert ID");
  }

  static create(value: string): AlertId {
    return new AlertId(value);
  }

  equals(other: AlertId | null | undefined): boolean {
    return super.equals(other);
  }
}
