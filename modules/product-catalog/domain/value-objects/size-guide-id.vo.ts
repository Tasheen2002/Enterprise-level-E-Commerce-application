import { randomUUID } from 'crypto';
import { UuidId } from '../../../../packages/core/src/domain/value-objects/uuid-id.base';

export class SizeGuideId extends UuidId {
  private constructor(value: string) {
    super(value, 'SizeGuideId');
  }

  static create(): SizeGuideId {
    return new SizeGuideId(randomUUID());
  }

  static fromString(id: string): SizeGuideId {
    return new SizeGuideId(id);
  }
}
