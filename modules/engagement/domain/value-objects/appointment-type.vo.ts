export class AppointmentType {
  private constructor(private readonly value: string) {}

  static stylist(): AppointmentType {
    return new AppointmentType("stylist");
  }

  static inStore(): AppointmentType {
    return new AppointmentType("in-store");
  }

  static fromString(value: string): AppointmentType {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case "stylist":
        return AppointmentType.stylist();
      case "in-store":
        return AppointmentType.inStore();
      default:
        throw new Error(`Invalid appointment type: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  isStylist(): boolean {
    return this.value === "stylist";
  }

  isInStore(): boolean {
    return this.value === "in-store";
  }

  equals(other: AppointmentType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
