import { IQuery } from "@/api/src/shared/application";

export interface GetUserDetailsQuery extends IQuery {
  userId: string;
}

export interface GetUserDetailsResult {
  userId: string;
  email: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  dateOfBirth: Date | null;
  residentOf: string | null;
  nationality: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  isGuest: boolean;
  createdAt: Date;
  updatedAt: Date;
}
