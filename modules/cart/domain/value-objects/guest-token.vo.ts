import { randomBytes } from "crypto";
import { GUEST_TOKEN_BYTE_LENGTH, GUEST_TOKEN_HEX_LENGTH } from "../constants";
import { DomainValidationError } from "../errors/cart.errors";

export class GuestToken {
  private constructor(private readonly value: string) {}

  private static generate(): string {
    return randomBytes(GUEST_TOKEN_BYTE_LENGTH).toString("hex");
  }

  private static validate(token: string): void {
    const tokenRegex = new RegExp(`^[a-f0-9]{${GUEST_TOKEN_HEX_LENGTH}}$`, "i");
    if (!tokenRegex.test(token)) {
      throw new DomainValidationError("Invalid guest token format");
    }
  }

  static create(): GuestToken {
    return new GuestToken(GuestToken.generate());
  }

  static fromString(value: string): GuestToken {
    GuestToken.validate(value);
    return new GuestToken(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: GuestToken): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  getPrefix(length: number = 8): string {
    return this.value.substring(0, length);
  }

  getSuffix(length: number = 8): string {
    return this.value.substring(this.value.length - length);
  }

  getMasked(): string {
    return `${this.getPrefix(4)}****${this.getSuffix(4)}`;
  }
}
