import { FastifyRequest, FastifyReply } from "fastify";
import {
  GetGiftCardTransactionsQuery,
  GetGiftCardTransactionsHandler,
} from "../../../application";
import { GiftCardService } from "../../../application/services/gift-card.service";

export class GiftCardTransactionController {
  private listHandler: GetGiftCardTransactionsHandler;

  constructor(private readonly giftCardService: GiftCardService) {
    this.listHandler = new GetGiftCardTransactionsHandler(giftCardService);
  }

  async list(
    request: FastifyRequest<{ Params: { giftCardId: string } }>,
    reply: FastifyReply,
  ) {
    const result = await this.listHandler.handle({
      giftCardId: request.params.giftCardId,
      timestamp: new Date(),
    });
    return reply.code(result.success ? 200 : 400).send(result);
  }
}
