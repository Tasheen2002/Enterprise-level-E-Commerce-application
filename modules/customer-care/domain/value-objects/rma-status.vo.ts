export class RmaStatus {
  private constructor(private readonly value: string) {}

  static eligibility(): RmaStatus {
    return new RmaStatus("eligibility");
  }

  static approved(): RmaStatus {
    return new RmaStatus("approved");
  }

  static inTransit(): RmaStatus {
    return new RmaStatus("in_transit");
  }

  static received(): RmaStatus {
    return new RmaStatus("received");
  }

  static refunded(): RmaStatus {
    return new RmaStatus("refunded");
  }

  static rejected(): RmaStatus {
    return new RmaStatus("rejected");
  }

  static fromString(value: string): RmaStatus {
    const normalized = value.toLowerCase().trim();
    switch (normalized) {
      case "eligibility":
        return RmaStatus.eligibility();
      case "approved":
        return RmaStatus.approved();
      case "in_transit":
        return RmaStatus.inTransit();
      case "received":
        return RmaStatus.received();
      case "refunded":
        return RmaStatus.refunded();
      case "rejected":
        return RmaStatus.rejected();
      default:
        throw new Error(`Invalid RMA status: ${value}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  isEligibility(): boolean {
    return this.value === "eligibility";
  }

  isApproved(): boolean {
    return this.value === "approved";
  }

  isInTransit(): boolean {
    return this.value === "in_transit";
  }

  isReceived(): boolean {
    return this.value === "received";
  }

  isRefunded(): boolean {
    return this.value === "refunded";
  }

  isRejected(): boolean {
    return this.value === "rejected";
  }

  equals(other: RmaStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
