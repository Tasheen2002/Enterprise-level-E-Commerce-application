import { DomainValidationError } from "../errors/inventory-management.errors";

export enum ReservationStatus {
  ACTIVE = "active",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
  FULFILLED = "fulfilled",
}

export class ReservationStatusVO {
  // Pattern D: shared static instances per allowed value. Convenience
  // factory methods below (`active()`/`cancelled()`/etc.) now return these
  // shared instances rather than fresh objects — equality holds by reference.
  static readonly ACTIVE = new ReservationStatusVO(ReservationStatus.ACTIVE);
  static readonly CANCELLED = new ReservationStatusVO(ReservationStatus.CANCELLED);
  static readonly EXPIRED = new ReservationStatusVO(ReservationStatus.EXPIRED);
  static readonly FULFILLED = new ReservationStatusVO(ReservationStatus.FULFILLED);

  private static readonly ALL: ReadonlyArray<ReservationStatusVO> = [
    ReservationStatusVO.ACTIVE,
    ReservationStatusVO.CANCELLED,
    ReservationStatusVO.EXPIRED,
    ReservationStatusVO.FULFILLED,
  ];

  // Validation lives in the constructor so BOTH `create()` and `fromString()`
  // validate. All factories route through `create()` to get shared-instance
  // reference equality on success.
  private constructor(private readonly value: ReservationStatus) {
    if (!Object.values(ReservationStatus).includes(value)) {
      throw new DomainValidationError(
        `Invalid reservation status: ${value}. Must be one of: ${Object.values(ReservationStatus).join(", ")}`,
      );
    }
  }

  static create(value: string): ReservationStatusVO {
    const normalized = value.toLowerCase();
    return (
      ReservationStatusVO.ALL.find((s) => s.value === normalized) ??
      new ReservationStatusVO(normalized as ReservationStatus)
    );
  }

  static fromString(value: string): ReservationStatusVO {
    return ReservationStatusVO.create(value);
  }

  // Convenience factories — return the shared static instance.
  static active(): ReservationStatusVO {
    return ReservationStatusVO.ACTIVE;
  }

  static cancelled(): ReservationStatusVO {
    return ReservationStatusVO.CANCELLED;
  }

  static expired(): ReservationStatusVO {
    return ReservationStatusVO.EXPIRED;
  }

  static fulfilled(): ReservationStatusVO {
    return ReservationStatusVO.FULFILLED;
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
