export class ChatSenderType {
  private constructor(private readonly value: string) {}

  static user(): ChatSenderType {
    return new ChatSenderType("user");
  }

  static agent(): ChatSenderType {
    return new ChatSenderType("agent");
  }

  static fromString(value: string): ChatSenderType {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case "user":
        return ChatSenderType.user();
      case "agent":
        return ChatSenderType.agent();
      default:
        throw new Error(`Invalid chat sender type: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  isUser(): boolean {
    return this.value === "user";
  }

  isAgent(): boolean {
    return this.value === "agent";
  }

  equals(other: ChatSenderType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
