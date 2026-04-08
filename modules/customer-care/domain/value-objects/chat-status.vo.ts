export class ChatStatus {
  private constructor(private readonly value: string) {}

  static active(): ChatStatus {
    return new ChatStatus("active");
  }

  static waiting(): ChatStatus {
    return new ChatStatus("waiting");
  }

  static ended(): ChatStatus {
    return new ChatStatus("ended");
  }

  static fromString(value: string): ChatStatus {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case "active":
        return ChatStatus.active();
      case "waiting":
        return ChatStatus.waiting();
      case "ended":
        return ChatStatus.ended();
      default:
        throw new Error(`Invalid chat status: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  isActive(): boolean {
    return this.value === "active";
  }

  isWaiting(): boolean {
    return this.value === "waiting";
  }

  isEnded(): boolean {
    return this.value === "ended";
  }

  equals(other: ChatStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
