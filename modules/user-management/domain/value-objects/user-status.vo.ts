import { DomainValidationError } from "../errors/user-management.errors";

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  BLOCKED = "blocked",
}


const ALL_USER_STATUSES: readonly UserStatus[] = [
  UserStatus.ACTIVE,
  UserStatus.INACTIVE,
  UserStatus.BLOCKED,
];

export namespace UserStatus {
  export function fromString(status: string): UserStatus {
    if (!status || typeof status !== "string") {
      throw new DomainValidationError(
        "User status must be a non-empty string",
      );
    }
    const normalized = status.toLowerCase();
    if (!ALL_USER_STATUSES.includes(normalized as UserStatus)) {
      throw new DomainValidationError(`Invalid user status: ${status}`);
    }
    return normalized as UserStatus;
  }

  export function getAllValues(): UserStatus[] {
    return [...ALL_USER_STATUSES];
  }

  export function getDisplayName(status: UserStatus): string {
    switch (status) {
      case UserStatus.ACTIVE: return "Active";
      case UserStatus.INACTIVE: return "Inactive";
      case UserStatus.BLOCKED: return "Blocked";
    }
  }
}
