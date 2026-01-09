export class Email {
  private readonly value: string;

  constructor(email: string) {
    if (!email) {
      throw new Error("Email is required");
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!this.isValidEmail(trimmedEmail)) {
      throw new Error("Invalid email format");
    }

    if (trimmedEmail.length > 254) {
      throw new Error("Email is too long (maximum 254 characters)");
    }
    this.value = trimmedEmail;
  }

  private isValidEmail(email: string): boolean {
    // RFC 5322 compliant email regex (simplified)
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  getValue(): string {
    return this.value;
  }

  getDomain(): string {
    return this.value.split("@")[1];
  }

  getLocalPart(): string {
    return this.value.split("@")[0];
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static fromString(email: string): Email {
    return new Email(email);
  }

  // Common business methods
  isGmail(): boolean {
    return this.getDomain() === "gmail.com";
  }
  isPersonalEmail(): boolean {
    const personalDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
    ];
    return personalDomains.includes(this.getDomain());
  }

  isBusinessEmail(): boolean {
    const personalDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
    ];
    return !personalDomains.includes(this.getDomain());
  }
}
