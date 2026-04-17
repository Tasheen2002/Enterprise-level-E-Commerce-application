import { DomainValidationError } from "../errors/engagement.errors";
import { ChannelTypeEnum } from "../enums/engagement.enums";

export class ChannelType {
  private constructor(private readonly value: ChannelTypeEnum) {}

  static create(value: string): ChannelType {
    return ChannelType.fromString(value);
  }

  static fromString(value: string): ChannelType {
    const normalized = value.toLowerCase().trim();

    if (!Object.values(ChannelTypeEnum).includes(normalized as ChannelTypeEnum)) {
      throw new DomainValidationError(`Invalid channel type: ${value}`);
    }

    return new ChannelType(normalized as ChannelTypeEnum);
  }

  static email(): ChannelType {
    return new ChannelType(ChannelTypeEnum.EMAIL);
  }

  static sms(): ChannelType {
    return new ChannelType(ChannelTypeEnum.SMS);
  }

  static whatsapp(): ChannelType {
    return new ChannelType(ChannelTypeEnum.WHATSAPP);
  }

  static push(): ChannelType {
    return new ChannelType(ChannelTypeEnum.PUSH);
  }

  getValue(): string {
    return this.value;
  }

  isEmail(): boolean {
    return this.value === ChannelTypeEnum.EMAIL;
  }

  isSms(): boolean {
    return this.value === ChannelTypeEnum.SMS;
  }

  isWhatsapp(): boolean {
    return this.value === ChannelTypeEnum.WHATSAPP;
  }

  isPush(): boolean {
    return this.value === ChannelTypeEnum.PUSH;
  }

  equals(other: ChannelType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
