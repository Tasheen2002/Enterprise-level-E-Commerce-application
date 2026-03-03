import { randomUUID } from "crypto";
import { UuidId } from "@/api/src/shared/domain/value-objects/uuid-id.base";

export class MediaAssetId extends UuidId {
  private constructor(value: string) {
    super(value, "Media Asset ID");
  }

  static create(): MediaAssetId {
    return new MediaAssetId(randomUUID());
  }

  static fromString(value: string): MediaAssetId {
    return new MediaAssetId(value);
  }

  equals(other: MediaAssetId | null | undefined): boolean {
    return super.equals(other);
  }
}
