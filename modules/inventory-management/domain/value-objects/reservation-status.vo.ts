import { DomainValidationError } from "../errors/inventory-management.errors";

export enum ReservationStatus {
  ACTIVE = "active",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
  FULFILLED = "fulfilled",
}

export class ReservationStatusVO {
  private constructor(private readonly value: ReservationStatus) {}

  static create(value: string): ReservationStatusVO {
    const normalized = value.toLowerCase();
    if (
      !Object.values(ReservationStatus).includes(
        normalized as ReservationStatus,
      )
    ) {
      throw new DomainValidationError(
        `Invalid reservation status: ${value}. Must be one of: ${Object.values(ReservationStatus).join(", ")}`,
      );
    }
    return new ReservationStatusVO(normalized as ReservationStatus);
  }

  static active(): ReservationStatusVO {
    return new ReservationStatusVO(ReservationStatus.ACTIVE);
  }

  static cancelled(): ReservationStatusVO {
    return new ReservationStatusVO(ReservationStatus.CANCELLED);
  }

  static expired(): ReservationStatusVO {
    return new ReservationStatusVO(ReservationStatus.EXPIRED);
  }

  static fulfilled(): ReservationStatusVO {
    return new ReservationStatusVO(ReservationStatus.FULFILLED);
  }

  getValue(): ReservationStatus {
    return this.value;
  }

  isActive(): boolean {
    return this.value === ReservationStatus.ACTIVE;
  }

  isCancelled(): boolean {
    return this.value === ReservationStatus.CANCELLED;
  }

  isExpired(): boolean {
    return this.value === ReservationStatus.EXPIRED;
  }

  isFulfilled(): boolean {
    return this.value === ReservationStatus.FULFILLED;
  }

  canTransitionTo(next: ReservationStatusVO): boolean {
    const transitions: Record<ReservationStatus, ReservationStatus[]> = {
      [ReservationStatus.ACTIVE]: [
        ReservationStatus.CANCELLED,
        ReservationStatus.EXPIRED,
        ReservationStatus.FULFILLED,
      ],
      [ReservationStatus.CANCELLED]: [],
      [ReservationStatus.EXPIRED]: [],
      [ReservationStatus.FULFILLED]: [],
    };
    return transitions[this.value].includes(next.getValue());
  }

  equals(other: ReservationStatusVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
