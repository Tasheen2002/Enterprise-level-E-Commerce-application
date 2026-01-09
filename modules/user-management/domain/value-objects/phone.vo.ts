export class Phone {
  private readonly value: string;

  constructor(phone: string) {
    if (!phone) {
      throw new Error("Phone number is required");
    }

    const cleanedPhone = this.cleanPhoneNumber(phone);

    if (!this.isValidPhone(cleanedPhone)) {
      throw new Error("Invalid phone number format");
    }

    this.value = cleanedPhone;
  }

  private cleanPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    return phone.replace(/[^\d+]/g, "");
  }

  private isValidPhone(phone: string): boolean {
    // E.164 format: +[country code][number]
    // Supports: +1234567890 to +123456789012345
    const e164Regex = /^\+[1-9]\d{1,14}$/;

    // Also support local formats (10-11 digits)
    const localRegex = /^\d{10,11}$/;

    return e164Regex.test(phone) || localRegex.test(phone);
  }

  getValue(): string {
    return this.value;
  }

  getFormatted(): string {
    if (this.value.startsWith("+")) {
      return this.value;
    }

    // Format US numbers (assuming 10 digits)
    if (this.value.length === 10) {
      return `(${this.value.slice(0, 3)}) ${this.value.slice(
        3,
        6
      )}-${this.value.slice(6)}`;
    }

    return this.value;
  }

  getE164Format(): string {
    if (this.value.startsWith("+")) {
      return this.value;
    }

    // Assume US country code if no country code provided
    return `+1${this.value}`;
  }

  getCountryCode(): string | null {
    if (!this.value.startsWith("+")) {
      return null;
    }

    // Extract country code (1-3 digits after +)
    const match = this.value.match(/^\+(\d{1,3})/);
    return match ? match[1] : null;
  }

  equals(other: Phone): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static fromString(phone: string): Phone {
    return new Phone(phone);
  }

  // Business methods
  isUSNumber(): boolean {
    return this.getCountryCode() === "1" || this.value.length === 10;
  }

  isMobile(): boolean {
    if (this.isUSNumber()) {
      const firstThree = this.value.startsWith("+1")
        ? this.value.slice(2, 5)
        : this.value.slice(0, 3);

      // US mobile area codes (simplified list)
      const mobileAreaCodes = ["201", "202", "203", "212", "213", "214", "215"];
      return mobileAreaCodes.includes(firstThree);
    }

    return false;
  }
}
