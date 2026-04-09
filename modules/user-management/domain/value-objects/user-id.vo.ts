import { randomUUID } from 'crypto';
import { UuidId } from '../../../../packages/core/src/domain/value-objects/uuid-id.base';

export class UserId extends UuidId {
  private constructor(value: string) {
    super(value, 'UserId');
  }

  static create(): UserId {
    return new UserId(randomUUID());
  }

  static fromString(id: string): UserId {
    return new UserId(id);
  }
}
