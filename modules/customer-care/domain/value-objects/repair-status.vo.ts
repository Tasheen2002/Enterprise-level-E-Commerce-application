export class RepairStatus {
  private constructor(private readonly value: string) {}

  static pending(): RepairStatus {
    return new RepairStatus("pending");
  }

  static inProgress(): RepairStatus {
    return new RepairStatus("in_progress");
  }

  static completed(): RepairStatus {
    return new RepairStatus("completed");
  }

  static failed(): RepairStatus {
    return new RepairStatus("failed");
  }

  static cancelled(): RepairStatus {
    return new RepairStatus("cancelled");
  }

  static fromString(value: string): RepairStatus {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case "pending":
        return RepairStatus.pending();
      case "in_progress":
        return RepairStatus.inProgress();
      case "completed":
        return RepairStatus.completed();
      case "failed":
        return RepairStatus.failed();
      case "cancelled":
        return RepairStatus.cancelled();
      default:
        throw new Error(`Invalid repair status: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  isPending(): boolean {
    return this.value === "pending";
  }

  isInProgress(): boolean {
    return this.value === "in_progress";
  }

  isCompleted(): boolean {
    return this.value === "completed";
  }

  isFailed(): boolean {
    return this.value === "failed";
  }

  isCancelled(): boolean {
    return this.value === "cancelled";
  }

  equals(other: RepairStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
