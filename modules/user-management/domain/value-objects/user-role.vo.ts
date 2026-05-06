import { DomainValidationError } from "../errors/user-management.errors";


export enum UserRole {
  GUEST = "GUEST",
  CUSTOMER = "CUSTOMER",
  ADMIN = "ADMIN",
  INVENTORY_STAFF = "INVENTORY_STAFF",
  CUSTOMER_SERVICE = "CUSTOMER_SERVICE",
  ANALYST = "ANALYST",
  VENDOR = "VENDOR",
}


const ALL_USER_ROLES: readonly UserRole[] = [
  UserRole.GUEST,
  UserRole.CUSTOMER,
  UserRole.ADMIN,
  UserRole.INVENTORY_STAFF,
  UserRole.CUSTOMER_SERVICE,
  UserRole.ANALYST,
  UserRole.VENDOR,
];

export namespace UserRole {
  export function fromString(role: string): UserRole {
    if (!role || typeof role !== "string") {
      throw new DomainValidationError(
        "User role must be a non-empty string",
      );
    }
    const normalized = role.toUpperCase();
    if (!ALL_USER_ROLES.includes(normalized as UserRole)) {
      throw new DomainValidationError(`Invalid user role: ${role}`);
    }
    return normalized as UserRole;
  }

  export function getAllValues(): UserRole[] {
    return [...ALL_USER_ROLES];
  }

  export function getDisplayName(role: UserRole): string {
    switch (role) {
      case UserRole.GUEST: return "Guest";
      case UserRole.CUSTOMER: return "Customer";
      case UserRole.ADMIN: return "Admin";
      case UserRole.INVENTORY_STAFF: return "Inventory Staff";
      case UserRole.CUSTOMER_SERVICE: return "Customer Service";
      case UserRole.ANALYST: return "Analyst";
      case UserRole.VENDOR: return "Vendor";
    }
  }

  // Whether the role is a staff-level role (i.e. internal to the company,
  // not a customer/guest). Useful for authorization checks at the service
  // layer that distinguish "your own resource" from "any resource".
  export function isStaff(role: UserRole): boolean {
    return (
      role === UserRole.ADMIN ||
      role === UserRole.INVENTORY_STAFF ||
      role === UserRole.CUSTOMER_SERVICE ||
      role === UserRole.ANALYST
    );
  }
}
