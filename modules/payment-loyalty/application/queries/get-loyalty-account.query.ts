import { IQuery } from "@/api/src/shared/application";

export interface GetLoyaltyAccountQuery extends IQuery {
  userId: string;
  programId: string;
}
