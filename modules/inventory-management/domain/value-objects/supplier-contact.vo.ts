import { DomainValidationError } from "../errors/inventory-management.errors";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;

export interface SupplierContactProps {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export class SupplierContact {
  private constructor(private readonly props: SupplierContactProps) {}

  static create(props: SupplierContactProps): SupplierContact {
    if (props.email && !EMAIL_REGEX.test(props.email.trim())) {
      throw new DomainValidationError(
        `Invalid supplier contact email: ${props.email}`,
      );
    }
    if (props.phone && !PHONE_REGEX.test(props.phone.trim())) {
      throw new DomainValidationError(
        `Invalid supplier contact phone: ${props.phone}`,
      );
    }
    if (props.name && props.name.trim().length > 128) {
      throw new DomainValidationError(
        "Contact name cannot exceed 128 characters",
      );
    }
    if (props.role && props.role.trim().length > 64) {
      throw new DomainValidationError(
        "Contact role cannot exceed 64 characters",
      );
    }
    return new SupplierContact({
      name: props.name?.trim(),
      email: props.email?.trim().toLowerCase(),
      phone: props.phone?.trim(),
      role: props.role?.trim(),
    });
  }

  get name(): string | undefined {
    return this.props.name;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get role(): string | undefined {
    return this.props.role;
  }

  equals(other: SupplierContact): boolean {
    return (
      this.props.name === other.props.name &&
      this.props.email === other.props.email &&
      this.props.phone === other.props.phone &&
      this.props.role === other.props.role
    );
  }

  getValue(): SupplierContactProps {
    return { ...this.props };
  }

  toString(): string {
    const name = this.props.name ?? "";
    const email = this.props.email ?? "";
    if (name && email) return `${name} <${email}>`;
    if (name) return name;
    if (email) return email;
    return "";
  }
}
