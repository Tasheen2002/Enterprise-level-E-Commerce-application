import { IQuery } from "@/api/src/shared/application";

export interface GetUserByEmailQuery extends IQuery {
  email: string;
}

export interface GetUserByEmailResult {
  userId: string;
  emailVerified: boolean;
}
