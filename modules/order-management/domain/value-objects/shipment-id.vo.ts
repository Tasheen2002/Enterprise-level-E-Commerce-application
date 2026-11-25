import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class ShipmentId extends UuidId {
  declare private readonly _uuidBrand: void;

  private constructor(value: string) {
    super(value, "ShipmentId");
  }

  static create(): ShipmentId {
    return new ShipmentId(randomUUID());
  }

  static fromString(value: string): ShipmentId {
    return new ShipmentId(value);
  }
}
