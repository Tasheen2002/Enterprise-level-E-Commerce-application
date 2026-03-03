import { DomainValidationError } from "../errors";
export class BnplProvider {
  private constructor(private readonly value: string) {}

  static create(value: string): BnplProvider {
    if (!value || value.trim().length === 0) {
      throw new DomainValidationError("BNPL provider cannot be empty");
    }
    return new BnplProvider(value.trim().toLowerCase());
  }

  static readonly KOKO = new BnplProvider("koko");
  static readonly MINTPAY = new BnplProvider("mintpay");

  getValue(): string {
    return this.value;
  }

  equals(other: BnplProvider): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
