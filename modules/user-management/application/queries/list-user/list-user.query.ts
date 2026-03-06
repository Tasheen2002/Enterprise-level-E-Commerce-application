import { IQuery } from "@/api/src/shared/application";
import { UserRole, UserStatus } from "../../../domain/entities/user.entity";

export interface ListUsersQuery extends IQuery {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  emailVerified?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "email";
  sortOrder?: "asc" | "desc";
}

export interface ListUsersResult {
  users: Array<{
    userId: string;
    email: string;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
    role: string;
    status: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    isGuest: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
