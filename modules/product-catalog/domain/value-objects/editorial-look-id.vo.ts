import { randomUUID } from "crypto";
import { UuidId } from "@/api/src/shared/domain/value-objects/uuid-id.base";

export class EditorialLookId extends UuidId {
  private constructor(value: string) {
    super(value, "Editorial Look ID");
  }

  static create(): EditorialLookId {
    return new EditorialLookId(randomUUID());
  }

  static fromString(value: string): EditorialLookId {
    return new EditorialLookId(value);
  }

  equals(other: EditorialLookId | null | undefined): boolean {
    return super.equals(other);
  }
}
