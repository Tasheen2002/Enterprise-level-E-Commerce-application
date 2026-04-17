import { DomainValidationError } from "../errors/engagement.errors";
import { AppointmentTypeEnum } from "../enums/engagement.enums";

export class AppointmentType {
  private constructor(private readonly value: AppointmentTypeEnum) {}

  static create(value: string): AppointmentType {
    return AppointmentType.fromString(value);
  }

  static fromString(value: string): AppointmentType {
    const normalized = value.toLowerCase().trim();

    if (!Object.values(AppointmentTypeEnum).includes(normalized as AppointmentTypeEnum)) {
      throw new DomainValidationError(`Invalid appointment type: ${value}`);
    }

    return new AppointmentType(normalized as AppointmentTypeEnum);
  }

  static stylist(): AppointmentType {
    return new AppointmentType(AppointmentTypeEnum.STYLIST);
  }

  static inStore(): AppointmentType {
    return new AppointmentType(AppointmentTypeEnum.IN_STORE);
  }

  getValue(): string {
    return this.value;
  }

  isStylist(): boolean {
    return this.value === AppointmentTypeEnum.STYLIST;
  }

  isInStore(): boolean {
    return this.value === AppointmentTypeEnum.IN_STORE;
  }

  equals(other: AppointmentType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
