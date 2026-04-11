import { randomUUID } from 'crypto';
import { UuidId } from '../../../../packages/core/src/domain/value-objects/uuid-id.base';

export class MediaAssetId extends UuidId {
  private constructor(value: string) {
    super(value, 'MediaAssetId');
  }

  static create(): MediaAssetId {
    return new MediaAssetId(randomUUID());
  }

  static fromString(id: string): MediaAssetId {
    return new MediaAssetId(id);
  }
}
