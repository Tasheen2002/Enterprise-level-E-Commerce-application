import { IQuery } from "@/api/src/shared/application";

export interface GetGiftCardBalanceQuery extends IQuery {
  codeOrId: string;
}
