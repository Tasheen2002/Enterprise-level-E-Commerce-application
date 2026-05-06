import { randomUUID } from 'crypto';
import { UuidId } from '../../../../packages/core/src/domain/value-objects/uuid-id.base';

export class AddressId extends UuidId {
  private constructor(value: string) {
    super(value, 'AddressId');
  }

  static create(): AddressId {
    return new AddressId(randomUUID());
  }

  static fromString(id: string): AddressId {
    return new AddressId(id);
  }
}
