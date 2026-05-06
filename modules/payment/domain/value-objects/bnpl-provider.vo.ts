import { DomainValidationError } from "../errors/payment-loyalty.errors";

export enum BnplProviderValue {
  KOKO = "koko",
  MINTPAY = "mintpay",
}

/** @deprecated Use `BnplProviderValue`. */
export const BnplProviderEnum = BnplProviderValue;
/** @deprecated Use `BnplProviderValue`. */
export type BnplProviderEnum = BnplProviderValue;

// Pattern D (Enum-Like VO).
export class BnplProvider {
  static readonly KOKO = new BnplProvider(BnplProviderValue.KOKO);
  static readonly MINTPAY = new BnplProvider(BnplProviderValue.MINTPAY);

  private static readonly ALL: ReadonlyArray<BnplProvider> = [
    BnplProvider.KOKO,
    BnplProvider.MINTPAY,
  ];

  private constructor(private readonly value: BnplProviderValue) {
    if (!Object.values(BnplProviderValue).includes(value)) {
      throw new DomainValidationError(
        `Invalid BNPL provider: ${value}. Must be one of: ${Object.values(BnplProviderValue).join(", ")}`,
      );
    }
  }

  static create(value: string): BnplProvider {
    const normalized = value.trim().toLowerCase();
    return (
      BnplProvider.ALL.find((t) => t.value === normalized) ??
      new BnplProvider(normalized as BnplProviderValue)
    );
  }

  static fromString(value: string): BnplProvider {
    return BnplProvider.create(value);
  }

  /** @deprecated Use `BnplProvider.KOKO`. */
  static koko(): BnplProvider { return BnplProvider.KOKO; }
  /** @deprecated Use `BnplProvider.MINTPAY`. */
  static mintpay(): BnplProvider { return BnplProvider.MINTPAY; }

  getValue(): BnplProviderValue { return this.value; }

  isKoko(): boolean { return this.value === BnplProviderValue.KOKO; }
  isMintpay(): boolean { return this.value === BnplProviderValue.MINTPAY; }

  equals(other: BnplProvider): boolean { return this.value === other.value; }
  toString(): string { return this.value; }
}
