import { IQuery } from "@/api/src/shared/application";

export interface GetActiveCartByGuestTokenQuery extends IQuery {
  guestToken: string;
}
