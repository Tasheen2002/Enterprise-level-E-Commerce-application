import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class SocialLoginId extends UuidId {
  declare private readonly _uuidBrand: void;

  private constructor(value: string) {
    super(value, "SocialLoginId");
  }

  static create(): SocialLoginId {
    return new SocialLoginId(randomUUID());
  }

  static fromString(id: string): SocialLoginId {
    return new SocialLoginId(id);
  }
}
