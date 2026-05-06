import { DomainValidationError } from "../errors/engagement.errors";


export enum AppointmentTypeValue {
  STYLIST = "stylist",
  IN_STORE = "in-store",
}

// Backwards-compatibility alias for code that still imports
// `AppointmentTypeEnum` from this module. Prefer `AppointmentTypeValue`.
/** @deprecated Use `AppointmentTypeValue`. */
export const AppointmentTypeEnum = AppointmentTypeValue;
/** @deprecated Use `AppointmentTypeValue`. */
export type AppointmentTypeEnum = AppointmentTypeValue;


export class AppointmentType {
  static readonly STYLIST = new AppointmentType(AppointmentTypeValue.STYLIST);
  static readonly IN_STORE = new AppointmentType(AppointmentTypeValue.IN_STORE);

  private static readonly ALL: ReadonlyArray<AppointmentType> = [
    AppointmentType.STYLIST,
    AppointmentType.IN_STORE,
  ];

  // Validation lives in the constructor so BOTH `create()` (input from a
  // service caller) and `fromString()` (raw, for repository reconstitution)
  // validate.
  private constructor(private readonly value: AppointmentTypeValue) {
    if (!Object.values(AppointmentTypeValue).includes(value)) {
      throw new DomainValidationError(
        `Invalid appointment type: ${value}. Must be one of: ${Object.values(AppointmentTypeValue).join(", ")}`,
      );
    }
  }

  static create(value: string): AppointmentType {
    const normalized = value.trim().toLowerCase();
    return (
      AppointmentType.ALL.find((t) => t.value === normalized) ??
      new AppointmentType(normalized as AppointmentTypeValue)
    );
  }

  static fromString(value: string): AppointmentType {
    return AppointmentType.create(value);
  }

  /** @deprecated Use `AppointmentType.STYLIST`. */
  static stylist(): AppointmentType { return AppointmentType.STYLIST; }
  /** @deprecated Use `AppointmentType.IN_STORE`. */
  static inStore(): AppointmentType { return AppointmentType.IN_STORE; }

  getValue(): AppointmentTypeValue { return this.value; }

  isStylist(): boolean { return this.value === AppointmentTypeValue.STYLIST; }
  isInStore(): boolean { return this.value === AppointmentTypeValue.IN_STORE; }

  equals(other: AppointmentType): boolean { return this.value === other.value; }
  toString(): string { return this.value; }
}
