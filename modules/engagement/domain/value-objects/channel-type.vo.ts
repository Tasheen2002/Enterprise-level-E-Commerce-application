export class ChannelType {
  private constructor(private readonly value: string) {}

  static email(): ChannelType {
    return new ChannelType("email");
  }

  static sms(): ChannelType {
    return new ChannelType("sms");
  }

  static whatsapp(): ChannelType {
    return new ChannelType("whatsapp");
  }

  static push(): ChannelType {
    return new ChannelType("push");
  }

  static fromString(value: string): ChannelType {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case "email":
        return ChannelType.email();
      case "sms":
        return ChannelType.sms();
      case "whatsapp":
        return ChannelType.whatsapp();
      case "push":
        return ChannelType.push();
      default:
        throw new Error(`Invalid channel type: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  isEmail(): boolean {
    return this.value === "email";
  }

  isSms(): boolean {
    return this.value === "sms";
  }

  isWhatsapp(): boolean {
    return this.value === "whatsapp";
  }

  isPush(): boolean {
    return this.value === "push";
  }

  equals(other: ChannelType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
