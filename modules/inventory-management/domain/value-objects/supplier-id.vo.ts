import { UuidId } from "@/api/src/shared/domain/value-objects/uuid-id.base";

export class SupplierId extends UuidId {
  private constructor(value: string) {
    super(value, "Supplier ID");
  }

  static create(value: string): SupplierId {
    return new SupplierId(value);
  }

  equals(other: SupplierId | null | undefined): boolean {
    return super.equals(other);
  }
}
