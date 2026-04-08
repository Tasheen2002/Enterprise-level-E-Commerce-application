export class ContactType {
  private constructor(private readonly value: string) {}

  static email(): ContactType {
    return new ContactType("email");
  }

  static phone(): ContactType {
    return new ContactType("phone");
  }

  static fromString(value: string): ContactType {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case "email":
        return ContactType.email();
      case "phone":
        return ContactType.phone();
      default:
        throw new Error(`Invalid contact type: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  isEmail(): boolean {
    return this.value === "email";
  }

  isPhone(): boolean {
    return this.value === "phone";
  }

  equals(other: ContactType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
