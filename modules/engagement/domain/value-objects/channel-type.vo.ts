import { DomainValidationError } from "../errors/engagement.errors";

export enum ChannelTypeValue {
  EMAIL = "email",
  SMS = "sms",
  WHATSAPP = "whatsapp",
  PUSH = "push",
}

/** @deprecated Use `ChannelTypeValue`. */
export const ChannelTypeEnum = ChannelTypeValue;
/** @deprecated Use `ChannelTypeValue`. */
export type ChannelTypeEnum = ChannelTypeValue;

// Pattern D (Enum-Like VO).
export class ChannelType {
  static readonly EMAIL = new ChannelType(ChannelTypeValue.EMAIL);
  static readonly SMS = new ChannelType(ChannelTypeValue.SMS);
  static readonly WHATSAPP = new ChannelType(ChannelTypeValue.WHATSAPP);
  static readonly PUSH = new ChannelType(ChannelTypeValue.PUSH);

  private static readonly ALL: ReadonlyArray<ChannelType> = [
    ChannelType.EMAIL,
    ChannelType.SMS,
    ChannelType.WHATSAPP,
    ChannelType.PUSH,
  ];

  private constructor(private readonly value: ChannelTypeValue) {
    if (!Object.values(ChannelTypeValue).includes(value)) {
      throw new DomainValidationError(
        `Invalid channel type: ${value}. Must be one of: ${Object.values(ChannelTypeValue).join(", ")}`,
      );
    }
  }

  static create(value: string): ChannelType {
    const normalized = value.trim().toLowerCase();
    return (
      ChannelType.ALL.find((t) => t.value === normalized) ??
      new ChannelType(normalized as ChannelTypeValue)
    );
  }

  static fromString(value: string): ChannelType {
    return ChannelType.create(value);
  }

  /** @deprecated Use `ChannelType.EMAIL`. */
  static email(): ChannelType { return ChannelType.EMAIL; }
  /** @deprecated Use `ChannelType.SMS`. */
  static sms(): ChannelType { return ChannelType.SMS; }
  /** @deprecated Use `ChannelType.WHATSAPP`. */
  static whatsapp(): ChannelType { return ChannelType.WHATSAPP; }
  /** @deprecated Use `ChannelType.PUSH`. */
  static push(): ChannelType { return ChannelType.PUSH; }

  getValue(): ChannelTypeValue { return this.value; }

  isEmail(): boolean { return this.value === ChannelTypeValue.EMAIL; }
  isSms(): boolean { return this.value === ChannelTypeValue.SMS; }
  isWhatsapp(): boolean { return this.value === ChannelTypeValue.WHATSAPP; }
  isPush(): boolean { return this.value === ChannelTypeValue.PUSH; }

  equals(other: ChannelType): boolean { return this.value === other.value; }
  toString(): string { return this.value; }
}
