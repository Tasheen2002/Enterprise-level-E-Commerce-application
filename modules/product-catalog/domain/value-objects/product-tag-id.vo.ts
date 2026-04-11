import { randomUUID } from 'crypto';
import { UuidId } from '../../../../packages/core/src/domain/value-objects/uuid-id.base';

export class ProductTagId extends UuidId {
  private constructor(value: string) {
    super(value, 'ProductTagId');
  }

  static create(): ProductTagId {
    return new ProductTagId(randomUUID());
  }

  static fromString(id: string): ProductTagId {
    return new ProductTagId(id);
  }
}
