import { DomainValidationError } from "../errors/inventory-management.errors";

// Pattern C (composite VO).
//
// Renamed from `SupplierContactProps` to `SupplierContactData` to match the
// canonical naming convention. We keep it exported because the Supplier
// entity's DTO mirrors this exact shape — strictly Pattern C says NOT to
// export, but defining a parallel SupplierContactDTO would just duplicate
// the same five fields. Document the deviation here rather than hiding it.
export interface SupplierContactData {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

// Backwards-compatibility alias. New code should import `SupplierContactData`.
/** @deprecated Use `SupplierContactData`. */
export type SupplierContactProps = SupplierContactData;

const CONTACT_NAME_MAX_LENGTH = 128;
const CONTACT_ROLE_MAX_LENGTH = 64;

export class SupplierContact {
  // Validation lives in the constructor so BOTH `create()` (with normalisation)
  // and `fromPersistence()` (raw, no normalisation) validate. Previously it
  // was in `create()` only — a reconstitution path would silently admit
  // invalid email/phone shapes.
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;

  private constructor(private readonly props: SupplierContactData) {
    SupplierContact.validate(props);
  }

  // Primary factory — normalises (trim, lowercase email) before validating.
  static create(props: SupplierContactData): SupplierContact {
    return new SupplierContact({
      name: props.name?.trim(),
      email: props.email?.trim().toLowerCase(),
      phone: props.phone?.trim(),
      role: props.role?.trim(),
    });
  }

  // Raw factory for repository reconstitution. Persisted values are already
  // canonical, so no normalisation. The constructor still validates.
  static fromPersistence(props: SupplierContactData): SupplierContact {
    return new SupplierContact({ ...props });
  }

  private static validate(props: SupplierContactData): void {
    if (props.email && !SupplierContact.EMAIL_REGEX.test(props.email)) {
      throw new DomainValidationError(
        `Invalid supplier contact email: ${props.email}`,
      );
    }
    if (props.phone && !SupplierContact.PHONE_REGEX.test(props.phone)) {
      throw new DomainValidationError(
        `Invalid supplier contact phone: ${props.phone}`,
      );
    }
    if (props.name && props.name.length > CONTACT_NAME_MAX_LENGTH) {
      throw new DomainValidationError(
        `Contact name cannot exceed ${CONTACT_NAME_MAX_LENGTH} characters`,
      );
    }
    if (props.role && props.role.length > CONTACT_ROLE_MAX_LENGTH) {
      throw new DomainValidationError(
        `Contact role cannot exceed ${CONTACT_ROLE_MAX_LENGTH} characters`,
      );
    }
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

  getValue(): SupplierContactData {
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
