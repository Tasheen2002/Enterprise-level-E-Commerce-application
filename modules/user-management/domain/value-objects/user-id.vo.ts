import { randomUUID } from "crypto";
import { UuidId } from "@/api/src/shared/domain/value-objects/uuid-id.base";

export class UserId extends UuidId {
  private constructor(value: string) {
    super(value, "User ID");
  }

  static create(): UserId {
    return new UserId(randomUUID());
  }

  static fromString(value: string): UserId {
    return new UserId(value);
  }

  equals(other: UserId | null | undefined): boolean {
    return super.equals(other);
  }
}
