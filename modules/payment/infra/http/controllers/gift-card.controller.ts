import { FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreateGiftCardHandler,
  RedeemGiftCardHandler,
  GetGiftCardBalanceHandler,
  GetGiftCardTransactionsHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";
import {
  CreateGiftCardBody,
  RedeemGiftCardBody,
  GiftCardIdParams,
  GiftCardBalanceQuery,
} from "../validation/gift-card.schema";

export class GiftCardController {
  constructor(
    private readonly createHandler: CreateGiftCardHandler,
    private readonly redeemHandler: RedeemGiftCardHandler,
    private readonly balanceHandler: GetGiftCardBalanceHandler,
    private readonly listTransactionsHandler: GetGiftCardTransactionsHandler,
  ) {}

  async getBalance(
    request: AuthenticatedRequest<{ Querystring: GiftCardBalanceQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.balanceHandler.handle({
        codeOrId: request.query.codeOrId,
        timestamp: new Date(),
      });
      return ResponseHelper.ok(reply, "Gift card balance retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listTransactions(
    request: AuthenticatedRequest<{ Params: GiftCardIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listTransactionsHandler.handle({
        giftCardId: request.params.giftCardId,
        timestamp: new Date(),
      });
      return ResponseHelper.ok(reply, "Gift card transactions retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async create(
    request: AuthenticatedRequest<{ Body: CreateGiftCardBody }>,
    reply: FastifyReply,
  ) {
    try {
      const body = request.body;
      const result = await this.createHandler.handle({
        code: body.code,
        initialBalance: body.initialBalance,
        currency: body.currency,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
        recipientEmail: body.recipientEmail,
        recipientName: body.recipientName,
        message: body.message,
        timestamp: new Date(),
      });
      return ResponseHelper.fromCommand(reply, result, "Gift card created", 201);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async redeem(
    request: AuthenticatedRequest<{ Params: GiftCardIdParams; Body: RedeemGiftCardBody }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.redeemHandler.handle({
        giftCardId: request.params.giftCardId,
        amount: request.body.amount,
        orderId: request.body.orderId,
        userId: request.user.userId,
        timestamp: new Date(),
      });
      return ResponseHelper.fromCommand(reply, result, "Gift card redeemed");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
