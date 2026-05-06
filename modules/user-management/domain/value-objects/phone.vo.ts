import { DomainValidationError } from '../errors/user-management.errors';

export class Phone {
  private constructor(private readonly value: string) {
    if (!value) throw new DomainValidationError('Phone number is required');
    if (!Phone.isValidPhone(value)) throw new DomainValidationError('Invalid phone number format');
  }

  static create(phone: string): Phone {
    const cleaned = phone.replace(/[^\d+]/g, '');
    return new Phone(cleaned);
  }

  static fromString(value: string): Phone {
    return new Phone(value);
  }

  private static isValidPhone(phone: string): boolean {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    const localRegex = /^\d{10,11}$/;
    return e164Regex.test(phone) || localRegex.test(phone);
  }

  getValue(): string { return this.value; }

  getFormatted(): string {
    if (this.value.startsWith('+')) return this.value;
    if (this.value.length === 10) {
      return `(${this.value.slice(0, 3)}) ${this.value.slice(3, 6)}-${this.value.slice(6)}`;
    }
    return this.value;
  }

  getE164Format(): string {
    if (this.value.startsWith('+')) return this.value;
    return `+1${this.value}`;
  }

  getCountryCode(): string | null {
    if (!this.value.startsWith('+')) return null;
    const match = this.value.match(/^\+(\d{1,3})/);
    return match ? match[1] : null;
  }

  equals(other: Phone): boolean { return this.value === other.value; }
  toString(): string { return this.value; }

  isUSNumber(): boolean {
    return this.getCountryCode() === '1' || this.value.length === 10;
  }

  isMobile(): boolean {
    if (this.isUSNumber()) {
      const firstThree = this.value.startsWith('+1')
        ? this.value.slice(2, 5)
        : this.value.slice(0, 3);
      const mobileAreaCodes = ['201', '202', '203', '212', '213', '214', '215'];
      return mobileAreaCodes.includes(firstThree);
    }
    return false;
  }
}
