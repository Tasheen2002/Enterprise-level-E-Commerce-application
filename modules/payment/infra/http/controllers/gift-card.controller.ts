import { FastifyRequest, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "@/api/src/shared/interfaces/authenticated-request.interface";
import {
  CreateGiftCardHandler,
  RedeemGiftCardHandler,
  GetGiftCardBalanceHandler,
  GetGiftCardTransactionsHandler,
} from "../../../application";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface CreateGiftCardRequest {
  code: string;
  initialBalance: number;
  currency?: string;
  expiresAt?: string;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
}

export interface RedeemGiftCardRequest {
  amount: number;
  orderId: string;
}

export class GiftCardController {
  constructor(
    private readonly createHandler: CreateGiftCardHandler,
    private readonly redeemHandler: RedeemGiftCardHandler,
    private readonly balanceHandler: GetGiftCardBalanceHandler,
    private readonly listTransactionsHandler: GetGiftCardTransactionsHandler,
  ) {}

  async create(
    request: AuthenticatedRequest<{ Body: CreateGiftCardRequest }>,
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
    request: AuthenticatedRequest<{
      Params: { giftCardId: string };
      Body: RedeemGiftCardRequest;
    }>,
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

  async getBalance(
    request: FastifyRequest<{ Querystring: { codeOrId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.balanceHandler.handle({
        codeOrId: request.query.codeOrId,
        timestamp: new Date(),
      });
      if (result === null) {
        return ResponseHelper.notFound(reply, "Gift card not found");
      }
      return ResponseHelper.ok(reply, "Gift card balance retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listTransactions(
    request: FastifyRequest<{ Params: { giftCardId: string } }>,
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
}
