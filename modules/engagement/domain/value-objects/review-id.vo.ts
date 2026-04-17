import { randomUUID } from "crypto";
import { UuidId } from "../../../../packages/core/src/domain/value-objects/uuid-id.base";

export class ReviewId extends UuidId {
  private constructor(value: string) {
    super(value, "ReviewId");
  }

  static create(): ReviewId {
    return new ReviewId(randomUUID());
  }

  static fromString(value: string): ReviewId {
    return new ReviewId(value);
  }
}
