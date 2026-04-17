import {
  EmptyFieldError,
  InvalidFormatError,
} from '../../../../packages/core/src/domain/domain-error';

export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    if (!email || !email.trim()) throw new EmptyFieldError('Email');

    const trimmed = email.trim().toLowerCase();

    if (!Email.isValidEmail(trimmed)) throw new InvalidFormatError('email', 'valid email address');
    if (trimmed.length > 254) throw new InvalidFormatError('email', 'maximum 254 characters');

    return new Email(trimmed);
  }

  static fromString(value: string): Email {
    return new Email(value);
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  getValue(): string { return this.value; }
  getDomain(): string { return this.value.split('@')[1]; }
  getLocalPart(): string { return this.value.split('@')[0]; }

  equals(other: Email): boolean { return this.value === other.value; }
  toString(): string { return this.value; }

  isGmail(): boolean { return this.getDomain() === 'gmail.com'; }

  isPersonalEmail(): boolean {
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    return personalDomains.includes(this.getDomain());
  }

  isBusinessEmail(): boolean {
    return !this.isPersonalEmail();
  }
}
