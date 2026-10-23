import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class EditorialLookId extends UuidId {
  declare private readonly _uuidBrand: void;

  private constructor(value: string) {
    super(value, "EditorialLookId");
  }

  static create(): EditorialLookId {
    return new EditorialLookId(randomUUID());
  }

  static fromString(id: string): EditorialLookId {
    return new EditorialLookId(id);
  }
}
