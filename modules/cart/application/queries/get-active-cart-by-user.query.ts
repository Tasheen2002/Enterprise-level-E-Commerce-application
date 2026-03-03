import { IQuery } from "@/api/src/shared/application";

export interface GetActiveCartByUserQuery extends IQuery {
  userId: string;
}
