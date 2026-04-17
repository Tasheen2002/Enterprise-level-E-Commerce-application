import { InvalidFormatError } from "../../../../packages/core/src/domain/domain-error";
import { BnplProviderEnum } from "../enums";

export class BnplProvider {
  private constructor(private readonly value: BnplProviderEnum) {}

  static create(value: string): BnplProvider {
    return BnplProvider.fromString(value);
  }

  static fromString(value: string): BnplProvider {
    const enumValue = Object.values(BnplProviderEnum).find((v) => v === value);
    if (!enumValue) {
      throw new InvalidFormatError("BNPL provider", Object.values(BnplProviderEnum).join(" | "));
    }
    return new BnplProvider(enumValue);
  }

  static koko(): BnplProvider {
    return new BnplProvider(BnplProviderEnum.KOKO);
  }

  static mintpay(): BnplProvider {
    return new BnplProvider(BnplProviderEnum.MINTPAY);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: BnplProvider): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  isKoko(): boolean {
    return this.value === BnplProviderEnum.KOKO;
  }

  isMintpay(): boolean {
    return this.value === BnplProviderEnum.MINTPAY;
  }
}
