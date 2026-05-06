import { DomainValidationError } from "../errors/engagement.errors";

export enum ContactTypeValue {
  EMAIL = "email",
  PHONE = "phone",
}

/** @deprecated Use `ContactTypeValue`. */
export const ContactTypeEnum = ContactTypeValue;
/** @deprecated Use `ContactTypeValue`. */
export type ContactTypeEnum = ContactTypeValue;

// Pattern D (Enum-Like VO).
export class ContactType {
  static readonly EMAIL = new ContactType(ContactTypeValue.EMAIL);
  static readonly PHONE = new ContactType(ContactTypeValue.PHONE);

  private static readonly ALL: ReadonlyArray<ContactType> = [
    ContactType.EMAIL,
    ContactType.PHONE,
  ];

  private constructor(private readonly value: ContactTypeValue) {
    if (!Object.values(ContactTypeValue).includes(value)) {
      throw new DomainValidationError(
        `Invalid contact type: ${value}. Must be one of: ${Object.values(ContactTypeValue).join(", ")}`,
      );
    }
  }

  static create(value: string): ContactType {
    const normalized = value.trim().toLowerCase();
    return (
      ContactType.ALL.find((t) => t.value === normalized) ??
      new ContactType(normalized as ContactTypeValue)
    );
  }

  static fromString(value: string): ContactType {
    return ContactType.create(value);
  }

  /** @deprecated Use `ContactType.EMAIL`. */
  static email(): ContactType { return ContactType.EMAIL; }
  /** @deprecated Use `ContactType.PHONE`. */
  static phone(): ContactType { return ContactType.PHONE; }

  getValue(): ContactTypeValue { return this.value; }

  isEmail(): boolean { return this.value === ContactTypeValue.EMAIL; }
  isPhone(): boolean { return this.value === ContactTypeValue.PHONE; }

  equals(other: ContactType): boolean { return this.value === other.value; }
  toString(): string { return this.value; }
}
