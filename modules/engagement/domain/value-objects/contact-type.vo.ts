import { DomainValidationError } from "../errors/engagement.errors";
import { ContactTypeEnum } from "../enums/engagement.enums";

export class ContactType {
  private constructor(private readonly value: ContactTypeEnum) {}

  static create(value: string): ContactType {
    return ContactType.fromString(value);
  }

  static fromString(value: string): ContactType {
    const normalized = value.toLowerCase().trim();

    if (!Object.values(ContactTypeEnum).includes(normalized as ContactTypeEnum)) {
      throw new DomainValidationError(`Invalid contact type: ${value}`);
    }

    return new ContactType(normalized as ContactTypeEnum);
  }

  static email(): ContactType {
    return new ContactType(ContactTypeEnum.EMAIL);
  }

  static phone(): ContactType {
    return new ContactType(ContactTypeEnum.PHONE);
  }

  getValue(): string {
    return this.value;
  }

  isEmail(): boolean {
    return this.value === ContactTypeEnum.EMAIL;
  }

  isPhone(): boolean {
    return this.value === ContactTypeEnum.PHONE;
  }

  equals(other: ContactType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
