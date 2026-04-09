import { randomUUID } from 'crypto';
import { UuidId } from '../../../../packages/core/src/domain/value-objects/uuid-id.base';

export class PaymentMethodId extends UuidId {
  private constructor(value: string) {
    super(value, 'PaymentMethodId');
  }

  static create(): PaymentMethodId {
    return new PaymentMethodId(randomUUID());
  }

  static fromString(id: string): PaymentMethodId {
    return new PaymentMethodId(id);
  }
}
