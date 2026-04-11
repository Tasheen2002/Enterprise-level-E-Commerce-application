import { randomUUID } from 'crypto';
import { UuidId } from '../../../../packages/core/src/domain/value-objects/uuid-id.base';

export class ProductId extends UuidId {
  private constructor(value: string) {
    super(value, 'ProductId');
  }

  static create(): ProductId {
    return new ProductId(randomUUID());
  }

  static fromString(id: string): ProductId {
    return new ProductId(id);
  }
}
