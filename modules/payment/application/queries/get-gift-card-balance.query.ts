import {
  IQuery,
  IQueryHandler,
} from "../../../../packages/core/src/application/cqrs";
import { GiftCardService } from "../services/gift-card.service";

export interface GetGiftCardBalanceQuery extends IQuery {
  readonly codeOrId: string;
}

export class GetGiftCardBalanceHandler implements IQueryHandler<
  GetGiftCardBalanceQuery,
  number
> {
  constructor(private readonly giftCardService: GiftCardService) {}

  async handle(query: GetGiftCardBalanceQuery): Promise<number> {
    return this.giftCardService.getGiftCardBalance(query.codeOrId);
  }
}
